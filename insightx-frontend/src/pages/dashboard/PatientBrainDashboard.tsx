import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Layouts & Components
import DashboardLayout from "../../layouts/DashboardLayout";
import MRIViewer from "../../components/dashboard/MRI_Viewer";
import HeatmapViewer from "../../components/dashboard/HeatmapViewer";
import { LoadingState } from "../../components/ui/LoadingState";
import { Button } from "../../components/ui/button";
import { API_BASE_URL } from "../../services/api";

// Services & Types
import { predictMRI } from "../../api/predict";
import type { MRIPredictionResult } from "../../api/predict";
import { fetchPatientBrainScan } from "../../services/patientService";
import type { PatientBrainRecord } from "../../data/patientBrainData";
import { useAuth } from "../../context/AuthContext";
import { uploadScan, updateScan, deleteScan } from "../../services/scanService";

// Assets
import BrainHero from "../../assets/brainhome.png";

const PatientBrainDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<"heatmap" | "volume">("heatmap");
  const { user } = useAuth();
  const patientId = user?.patientId ? String(user.patientId) : "";

  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [vtkSnapshot, setVtkSnapshot] = useState<string | null>(null);

  const [scan, setScan] = useState<PatientBrainRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [prediction, setPrediction] = useState<MRIPredictionResult | null>(null);
  const [mriLoading, setMriLoading] = useState<boolean>(false);
  const [mriError, setMriError] = useState<string | null>(null);
  const [activeScanId, setActiveScanId] = useState<string | number | null>(null);

  const [clinicianNote, setClinicianNote] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const NO_SPLIT_CLASS = "break-inside-avoid page-break-inside-avoid block";

  useEffect(() => {
    const load = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const record = await fetchPatientBrainScan(patientId);
        setScan(record);
      } catch (err) {
        console.error("Load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  const handleMRIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientId) return;

    setMriError(null);
    setMriLoading(true);
    setPrediction(null);
    setActionMessage(null);

    try {
      // 1. Get real AI prediction
      const result = await predictMRI(file, patientId);
      setPrediction(result);

      // 2. Upload to Main Database
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patient_id", patientId);
      formData.append("modality", "mri");
      
      const uploaded = await uploadScan(formData, { 
        patientId, 
        modality: "mri",
        prediction: result
      });

      if (uploaded && uploaded.id) {
        setActiveScanId(uploaded.id);
        setActionMessage("RECONSTRUCTING VOLUMETRIC SPACE... SUCCESS.");
      } else if (result?.series_uid) {
        setActiveScanId(result.series_uid);
      }
    } catch (err: any) {
      console.error("Upload Error:", err);
      setMriError(err.message || "Failed to analyze MRI.");
    } finally {
      setMriLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activeScanId) return;
    try {
      await updateScan(activeScanId, {
        review_status: "saved",
        clinician_note: clinicianNote,
      });
      setActionMessage("Scan saved to your records.");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage("Save failed.");
    }
  };

  const handleDiscard = async () => {
    if (!activeScanId) return;
    if (!window.confirm("Discard this analysis?")) return;
    try {
      await deleteScan(activeScanId);
      setPrediction(null);
      setActiveScanId(null);
      setClinicianNote("");
      setActionMessage("Analysis removed.");
    } catch (err) {
      setActionMessage("Discard failed.");
    }
  };

  const exportPdf = async () => {
    if (!reportRef.current) return;
    if ((window as any).getVTKSnapshot) setVtkSnapshot((window as any).getVTKSnapshot());
    setIsExporting(true);
    setIsProcessingPdf(true);

    setTimeout(async () => {
      try {
        const element = reportRef.current!;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#f8fafc" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        pdf.addImage(imgData, "PNG", 0, 0, 210, (canvas.height * 210) / canvas.width);
        pdf.save(`My_Brain_Report_${patientId}.pdf`);
      } catch (err) {
        console.error(err);
      } finally {
        setIsExporting(false);
        setIsProcessingPdf(false);
        setVtkSnapshot(null);
      }
    }, 400);
  };

  if (loading) return <DashboardLayout><LoadingState message="Loading your data..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      {isProcessingPdf && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-sky-500 mb-6" />
          <p className="text-sky-400 text-sm font-semibold uppercase tracking-widest">Generating Your Report...</p>
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
                <p className="text-[10px] font-bold text-sky-800 uppercase tracking-widest">InsightX Patient Portal</p>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{user?.fullName}</h1>
              <p className="text-[11px] text-slate-500 font-mono uppercase">ID: {patientId} | Real-time Analysis</p>
            </div>
            {!isExporting && (
              <div className="flex items-center gap-2 no-print">
                <Button onClick={exportPdf} className="bg-slate-900 hover:bg-black text-white rounded-full px-4 text-xs h-9">
                  Export PDF
                </Button>
                <Link to="/dashboard/patient/history">
                   <Button variant="secondary" className="border border-slate-200 text-xs">History</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1.4fr] gap-6">
            <div className="space-y-6">
              {/* UPLOAD BOX */}
              <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Upload New Scan</h2>
                  {!isExporting && (
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleMRIUpload}
                      className="text-[10px] file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-sky-50 file:text-sky-700 cursor-pointer"
                    />
                  )}
                </div>
                {mriLoading && <p className="text-sky-600 text-xs animate-pulse font-bold mb-4 uppercase">AI processing in progress...</p>}
                {mriError && <p className="text-rose-600 text-[10px] font-bold mb-4 uppercase">{mriError}</p>}

                {prediction ? (
                  <div className="space-y-3 text-xs border-t pt-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      <div>
                        <p><span className="text-slate-400 uppercase text-[9px]">Classification:</span> <span className="font-bold text-sky-700 uppercase">{prediction.classification.tumor_type}</span></p>
                        <p><span className="text-slate-400 uppercase text-[9px]">Confidence:</span> <span className="font-bold">{(prediction.classification.confidence * 100).toFixed(1)}%</span></p>
                      </div>
                      <div>
                        <p><span className="text-slate-400 uppercase text-[9px]">Status:</span> <span className="font-bold">Validated</span></p>
                        <p><span className="text-slate-400 uppercase text-[9px]">Analysis ID:</span> <span className="font-mono text-[10px]">{activeScanId}</span></p>
                      </div>
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <label className="text-[10px] uppercase text-slate-400 font-bold">Patient Notes</label>
                      <textarea
                        value={clinicianNote}
                        onChange={(e) => setClinicianNote(e.target.value)}
                        rows={2}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                        placeholder="Add your own notes here..."
                      />
                      {actionMessage && <p className="text-[10px] text-emerald-600 font-bold">{actionMessage}</p>}
                      <div className="flex gap-2">
                        <Button onClick={handleSave} className="bg-sky-600 text-white text-xs">Save to History</Button>
                        <Button variant="secondary" onClick={handleDiscard} className="text-xs">Discard</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs italic">
                    Select your DICOM .zip file to start the 3D analysis
                  </div>
                )}
              </div>

              {/* VIEWER */}
              <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3D Scan Viewer</span>
                  {!isExporting && prediction && (
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-full">
                      <button onClick={() => setViewMode("volume")} className={`px-4 py-1 rounded-full text-[10px] font-bold ${viewMode === "volume" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500"}`}>3D</button>
                      <button onClick={() => setViewMode("heatmap")} className={`px-4 py-1 rounded-full text-[10px] font-bold ${viewMode === "heatmap" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500"}`}>HEATMAP</button>
                    </div>
                  )}
                </div>
                <div className="min-h-[400px] flex items-center justify-center bg-slate-900 rounded-2xl overflow-hidden relative shadow-inner">
                  {vtkSnapshot && <img src={vtkSnapshot} className="absolute inset-0 w-full h-full object-contain z-50 bg-slate-950" />}
                  {prediction ? (
                    viewMode === "heatmap" ? (
                      <HeatmapViewer imageUrl={`http://127.0.0.1:8000${prediction.heatmap_slice}`} />
                    ) : (
                      <MRIViewer volumeUrl={`http://127.0.0.1:8000${prediction.reconstruction_file}`} />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <img src={BrainHero} className="opacity-10 max-h-48 grayscale" />
                      <span className="text-slate-600 text-[10px] uppercase tracking-widest">Awaiting Volumetric Data</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                <h2 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">Health Biometrics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                    <p className="text-[10px] text-sky-600 font-bold uppercase mb-1">Oxygenation</p>
                    <p className="text-2xl font-black text-sky-900">{scan?.oxygenation ?? 0}%</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Performance</p>
                    <p className="text-2xl font-black text-emerald-900">{scan?.score ?? 0}</p>
                  </div>
                </div>
              </div>

              {prediction && (
                <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                  <h2 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">Pathology Probability</h2>
                  <div className="space-y-3">
                    {Object.entries(prediction.classification.probabilities).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span className={prediction.classification.tumor_type === key ? "text-sky-600" : "text-slate-400"}>{key}</span>
                          <span>{(value * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${prediction.classification.tumor_type === key ? "bg-sky-500" : "bg-slate-300"}`} style={{ width: `${value * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                <h2 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">AI Observations</h2>
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500 uppercase text-[9px]">Coordinates</span>
                    <span className="font-bold font-mono">
                      {prediction?.segmentation?.tumor_location 
                        ? `X:${prediction.segmentation.tumor_location.x.toFixed(1)} Y:${prediction.segmentation.tumor_location.y.toFixed(1)}` 
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Risk Indicators</p>
                    <ul className="space-y-2">
                      {prediction?.risk_analysis?.risks.map((r, i) => (
                        <li key={i} className="text-slate-700 flex gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          {r}
                        </li>
                      )) || <li className="text-slate-400 italic">No risks identified.</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 text-[9px] text-slate-400 text-center uppercase tracking-widest leading-relaxed">
            Personal Health Analysis Record - InsightX Medical - 2026<br />
            CONFIDENTIAL - INTENDED FOR PATIENT REVIEW ONLY
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientBrainDashboard;