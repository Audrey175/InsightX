import React, { useState, useEffect } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  Link,
} from "react-router-dom";
import { jsPDF } from "jspdf";

// Layouts & Components
import DashboardLayout from "../../layouts/DashboardLayout";
import MRIViewer from "../../components/dashboard/MRI_Viewer";
import HeatmapViewer from "../../components/dashboard/HeatmapViewer";
import PatientSelector from "../../components/PatientSelector";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
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
  const navigate = useNavigate();

  // State for Patient Scan Data
  const [scan, setScan] = useState<DoctorBrainScanRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for MRI AI Analysis
  const [prediction, setPrediction] = useState<MRIPredictionResult | null>(
    null
  );
  const [mriLoading, setMriLoading] = useState<boolean>(false);
  const [mriError, setMriError] = useState<string | null>(null);

  const sessionId = searchParams.get("sessionId");
  const patientInfo = findPatientById(patientId ?? "");

  const mapSession = () => {
    if (!patientId) return null;
    const session = sessionId
      ? getSession(sessionId)
      : getLatestDoneSession(patientId, "brain");
    if (
      !session ||
      session.status !== "done" ||
      session.type !== "brain" ||
      session.patientId !== patientId ||
      !session.data?.doctor
    ) {
      return null;
    }
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
      setError(null);
      try {
        const fromSession = mapSession();
        if (fromSession) {
          setScan(fromSession);
          return;
        }
        const record = await fetchDoctorBrainScan(patientId);
        if (!record) {
          setError("No brain scan available for this patient.");
        }
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
      console.log("API RESULT:", result);
      setPrediction(result);
    } catch (err) {
      console.error("MRI ERROR:", err);
      setMriError("Failed to analyze MRI. Please try again.");
    } finally {
      setMriLoading(false);
    }
  };

  const handleNavigate = (target: "brain" | "heart") => {
    const targetId = patientId ?? scan?.patientId ?? "";
    if (targetId) {
      navigate(`/dashboard/doctor/${target}/${targetId}`);
    }
  };

  const exportPdf = () => {
    if (!scan) return;
    const doc = new jsPDF();
    doc.text("InsightX Diagnostic Report", 10, 20);
    doc.text(`Patient: ${scan.patientName} (${scan.patientId})`, 10, 30);
    doc.text("Scan type: Brain", 10, 38);
    doc.text(`Date: ${scan.lastScanDate ?? new Date().toISOString()}`, 10, 46);
    doc.text("Key metrics:", 10, 58);
    doc.text(`- Oxygenation: ${scan.oxygenation}%`, 14, 66);
    doc.text(`- Stress: ${scan.stress}`, 14, 74);
    doc.text(`- Focus: ${scan.focus}`, 14, 82);
    doc.text(`- Performance: ${scan.performanceScore}`, 14, 90);
    doc.text(`Injury: ${scan.injury.location} / ${scan.injury.type}`, 10, 104);
    doc.text(`Notes: ${scan.risks?.[0] ?? "N/A"}`, 10, 114);
    doc.text("Generated by InsightX (mock)", 10, 130);
    doc.save(`InsightX_Brain_Report_${scan.patientId}.pdf`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading brain scan..." />
      </DashboardLayout>
    );
  }

  if (error || !scan) {
    return (
      <DashboardLayout>
        <ErrorState
          message={error ?? "No scan data."}
          actionLabel="Go to patient list"
          onAction={() => navigate("/dashboard/doctor/patients")}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 min-w-0">
        {/* HEADER */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-slate-500">
              Home &gt; Personal Dashboard &gt; {scan.scanId}
            </p>
            <h1 className="text-lg font-semibold mt-1">{scan.patientName}</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Link
              to={`/dashboard/doctor/history/${scan.patientId}`}
              className="px-3 py-1 rounded-full border text-slate-700"
            >
              View Scan History
            </Link>
            <Button
              onClick={exportPdf}
              className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs"
            >
              Export PDF Report
            </Button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavigate("heart")}
                className="px-3 py-1 rounded-full border text-slate-600"
              >
                Heart
              </button>
              <button className="px-3 py-1 rounded-full bg-sky-600 text-white">
                Brain
              </button>
            </div>

            <PatientSelector currentId={scan.patientId} organ="brain" />

            <div className="h-8 w-8 rounded-full bg-amber-300 flex items-center justify-center text-xs font-bold">
              {scan.avatar}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)] gap-4">
          {/* LEFT PANEL */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mt-2">
              <h2 className="text-xs font-semibold text-slate-700 mb-2">
                AI MRI Diagnosis
              </h2>
              <input
                type="file"
                accept=".zip"
                onChange={handleMRIUpload}
                className="text-xs"
              />

              {mriLoading && (
                <p className="text-blue-600 font-medium text-xs mt-2">
                  Analyzing MRI...
                </p>
              )}

              {mriError && (
                <p className="text-red-600 font-medium text-xs mt-2">
                  {mriError}
                </p>
              )}

              {prediction && (
                <div className="bg-slate-100 p-4 rounded-xl mt-4 text-sm space-y-2">
                  <h3 className="font-semibold text-slate-800 mb-2">
                    AI Reconstruction Summary
                  </h3>
                  {/* Changed from series_used to reconstruction_engine */}
                  <p>
                    <strong>Engine:</strong>{" "}
                    {prediction.reconstruction_engine || "3D U-Net"}
                  </p>
                  <p>
                    <strong>Series Detected:</strong>{" "}
                    {prediction.series_detected}
                  </p>
                  <p>
                    <strong>Volume shape:</strong>{" "}
                    {prediction.volume_shape?.depth} ×{" "}
                    {prediction.volume_shape?.height} ×{" "}
                    {prediction.volume_shape?.width}
                  </p>
                  <p>
                    {/* Added safe join check */}
                    <strong>Voxel spacing (mm):</strong>{" "}
                    {prediction.voxel_spacing?.join?.(", ") || "N/A"}
                  </p>
                  {/* Added safe check for statistics */}
                  <p>
                    <strong>Mean intensity:</strong>{" "}
                    {prediction.statistics?.mean_intensity ?? "N/A"}
                  </p>
                  <p>
                    <strong>Max intensity:</strong>{" "}
                    {prediction.statistics?.max_intensity ?? "N/A"}
                  </p>

                  {/* Added the new AI Analysis details (Risk/Classification) */}
                  {prediction.ai_analysis && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <p className="text-blue-700 font-semibold">
                        Classification:{" "}
                        {prediction.ai_analysis.classification?.tumor_type}
                      </p>
                      <p className="text-xs text-slate-600">
                        Confidence:{" "}
                        {(
                          prediction.ai_analysis.classification?.confidence *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mt-2">
                    {prediction.disclaimer}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Cognitive Activity</span>
                <span>3D · Heat map · Raw</span>
              </div>

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 flex items-center justify-center min-h-[224px]">
                  {prediction && viewMode === "heatmap" ? (
                    <HeatmapViewer
                      imageUrl={`http://localhost:8000${prediction.heatmap_slice}`}
                    />
                  ) : prediction && viewMode === "volume" ? (
                    <MRIViewer
                      volumeUrl={`http://localhost:8000${prediction.reconstruction_file}`}
                    />
                  ) : (
                    <img
                      src={BrainHero}
                      alt="Placeholder"
                      className="max-h-56 object-contain opacity-40"
                    />
                  )}
                </div>

                <div className="w-full lg:w-60 space-y-3 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="font-semibold text-slate-700 mb-1">
                      Cognitive Activity
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                      <span>Brain Oxygenation (SO2)</span>
                      <span className="text-right">{scan.oxygenation}%</span>
                      <span>Stress Level</span>
                      <span className="text-right">{scan.stress}</span>
                      <span>Focus Index</span>
                      <span className="text-right">{scan.focus}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="font-semibold text-slate-700 mb-1">
                      Cognitive Performance
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {scan.performanceScore} / 100
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <button
                  onClick={() => setViewMode("volume")}
                  className={`px-4 py-1.5 rounded-full font-medium ${
                    viewMode === "volume"
                      ? "bg-sky-700 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  3D
                </button>
                <button
                  onClick={() => setViewMode("heatmap")}
                  className={`px-4 py-1.5 rounded-full font-medium ${
                    viewMode === "heatmap"
                      ? "bg-sky-700 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Heat map
                </button>
                <button
                  disabled
                  className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-400 cursor-not-allowed"
                >
                  Raw
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-4 text-xs">
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold text-slate-800 mb-2">
                Injury details
              </h2>
              <div className="space-y-1 text-[11px] text-slate-700">
                <p>Injury Location: {scan.injury.location}</p>
                <p>Injury Type: {scan.injury.type}</p>
                <p>Injury Size: {scan.injury.size}</p>
                <p>Edema Volume: {scan.injury.edema}</p>
                <p>Imaging Used: {scan.injury.imaging.join(", ")}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold text-slate-800 mb-2">
                Potential risk
              </h2>
              <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1">
                {scan.risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold text-slate-800 mb-2">
                Related cases
              </h2>
              <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1">
                {scan.relatedCases.map((relatedCase, idx) => (
                  <li key={idx}>{relatedCase}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorBrainDashboard;
