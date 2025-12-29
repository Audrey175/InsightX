import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  createSession,
  updateSession,
  type ScanSession,
  type ScanType,
} from "../../services/localScanStore";
import type { DoctorBrainScanRecord } from "../../data/doctorBrainData";
import type { DoctorHeartScanRecord } from "../../data/doctorHeartData";
import type { PatientBrainRecord } from "../../data/patientBrainData";
import type { PatientHeartRecord } from "../../data/patientHeartData";
import { findPatientById, type StressLevel } from "../../data/fakeDatabase";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import {
  predictMRI,
  predictXRay,
  type PredictionResult,
  type XRayPredictionResult,
} from "../../services/predictionService";

const MAX_SIZE = 10 * 1024 * 1024;
const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/dicom",
  "application/dicom+json",
  "application/x-hdf5",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function DoctorUploadScanPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scanType, setScanType] = useState<ScanType>("brain");
  const [modality, setModality] = useState<"Xray" | "MRI" | "CT" | "Other">("MRI");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [session, setSession] = useState<ScanSession | null>(null);
  const [aiResult, setAiResult] = useState<
    PredictionResult | XRayPredictionResult | null
  >(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const isDoctor = user?.role === "doctor";

  const patientInfo = findPatientById(patientId ?? "") || undefined;
  const patientLabel = patientInfo ? `${patientInfo.name} (${patientInfo.id})` : patientId ?? "Unknown";

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  useEffect(() => {
    setAiResult(null);
    setAiError(null);
  }, [file, scanType]);

  const validateFile = (f: File | null) => {
    if (!f) return "File is required";
    if (f.size > MAX_SIZE) return "File size must be under 10MB";
    if (
      !allowedTypes.includes(f.type) &&
      !f.type.startsWith("image/") &&
      !f.name.toLowerCase().endsWith(".h5")
    )
      return "Unsupported file type";
    return null;
  };

  const buildBrainData = (id: string) => {
    const scanId = `B-UP-${Date.now()}`;
    const doctorData: DoctorBrainScanRecord = {
      patientId: patientId ?? "unknown",
      patientName: patientInfo?.name ?? "Unknown patient",
      avatar: patientInfo?.avatar ?? "NA",
      lastScanDate: new Date().toISOString(),
      scanId,
      oxygenation: Math.round(65 + Math.random() * 30),
      stress: ["Low", "Normal", "High"][Math.floor(Math.random() * 3)] as StressLevel,
      focus: ["Stable", "Fluctuating", "Low"][Math.floor(Math.random() * 3)] as any,
      performanceScore: Math.round(70 + Math.random() * 25),
      injury: {
        location: "Frontal Lobe",
        type: "Uploaded scan",
        size: `${(Math.random() * 2 + 0.5).toFixed(1)} cm region`,
        edema: `${(Math.random() * 10 + 3).toFixed(0)} ml`,
        imaging: ["MRI T1", "T2"],
      },
      risks: ["Auto-generated risk review pending"],
      relatedCases: ["Pending review"],
    };

    const patientData: PatientBrainRecord = {
      patientId: patientId ?? "unknown",
      name: patientInfo?.name ?? "Unknown patient",
      avatar: patientInfo?.avatar ?? "NA",
      scanId,
      oxygenation: doctorData.oxygenation,
      stress: doctorData.stress,
      focus: doctorData.focus,
      score: doctorData.performanceScore,
      doctorSummary: "New brain scan uploaded by doctor.",
      doctorNotes: [
        "Review auto-generated metrics before finalizing.",
        "Validate against clinical findings.",
      ],
    };

    return { doctor: doctorData, patient: patientData, sessionId: id };
  };

  const buildHeartData = (id: string) => {
    const scanId = `H-UP-${Date.now()}`;
    const severity = ["Low", "Moderate", "High"][Math.floor(Math.random() * 3)] as any;
    const doctorData: DoctorHeartScanRecord = {
      patientId: patientId ?? "unknown",
      patientName: patientInfo?.name ?? "Unknown patient",
      avatar: patientInfo?.avatar ?? "NA",
      lastScanDate: new Date().toISOString(),
      scanId,
      heartRate: Math.round(70 + Math.random() * 25),
      oxygen: Math.round(95 + Math.random() * 4),
      pressure: `${Math.round(110 + Math.random() * 20)}/${Math.round(70 + Math.random() * 15)} mmHg`,
      condition: "Uploaded heart scan",
      injury: {
        region: "Left Ventricle",
        type: "Functional review pending",
        severity,
        size: `${(Math.random() * 1.5 + 0.5).toFixed(1)} cm region`,
        imaging: ["Echo", "Cardiac MRI"],
      },
      risks: ["Auto-generated risk review pending"],
      relatedCases: ["Pending review"],
    };

    const heartStress: StressLevel =
      severity === "High" ? "High" : severity === "Moderate" ? "Normal" : "Low";

    const patientData: PatientHeartRecord = {
      patientId: patientId ?? "unknown",
      name: patientInfo?.name ?? "Unknown patient",
      avatar: patientInfo?.avatar ?? "NA",
      scanId,
      bpm: doctorData.heartRate,
      oxygen: doctorData.oxygen,
      stress: heartStress,
      pressure: doctorData.pressure,
      condition: doctorData.condition,
      doctorNotes: [
        "Preliminary heart scan uploaded.",
        "Awaiting clinician validation.",
      ],
    };

    return { doctor: doctorData, patient: patientData, sessionId: id };
  };

  const runScan = async () => {
    setError(null);
    if (!patientId) {
      setError("Missing patient ID");
      return;
    }
    const validation = validateFile(file);
    if (validation) {
      setError(validation);
      return;
    }

    const newSession = createSession({
      patientId,
      type: scanType,
      fileName: file?.name,
      modality,
      notes,
      status: "queued",
    });
    setSession(newSession);

    const steps = [
      { status: "queued" as const, progress: 0, delay: 400 },
      { status: "processing" as const, progress: 25, delay: 600 },
      { status: "processing" as const, progress: 60, delay: 600 },
      { status: "processing" as const, progress: 90, delay: 600 },
    ];

    let current = newSession;
    for (const step of steps) {
      await sleep(step.delay);
      current = updateSession(newSession.id, {
        status: step.status,
        progress: step.progress,
      }) ?? current;
      setSession(current);
    }

    await sleep(300);
    const data =
      scanType === "brain"
        ? buildBrainData(newSession.id)
        : buildHeartData(newSession.id);

    current =
      updateSession(newSession.id, {
        status: "done",
        progress: 100,
        data,
      }) ?? current;
    setSession(current);

    const target =
      scanType === "brain"
        ? `/dashboard/doctor/brain/${patientId}`
        : `/dashboard/doctor/heart/${patientId}`;
    navigate(`${target}?sessionId=${current.id}`, { replace: true });
  };

  const isMriResult = (
    result: PredictionResult | XRayPredictionResult
  ): result is PredictionResult => "tumor_detected" in result;

  const runAiPrediction = async () => {
    setAiError(null);
    setAiResult(null);

    if (!file) {
      setAiError("Select a file to run AI prediction.");
      return;
    }

    if (scanType === "brain" && !file.name.toLowerCase().endsWith(".h5")) {
      setAiError("MRI predictor expects a .h5 file.");
      return;
    }

    if (scanType === "heart" && !file.type.startsWith("image/")) {
      setAiError("X-ray predictor expects an image file.");
      return;
    }

    setAiLoading(true);
    try {
      if (scanType === "brain") {
        const result = await predictMRI(file);
        setAiResult(result);
      } else {
        const result = await predictXRay(file);
        setAiResult(result);
      }
    } catch {
      setAiError("AI prediction failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const disableRun = !file || !isDoctor;
  const progress = session?.progress ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-4 min-w-0 max-w-3xl">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-500">Upload scan for patient</p>
          <h1 className="text-lg font-semibold">Upload Scan - {patientLabel}</h1>
          <button
            className="text-xs text-sky-600 underline w-fit"
            onClick={() => navigate("/dashboard/doctor/upload")}
          >
            Change patient
          </button>
        </div>

        <div className="bg-white border rounded-2xl shadow-sm p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Scan type</label>
              <select
                value={scanType}
                onChange={(e) => setScanType(e.target.value as ScanType)}
                className="border rounded px-3 py-2 text-sm max-w-xs"
              >
                <option value="brain">Brain</option>
                <option value="heart">Heart</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Modality</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as any)}
                className="border rounded px-3 py-2 text-sm max-w-xs"
              >
                <option value="Xray">Xray</option>
                <option value="MRI">MRI</option>
                <option value="CT">CT</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Upload file</label>
            <input
              type="file"
              accept=".dcm,.h5,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            {file && (
              <p className="text-xs text-slate-600">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="mt-2 h-40 w-auto rounded border object-contain"
              />
            )}
            <p className="text-[11px] text-slate-500">
              Allowed: .dcm, .h5, .png, .jpg, .jpeg. Max 10MB.
            </p>
          </div>

          <div className="bg-slate-50 border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">AI Prediction (optional)</p>
              <span className="text-xs text-slate-500">
                {scanType === "brain" ? "MRI (.h5)" : "X-ray (image)"}
              </span>
            </div>
            <Button
              onClick={runAiPrediction}
              disabled={!file || aiLoading}
              className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500"
            >
              {aiLoading ? "Running..." : "Run AI Prediction"}
            </Button>

            {aiError && <p className="text-sm text-red-600">{aiError}</p>}

            {aiResult && (
              <div className="bg-white border rounded-xl p-3 text-xs space-y-2">
                {isMriResult(aiResult) ? (
                  <>
                    <p className="font-semibold text-slate-800">
                      MRI Prediction
                    </p>
                    <p>
                      <span className="font-medium">File:</span>{" "}
                      {aiResult.filename}
                    </p>
                    <p>
                      <span className="font-medium">Tumor detected:</span>{" "}
                      {aiResult.tumor_detected ? "Yes" : "No"}
                    </p>
                    <p>
                      <span className="font-medium">Risk score:</span>{" "}
                      {(aiResult.risk_score * 100).toFixed(1)}%
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-slate-800">
                      X-ray Prediction
                    </p>
                    <p>
                      <span className="font-medium">File:</span>{" "}
                      {aiResult.filename}
                    </p>
                    <p>
                      <span className="font-medium">Label:</span>{" "}
                      {aiResult.prediction.label}
                    </p>
                    <p>
                      <span className="font-medium">Confidence:</span>{" "}
                      {(aiResult.prediction.confidence * 100).toFixed(1)}%
                    </p>
                    <p>
                      <span className="font-medium">Risk:</span>{" "}
                      {aiResult.prediction.risk_level}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border rounded px-3 py-2 text-sm"
              placeholder="Optional notes..."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="space-y-2">
            <div className="h-2 w-full rounded bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-sky-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Status: {session?.status ?? "idle"}</span>
              <span>{progress}%</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={runScan}
              disabled={disableRun}
              className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-500"
            >
              {session && session.status !== "done" ? "Processing..." : "Run Scan"}
            </Button>
            <p className="text-xs text-slate-500">
              This is a simulation. Results are stored locally for this browser.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
