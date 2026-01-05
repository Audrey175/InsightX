import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { jsPDF } from "jspdf";

// Layouts & Components
import DashboardLayout from "../../layouts/DashboardLayout";
import PatientSelector from "../../components/PatientSelector";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/button";

// Services & Types
import { predictXRay } from "../../api/xray_predict";
import type { XRayPredictionResult } from "../../api/xray_predict";
import { fetchDoctorHeartScan } from "../../services/doctorService";
import type { DoctorHeartScanRecord } from "../../data/doctorHeartData";
import { getLatestDoneSession, getSession } from "../../services/localScanStore";
import { findPatientById, patients } from "../../data/fakeDatabase";

const DoctorHeartDashboard: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Scan & Patient State
  const [scan, setScan] = useState<DoctorHeartScanRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // X-Ray Analysis State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<XRayPredictionResult | null>(null);
  const [mriLoading, setMriLoading] = useState<boolean>(false);
  const [mriError, setMriError] = useState<string | null>(null);

  const sessionId = searchParams.get("sessionId");
  const patientInfo = findPatientById(patientId ?? "");

  const mapSession = () => {
    if (!patientId) return null;
    const session = sessionId
      ? getSession(sessionId)
      : getLatestDoneSession(patientId, "heart");
    if (
      !session ||
      session.status !== "done" ||
      session.type !== "heart" ||
      session.patientId !== patientId ||
      !session.data?.doctor
    ) {
      return null;
    }
    const sData = session.data.doctor as Partial<DoctorHeartScanRecord>;
    return {
      patientId,
      patientName: sData.patientName ?? patientInfo?.name ?? "Unknown patient",
      avatar: sData.avatar ?? patientInfo?.avatar ?? "NA",
      lastScanDate: sData.lastScanDate ?? session.createdAt,
      scanId: sData.scanId ?? `H-SESSION-${session.id}`,
      heartRate: sData.heartRate ?? 0,
      pressure: sData.pressure ?? "N/A",
      oxygen: sData.oxygen ?? 0,
      injury: sData.injury ?? 0,
      condition: sData.condition ?? {
        status: "Stable",
        notes: "N/A",
      },
      risks: sData.risks ?? [],
      relatedCases: sData.relatedCases ?? [],
    } as DoctorHeartScanRecord;
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
        const record = await fetchDoctorHeartScan(patientId);
        if (!record) {
          setError("No heart scan available for this patient.");
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

  const handleXrayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(URL.createObjectURL(file));
    setMriLoading(true);
    setMriError(null);
    setPrediction(null);

    try {
      const result = await predictXRay(file);
      console.log("X-RAY RESULT:", result);
      setPrediction(result);
    } catch {
      setMriError("Failed to analyze X-ray.");
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
    doc.text("InsightX Heart Diagnostic Report", 10, 20);
    doc.text(`Patient: ${scan.patientName}`, 10, 30);
    doc.text(`BPM: ${scan.heartRate}`, 10, 40);
    doc.save(`Heart_Report_${scan.patientId}.pdf`);
  };

  if (loading) return <DashboardLayout><LoadingState message="Loading heart scan..." /></DashboardLayout>;
  if (error || !scan) return (
    <DashboardLayout>
      <ErrorState message={error ?? "No scan data."} onAction={() => navigate("/dashboard/doctor/patients")} />
    </DashboardLayout>
  );

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
            <Link to={`/dashboard/doctor/history/${scan.patientId}`} className="px-3 py-1 rounded-full border text-slate-700">
              View Scan History
            </Link>
            <Button onClick={exportPdf} className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs">
              Export PDF Report
            </Button>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded-full bg-sky-600 text-white">Heart</button>
              <button onClick={() => handleNavigate("brain")} className="px-3 py-1 rounded-full border text-slate-600">
                Brain
              </button>
            </div>
            <PatientSelector currentId={scan.patientId} organ="heart" />
            <div className="h-8 w-8 rounded-full bg-amber-300 flex items-center justify-center text-xs font-bold">
              {scan.avatar}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)] gap-4">
          {/* LEFT PANEL - UPLOAD */}
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <h2 className="text-xs font-semibold text-slate-700 mb-2">Upload Chest X-ray</h2>
            <input type="file" accept="image/*" onChange={handleXrayUpload} className="text-xs" />

            {selectedImage && (
              <div className="mt-4 border rounded-lg p-2 bg-slate-50">
                <img src={selectedImage} alt="Uploaded Xray" className="h-48 w-full object-contain rounded" />
              </div>
            )}

            {mriLoading && <p className="text-xs text-blue-600 mt-2 animate-pulse">Analyzing X-ray via AI...</p>}
            {mriError && <p className="text-xs text-red-500 mt-2">{mriError}</p>}
          </div>

          {/* RIGHT PANEL - PREDICTION */}
          {prediction && (
            <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-2 text-xs">
              <h2 className="font-semibold text-sm border-b pb-2">X-ray AI Analysis</h2>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <p><strong>Result:</strong> 
                  <span className={prediction.prediction.label === "PNEUMONIA" ? "text-red-600 ml-1 font-bold" : "text-green-600 ml-1 font-bold"}>
                    {prediction.prediction.label}
                  </span>
                </p>
                <p><strong>Confidence:</strong> {(prediction.prediction.confidence * 100).toFixed(1)}%</p>
                <p><strong>Risk Level:</strong> <span className="capitalize">{prediction.prediction.risk_level}</span></p>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="font-semibold mb-1">Detailed Probabilities</p>
                <div className="flex justify-between border-b py-1">
                  <span>Normal</span>
                  <span>{(prediction.prediction.probabilities.NORMAL * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-1 text-red-600">
                  <span>Pneumonia</span>
                  <span>{(prediction.prediction.probabilities.PNEUMONIA * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="mt-4 text-slate-500 italic text-[10px]">
                {prediction.disclaimer}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorHeartDashboard;