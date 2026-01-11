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
import { Button } from "../../components/ui/button";
import { API_BASE_URL } from "../../services/api";

// Services & Types
import { predictMRI } from "../../api/predict";
import type { MRIPredictionResult } from "../../api/predict";
import { fetchDoctorBrainScan } from "../../services/doctorService";
import type { DoctorBrainScanRecord } from "../../data/doctorBrainData";
import {
  getLatestDoneSession,
  getSession,
} from "../../services/localScanStore";
import { findPatientById } from "../../data/fakeDatabase";
import { uploadScan, updateScan, deleteScan } from "../../services/scanService";

// Assets
import BrainHero from "../../assets/brainhome.png";

const DoctorBrainDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<"heatmap" | "volume">("heatmap");

  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [vtkSnapshot, setVtkSnapshot] = useState<string | null>(null);

  const [scan, setScan] = useState<DoctorBrainScanRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [prediction, setPrediction] = useState<MRIPredictionResult | null>(
    null
  );
  const [mriLoading, setMriLoading] = useState<boolean>(false);
  const [mriError, setMriError] = useState<string | null>(null);
  const [activeScanId, setActiveScanId] = useState<string | number | null>(
    null
  );

  const [clinicianNote, setClinicianNote] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const { patientId: pathId } = useParams<{ patientId: string }>();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("patientId");
  const patientId = pathId || queryId || "";

  console.log("Resolved Patient ID:", patientId);

  const sessionId = searchParams.get("sessionId");
  const patientInfo = findPatientById(patientId ?? "");
  const NO_SPLIT_CLASS = "break-inside-avoid page-break-inside-avoid block";

  const mapSession = () => {
    if (!patientId) return null;
    const session = sessionId
      ? getSession(sessionId)
      : getLatestDoneSession(patientId, "brain");
    if (
      !session ||
      session.status !== "done" ||
      session.type !== "brain" ||
      !session.data?.doctor
    )
      return null;

    const sData = session.data.doctor as Partial<DoctorBrainScanRecord>;
    return {
      patientId,
      patientName: sData.patientName ?? patientInfo?.name ?? "Unknown patient",
      avatar: sData.avatar ?? patientInfo?.avatar ?? "NA",
      lastScanDate: sData.lastScanDate ?? session.createdAt,
      scanId: sData.scanId ?? `B-SESSION-${session.id}`,
      oxygenation: sData.oxygenation ?? 0,
      performanceScore: sData.performanceScore ?? 0,
    } as DoctorBrainScanRecord;
  };

  useEffect(() => {
    const load = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const fromSession = mapSession();
        if (fromSession) {
          setScan(fromSession);
          return;
        }
        const record = await fetchDoctorBrainScan(patientId);
        setScan(record);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId, sessionId]);

  const handleMRIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("CHECKING PATIENT ID:", patientId);
    console.log("File:", file, "PatientID:", patientId);
    if (!file || !patientId) return;

    setMriError(null);
    setMriLoading(true);
    setPrediction(null);
    setActionMessage(null);

    try {
      const result = await predictMRI(file, patientId);
      setPrediction(result);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("patient_id", patientId);
      formData.append("modality", "mri");
      
      const uploaded = await uploadScan(formData, { 
        patientId: patientId, 
        modality: "mri",
        prediction: result
      });

     if (uploaded && uploaded.id) {
        console.log("Database ID created:", uploaded.id);
        setActiveScanId(uploaded.id); // Use the clean integer ID from DB
        setActionMessage("RECONSTRUCTING VOLUMETRIC SPACE... SUCCESS.");
      } else if (result && result.series_uid) {
        // Fallback only if the DB didn't return an ID for some reason
        setActiveScanId(result.series_uid);
      }
    } catch (err: any) {
      console.error("Upload/Prediction Error:", err);
      setMriError(err.message || "Failed to analyze MRI.");
    } finally {
      setMriLoading(false);
    }
  };

 const handleSave = async () => {
  console.log("Attempting to save Scan ID:", activeScanId);
  if (!activeScanId) {
    return;
  }
  try {
    const response = await updateScan(activeScanId, {
      review_status: "saved",
      clinician_note: clinicianNote,
    });
    setActionMessage("Scan and Notes saved to database.");
  } catch (err) {
    setActionMessage("Save failed.");
  }
};

  const handleDiscard = async () => {
    if (!activeScanId) return;
    if (!window.confirm("Discard analysis?")) return;
    try {
      await deleteScan(activeScanId);
      setPrediction(null);
      setActiveScanId(null);
      setClinicianNote("");
      setActionMessage("Analysis discarded.");
    } catch (err) {
      setActionMessage("Discard failed.");
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
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save(`InsightX_Report_${scan?.patientId}.pdf`);
      } catch (err) {
        console.error(err);
      } finally {
        setIsExporting(false);
        setIsProcessingPdf(false);
        setVtkSnapshot(null);
      }
    }, 400);
  };

  if (loading)
    return (
      <DashboardLayout>
        <LoadingState message="Loading..." />
      </DashboardLayout>
    );

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
            padding: isExporting ? "32px" : "48px",
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
                  className="bg-slate-900 hover:bg-black text-white rounded-full px-4 text-xs h-9 transition-all"
                >
                  Export PDF
                </Button>
                <PatientSelector
                  currentId={scan?.patientId || ""}
                  organ="brain"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1.4fr] gap-6">
            <div className="space-y-6">
              {/* ANALYSIS BOX - USES PREDICTION DATA */}
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
                {mriLoading && (
                  <p className="text-sky-600 text-xs animate-pulse font-bold mb-4 uppercase">
                    RECONSTRUCTING VOLUMETRIC SPACE...
                  </p>
                )}

                {prediction ? (
                  <div className="space-y-3 text-xs border-t pt-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      <div className="space-y-1">
                        <p>
                          <span className="text-slate-400">Diagnosis:</span>{" "}
                          <span className="font-bold uppercase text-sky-700">
                            {prediction.classification.tumor_type}
                          </span>
                        </p>
                        <p>
                          <span className="text-slate-400">Confidence:</span>{" "}
                          <span className="font-bold">
                            {(
                              prediction.classification.confidence * 100
                            ).toFixed(1)}
                            %
                          </span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p>
                          <span className="text-slate-400">Voxel Volume:</span>{" "}
                          <span className="font-bold">
                            {prediction.segmentation.tumor_size_pixels}px³
                          </span>
                        </p>
                        <p>
                          <span className="text-slate-400">Status:</span>{" "}
                          <span className="font-bold">Analysis Complete</span>
                        </p>
                      </div>
                    </div>

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
                        <p className="text-[10px] text-emerald-600 font-bold">
                          {actionMessage}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSave}
                          className="bg-sky-600 hover:bg-sky-700 text-xs text-white"
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleDiscard}
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
                  {!isExporting && prediction && (
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
                      alt="Snapshot"
                    />
                  )}
                  {prediction ? (
                    viewMode === "heatmap" ? (
                      <HeatmapViewer
                        imageUrl={`http://127.0.0.1:8000${prediction.heatmap_slice}`}
                      />
                    ) : (
                      <MRIViewer
                        volumeUrl={`http://127.0.0.1:8000${prediction.reconstruction_file}`}
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

              {prediction && (
                <div
                  className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}
                >
                  <h2 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">
                    Pathology Probabilities
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(
                      prediction.classification.probabilities
                    ).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span
                            className={
                              prediction.classification.tumor_type === key
                                ? "text-sky-600"
                                : "text-slate-400"
                            }
                          >
                            {key}
                          </span>
                          <span>{(value * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              prediction.classification.tumor_type === key
                                ? "bg-sky-500"
                                : "bg-slate-300"
                            }`}
                            style={{ width: `${value * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
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
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-xs text-slate-500">
                      AI-Detected Coordinates
                    </span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {prediction?.segmentation?.tumor_location ? (
                        `X: ${prediction.segmentation.tumor_location.x.toFixed(
                          1
                        )}, Y: ${prediction.segmentation.tumor_location.y.toFixed(
                          1
                        )}`
                      ) : (
                        <span className="text-slate-300 italic">
                          Awaiting Analysis...
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                      AI Risk Indicators
                    </p>
                    <ul className="space-y-2">
                      {prediction?.risk_analysis?.risks.map((r, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-700 flex gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          {r}
                        </li>
                      )) || (
                        <li className="text-xs text-slate-400 italic">
                          No active risks flagged.
                        </li>
                      )}
                    </ul>
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
