import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Layouts & Components
import DashboardLayout from "../../layouts/DashboardLayout";
import MRIViewer from "../../components/dashboard/MRI_Viewer";
import HeatmapViewer from "../../components/dashboard/HeatmapViewer";
import PatientSelector from "../../components/PatientSelector";
import { LoadingState } from "../../components/ui/LoadingState";
import { Button } from "../../components/ui/button";

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

// Assets
import BrainHero from "../../assets/brainhome.png";

const DoctorBrainDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<"heatmap" | "volume">("heatmap");
  const { patientId } = useParams<{ patientId: string }>();
  const [searchParams] = useSearchParams();

  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [vtkSnapshot, setVtkSnapshot] = useState<string | null>(null);

  const [scan, setScan] = useState<DoctorBrainScanRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<MRIPredictionResult | null>(
    null
  );
  const [mriLoading, setMriLoading] = useState<boolean>(false);
  const [mriError, setMriError] = useState<string | null>(null);

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
      stress: sData.stress ?? "Normal",
      focus: sData.focus ?? "Stable",
      performanceScore: sData.performanceScore ?? 0,
      injury: sData.injury ?? {
        location: "N/A",
        type: "N/A",
        size: "N/A",
        edema: "N/A",
        imaging: [],
      },
      risks: sData.risks ?? [],
      relatedCases: sData.relatedCases ?? [],
    } as DoctorBrainScanRecord;
  };

  useEffect(() => {
    const load = async () => {
      if (!patientId) {
        setError("Patient not found.");
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
      } catch (err: any) {
        setError(err?.message ?? "Unable to load scan.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId, sessionId]);

  const handleMRIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPrediction(null);
    setMriError(null);
    setMriLoading(true);
    try {
      const result = await predictMRI(file);
      setPrediction(result);
    } catch (err) {
      setMriError("Failed to analyze MRI.");
    } finally {
      setMriLoading(false);
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
            Generating Clinical Report…
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
                  currentId={scan?.patientId || ""}
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
                {mriLoading && (
                  <p className="text-sky-600 text-xs animate-pulse font-bold mb-4">
                    RECONSTRUCTING VOLUMETRIC SPACE...
                  </p>
                )}

                {mriError && (
                  <p className="text-red-500 text-xs font-bold uppercase mb-4">
                    {mriError}
                  </p>
                )}

                {prediction ? (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs border-t pt-4">
                    <div>
                      <p>
                        <span className="text-slate-400">Diagnosis:</span>{" "}
                        <span className="text-blue-700 font-bold uppercase">
                          {prediction.classification.tumor_type}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Confidence:</span>{" "}
                        <span className="font-bold">
                          {(prediction.classification.confidence * 100).toFixed(
                            1
                          )}
                          %
                        </span>
                      </p>
                    </div>
                    <div>
                      <p>
                        <span className="text-slate-400">Tumor Detected:</span>{" "}
                        <span className="font-bold text-red-500">
                          {prediction.segmentation.tumor_detected
                            ? "YES"
                            : "NO"}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Volume:</span>{" "}
                        <span className="font-bold">
                          {prediction.segmentation.tumor_size_pixels}px³
                        </span>
                      </p>
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
                      alt="PDF Snapshot"
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
                          <span className="text-slate-900">
                            {(value * 100).toFixed(1)}%
                          </span>
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
                  {/* 1. Injury Site / Coordinates */}
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-xs text-slate-500">
                      AI-Detected Coordinates
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {prediction?.segmentation?.tumor_detected &&
                      prediction.segmentation.tumor_location ? (
                        <span className="font-mono text-sky-600">
                          X:{" "}
                          {prediction.segmentation.tumor_location.x.toFixed(1)},
                          Y:{" "}
                          {prediction.segmentation.tumor_location.y.toFixed(1)}
                        </span>
                      ) : prediction ? (
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

                  {/* 2. Pathology Type */}
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-xs text-slate-500">
                      Pathology Classification
                    </span>
                    <span className="text-xs font-bold text-slate-800 uppercase">
                      {prediction?.classification?.tumor_type ?? (
                        <span className="text-slate-300 italic">
                          Pending...
                        </span>
                      )}
                    </span>
                  </div>

                  {/* 3. Flagged Risks  */}
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                      AI Risk Assessment
                    </p>
                    <ul className="space-y-2">
                      {prediction?.risk_analysis?.risks ? (
                        prediction.risk_analysis.risks.map((r, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-700 flex gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                            {r}
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-slate-400 italic">
                          No active risks flagged. Upload scan to analyze.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 text-[9px] text-slate-400 text-center uppercase tracking-widest leading-relaxed">
            Proprietary AI Analysis Document • InsightX Medical Systems • 2026
            <br />
            CONFIDENTIAL PATIENT RECORD • FOR LICENSED CLINICIAN USE ONLY
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorBrainDashboard;
