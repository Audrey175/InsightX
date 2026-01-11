import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Layouts & Components
import DashboardLayout from "../../layouts/DashboardLayout";
import MRIViewer from "../../components/dashboard/MRI_Viewer";
import HeatmapViewer from "../../components/dashboard/HeatmapViewer";
import PatientSelector from "../../components/PatientSelector";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/button";

// Services & Types
import { API_BASE_URL } from "../../services/api";
import {
  fetchDoctorBrainScan,
  fetchPatientRecord,
} from "../../services/doctorService";
import type { DoctorBrainScanRecord } from "../../data/doctorBrainData";
import { useAuth } from "../../context/AuthContext";
import { uploadScan, updateScan, deleteScan } from "../../services/scanService";
import type { ApiScan } from "../../types/scan";

// Assets
import BrainHero from "../../assets/brainhome.png";

const toApiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

const DoctorBrainDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<"heatmap" | "volume">("heatmap");
  const { patientId: routePatientId } = useParams<{ patientId?: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [vtkSnapshot, setVtkSnapshot] = useState<string | null>(null);

  const [scan, setScan] = useState<DoctorBrainScanRecord | null>(null);
  const [activeScan, setActiveScan] = useState<ApiScan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [clinicianNote, setClinicianNote] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const patientId = searchParams.get("patientId") ?? routePatientId ?? "";
  const NO_SPLIT_CLASS = "break-inside-avoid page-break-inside-avoid block";

  useEffect(() => {
    if (!patientId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      setActiveScan(null);
      setActionMessage(null);
      setActionError(null);
      try {
        const record = await fetchDoctorBrainScan(patientId);
        if (record) {
          setScan(record);
          return;
        }
        const patient = await fetchPatientRecord(patientId);
        if (!patient) {
          setError("Patient not found.");
          return;
        }
        setScan({
          patientId,
          patientName: patient.name ?? "Unknown patient",
          avatar: patient.avatar ?? "NA",
          lastScanDate: undefined,
          scanId: "N/A",
          oxygenation: 0,
          stress: "Low",
          focus: "Stable",
          performanceScore: 0,
          injury: {
            location: "N/A",
            type: "N/A",
            size: "N/A",
            edema: "N/A",
            imaging: [],
          },
          risks: ["No scans yet."],
          relatedCases: [],
        });
      } catch (err: any) {
        setError(err?.message ?? "Unable to load scan.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  const handleMRIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!patientId) {
      setUploadError("Select a patient before uploading.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patient_id", patientId);
      formData.append("modality", "mri");
      if (user?.doctorId) {
        formData.append("doctor_id", user.doctorId);
      }

      const created = await uploadScan(formData, {
        patientId,
        modality: "mri",
        doctorId: user?.doctorId ?? null,
      });
      setActiveScan(created);
      setClinicianNote(created.clinician_note ?? "");
      setActionMessage("Scan uploaded.");
    } catch (err: any) {
      setUploadError(err?.message ?? "Failed to analyze MRI.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!activeScan?.id) return;
    setActionMessage(null);
    setActionError(null);
    try {
      const updated = await updateScan(activeScan.id, {
        review_status: "saved",
        clinician_note: clinicianNote,
      });
      setActiveScan(updated);
      setClinicianNote(updated.clinician_note ?? "");
      setActionMessage("Scan saved.");
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to save scan.");
    }
  };

  const handleDiscard = async () => {
    if (!activeScan?.id) return;
    setActionMessage(null);
    setActionError(null);
    try {
      await deleteScan(activeScan.id);
      setActiveScan(null);
      setClinicianNote("");
      setActionMessage("Scan discarded.");
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to discard scan.");
    }
  };

  const exportPdf = async () => {
    if (!reportRef.current) return;
    if ((window as any).getVTKSnapshot)
      setVtkSnapshot((window as any).getVTKSnapshot());

    setIsExporting(true);
    setIsProcessingPdf(true);

    setTimeout(async () => {
      try {
        const element = reportRef.current!;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#f8fafc",
          windowWidth: 794,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Ratio mapping: Canvas pixels to PDF millimeters
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Page 1
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Recursive paging for long content
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        const totalPages = (pdf.internal as any).getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(150);
          pdf.text(`Page ${i} of ${totalPages}`, pdfWidth - 25, pdfHeight - 10);
          pdf.text(`InsightX System - 2026`, 15, pdfHeight - 10);
        }

        pdf.save(`InsightX_Report_${scan?.patientId}.pdf`);
      } catch (err) {
        console.error("PDF Export failed", err);
      } finally {
        setIsExporting(false);
        setIsProcessingPdf(false);
        setVtkSnapshot(null);
      }
    }, 400);
  };

  const aiResult = activeScan?.ai_result ?? null;
  const summary = activeScan?.summary ?? null;
  const keyFindings = summary?.key_findings ?? null;
  const hasVisualization = Boolean(
    aiResult?.heatmap_slice || aiResult?.reconstruction_file
  );

  if (!patientId) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600">
            Select a patient to view scans.
          </p>
          <PatientSelector currentId="" organ="brain" />
        </div>
      </DashboardLayout>
    );
  }

  if (loading)
    return (
      <DashboardLayout>
        <LoadingState message="Loading..." />
      </DashboardLayout>
    );
  if (error) {
    return (
      <DashboardLayout>
        <ErrorState message={error} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {isProcessingPdf && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-sky-500 mb-6" />
          <p className="text-sky-400 text-sm font-semibold uppercase tracking-widest">
                        Generating Clinical Report...
          </p>
        </div>
      )}

      <div className="w-full flex justify-center bg-slate-200 py-8 px-4 md:px-8">
        <div
          ref={reportRef}
          className="bg-slate-50 shadow-2xl transition-all duration-300"
          style={{
            width: isExporting ? "794px" : "100%",
            maxWidth: isExporting ? "794px" : "1100px",
            minHeight: "1123px",
            height: "auto",
            padding: isExporting ? "32px" : "48px",
            boxSizing: "border-box",
          }}
        >
          {/* HEADER */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-4 border-slate-200 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-sky-600" />
                <p className="text-[10px] font-bold text-sky-800 uppercase tracking-widest">
                  InsightX Clinical Diagnostic
                </p>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {scan?.patientName}
              </h1>
              <p className="text-[11px] text-slate-500 font-mono uppercase">
                ID: {scan?.patientId} | Scan: {scan?.scanId}
              </p>
            </div>
            {!isExporting && (
              <div className="flex items-center gap-2 no-print">
                <Button
                  onClick={exportPdf}
                  className="bg-slate-900 hover:bg-black text-white rounded-full px-4 text-xs h-9"
                >
                  Export PDF
                </Button>
                <PatientSelector
                  currentId={patientId || scan?.patientId || ""}
                  organ="brain"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1.4fr] gap-6">
            <div className="space-y-6">
              {/* AI DIAGNOSIS BOX */}
              <div
                className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    AI Analysis Summary
                  </h2>
                  {!isExporting && (
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleMRIUpload}
                      className="text-[10px] file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                    />
                  )}
                </div>
                {uploading && (
                  <p className="text-sky-600 text-xs animate-pulse font-bold mb-4">
                    RECONSTRUCTING VOLUMETRIC SPACE...
                  </p>
                )}

                {uploadError && (
                  <p className="text-red-500 text-xs font-bold uppercase mb-4">
                    {uploadError}
                  </p>
                )}

                {activeScan ? (
                  <div className="space-y-3 text-xs border-t pt-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      <div className="space-y-1">
                        <p>
                          <span className="text-slate-400">Scan ID:</span>{" "}
                          <span className="font-bold">{activeScan.id}</span>
                        </p>
                        <p>
                          <span className="text-slate-400">Status:</span>{" "}
                          <span className="font-bold">{activeScan.status ?? "N/A"}</span>
                        </p>
                        <p>
                          <span className="text-slate-400">Risk:</span>{" "}
                          <span className="font-bold">{activeScan.risk_level ?? "N/A"}</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p>
                          <span className="text-slate-400">Created:</span>{" "}
                          <span className="font-bold">
                            {activeScan.created_at
                              ? new Date(activeScan.created_at).toLocaleString()
                              : "N/A"}
                          </span>
                        </p>
                        <p>
                          <span className="text-slate-400">Review:</span>{" "}
                          <span className="font-bold">
                            {activeScan.review_status ?? "draft"}
                          </span>
                        </p>
                        <p>
                          <span className="text-slate-400">Modality:</span>{" "}
                          <span className="font-bold">{activeScan.modality ?? "mri"}</span>
                        </p>
                      </div>
                    </div>

                    {summary && (
                      <div className="border-t pt-3 space-y-2">
                        <p>
                          <span className="text-slate-400">Severity:</span>{" "}
                          <span className="font-bold uppercase">
                            {summary.severity ?? "N/A"}
                          </span>
                        </p>
                        <p>
                          <span className="text-slate-400">Recommendation:</span>{" "}
                          <span className="font-bold">
                            {summary.recommendation ?? "N/A"}
                          </span>
                        </p>
                        {summary.key_findings && (
                          <div className="text-[11px] text-slate-600">
                            <p className="uppercase text-[10px] text-slate-400 font-bold">
                              Key Findings
                            </p>
                            <ul className="list-disc list-inside">
                              {Object.entries(summary.key_findings).map(
                                ([key, value]) => (
                                  <li key={key}>
                                    {key}: {String(value)}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="border-t pt-3 space-y-2">
                      <label className="text-[10px] uppercase text-slate-400 font-bold">
                        Clinician Note
                      </label>
                      <textarea
                        value={clinicianNote}
                        onChange={(e) => setClinicianNote(e.target.value)}
                        rows={3}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                        placeholder="Add a note for this scan..."
                      />
                      {actionMessage && (
                        <p className="text-[11px] text-emerald-600">{actionMessage}</p>
                      )}
                      {actionError && (
                        <p className="text-[11px] text-rose-600">{actionError}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSave}
                          className="bg-sky-600 hover:bg-sky-700 text-xs"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={handleDiscard}
                          variant="secondary"
                          className="text-xs"
                        >
                          Discard
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs italic">
                    Upload DICOM .zip to initiate 3D reconstruction
                  </div>
                )}
              </div>

              {/* VISUALIZATION CONTAINER */}
              <div
                className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    3D Visualization Engine
                  </span>
                  {!isExporting && hasVisualization && (
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-full">
                      <button
                        onClick={() => setViewMode("volume")}
                        className={`px-4 py-1 rounded-full text-[10px] font-bold transition-all ${
                          viewMode === "volume"
                            ? "bg-white text-sky-600 shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        3D SPACE
                      </button>
                      <button
                        onClick={() => setViewMode("heatmap")}
                        className={`px-4 py-1 rounded-full text-[10px] font-bold transition-all ${
                          viewMode === "heatmap"
                            ? "bg-white text-sky-600 shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        HEATMAP
                      </button>
                    </div>
                  )}
                </div>

                <div className="min-h-[400px] flex items-center justify-center bg-slate-900 rounded-2xl overflow-hidden relative shadow-inner">
                  {vtkSnapshot && (
                    <img
                      src={vtkSnapshot}
                      className="absolute inset-0 w-full h-full object-contain z-50 bg-slate-950"
                      alt="PDF Snapshot"
                    />
                  )}
                  {hasVisualization ? (
                    viewMode === "heatmap" ? (
                      <HeatmapViewer
                        imageUrl={toApiUrl(String(aiResult?.heatmap_slice || ""))}
                      />
                    ) : (
                      <MRIViewer
                        volumeUrl={toApiUrl(String(aiResult?.reconstruction_file || ""))}
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <img
                        src={BrainHero}
                        className="opacity-10 max-h-48 grayscale"
                        alt="Hero"
                      />
                      <span className="text-slate-600 text-[10px] uppercase tracking-widest">
                        No active volumetric data
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SIDE PANEL */}
            <div className="space-y-6">
              <div
                className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}
              >
                <h2 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">
                  Patient Biometrics
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                    <p className="text-[10px] text-sky-600 font-bold uppercase mb-1">
                      Oxygenation
                    </p>
                    <p className="text-2xl font-black text-sky-900">
                      {scan?.oxygenation}%
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">
                      Performance
                    </p>
                    <p className="text-2xl font-black text-emerald-900">
                      {scan?.performanceScore}
                    </p>
                  </div>
                </div>
              </div>

              {aiResult && (
                <div
                  className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}
                >
                  <h2 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">
                    Reconstruction Details
                  </h2>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-400">Series UID:</span>{" "}
                      <span className="font-bold">{aiResult.series_uid ?? "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Series Detected:</span>{" "}
                      <span className="font-bold">{aiResult.series_detected ?? "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Volume Shape:</span>{" "}
                      <span className="font-bold">
                        {aiResult.volume_shape
                          ? `${aiResult.volume_shape.depth}x${aiResult.volume_shape.height}x${aiResult.volume_shape.width}`
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Mean Intensity:</span>{" "}
                      <span className="font-bold">
                        {aiResult.statistics?.mean_intensity ?? "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Max Intensity:</span>{" "}
                      <span className="font-bold">
                        {aiResult.statistics?.max_intensity ?? "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}
              >
                <h2 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">
                  Clinical Observations
                </h2>
                <div className="space-y-4">
                  {/* 1. Injury Site / Coordinates */}
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-xs text-slate-500">
                      AI-Detected Coordinates
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {keyFindings?.tumor_location ? (
                        <span className="font-mono text-sky-600">
                          X: {Number(keyFindings.tumor_location.x).toFixed(1)},
                          Y: {Number(keyFindings.tumor_location.y).toFixed(1)}
                        </span>
                      ) : summary ? (
                        <span className="text-emerald-600 uppercase">
                          Clear / No Lesion
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">
                          Awaiting Analysis...
                        </span>
                      )}
                    </span>
                  </div>

                  {/* 2. Severity */}
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-xs text-slate-500">
                      Severity
                    </span>
                    <span className="text-xs font-bold text-slate-800 uppercase">
                      {summary?.severity ?? (
                        <span className="text-slate-300 italic">
                          Pending...
                        </span>
                      )}
                    </span>
                  </div>

                  {/* 3. Recommendation */}
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                      Recommendation
                    </p>
                    <p className="text-xs text-slate-700">
                      {summary?.recommendation ??
                        "No recommendation available yet."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 text-[9px] text-slate-400 text-center uppercase tracking-widest leading-relaxed">
                        Proprietary AI Analysis Document - InsightX Medical Systems - 2026
            <br />
                        CONFIDENTIAL PATIENT RECORD - FOR LICENSED CLINICIAN USE ONLY
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorBrainDashboard;
