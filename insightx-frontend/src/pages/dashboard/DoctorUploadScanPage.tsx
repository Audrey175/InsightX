import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { findPatientById } from "../../data/fakeDatabase";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import {
  uploadAndPredictScan,
  type ScanModality,
  type ScanRecord,
} from "../../services/scanService";

type ScanType = "brain" | "heart";

const MAX_SIZE = 10 * 1024 * 1024;
const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/dicom",
  "application/dicom+json",
  "application/x-hdf5",
];

export default function DoctorUploadScanPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scanType, setScanType] = useState<ScanType>("brain");
  const [modality, setModality] = useState<"Xray" | "MRI" | "CT" | "Other">(
    "MRI"
  );
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDoctor = user?.role === "doctor";
  const historyTarget = patientId
    ? `/dashboard/doctor/history/${patientId}`
    : "/dashboard/doctor/patients";

  const patientInfo = findPatientById(patientId ?? "") || undefined;
  const patientLabel = patientInfo
    ? `${patientInfo.name} (${patientInfo.id})`
    : patientId ?? "Unknown";

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  useEffect(() => {
    setScanResult(null);
    setError(null);
  }, [file, scanType]);

  const validateFile = (f: File | null) => {
    if (!f) return "File is required";
    if (f.size > MAX_SIZE) return "File size must be under 10MB";
    if (
      !allowedTypes.includes(f.type) &&
      !f.type.startsWith("image/") &&
      !f.name.toLowerCase().endsWith(".h5")
    ) {
      return "Unsupported file type";
    }
    if (scanType === "brain" && !f.name.toLowerCase().endsWith(".h5")) {
      return "Brain prediction expects an .h5 MRI file.";
    }
    if (scanType === "heart" && !f.type.startsWith("image/")) {
      return "Heart prediction expects an X-ray image file.";
    }
    return null;
  };

  const validateModality = () => {
    if (scanType === "brain" && modality !== "MRI") {
      return "Brain scans currently support MRI prediction only.";
    }
    if (scanType === "heart" && modality !== "Xray") {
      return "Heart scans currently support X-ray prediction only.";
    }
    return null;
  };

  const extractError = (err: any) =>
    err?.response?.data?.detail ?? err?.message ?? "Upload failed.";

  const runPrediction = async () => {
    setError(null);
    setScanResult(null);

    if (!patientId) {
      setError("Missing patient ID.");
      return;
    }
    if (!isDoctor) {
      setError("Only doctors can upload scans.");
      return;
    }

    const validation = validateFile(file);
    if (validation) {
      setError(validation);
      return;
    }

    const modalityCheck = validateModality();
    if (modalityCheck) {
      setError(modalityCheck);
      return;
    }

    const apiModality: ScanModality = scanType === "brain" ? "mri" : "xray";
    const doctorId = user?.doctorId ?? user?.id;

    setIsSubmitting(true);
    try {
      const result = await uploadAndPredictScan(file!, {
        patientId,
        modality: apiModality,
        doctorId,
      });
      setScanResult(result);
    } catch (err: any) {
      setError(extractError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <div className="flex items-center gap-3">
            <Button
              onClick={runPrediction}
              disabled={!file || isSubmitting || !isDoctor}
              className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-500"
            >
              {isSubmitting ? "Running prediction..." : "Upload & Predict"}
            </Button>
            <Button
              onClick={() => navigate(historyTarget)}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              View History
            </Button>
          </div>
        </div>

        {scanResult && (
          <div className="bg-white border rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Prediction Result</p>
                <p className="text-xs text-slate-500">
                  {new Date(scanResult.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  scanResult.status === "predicted"
                    ? "bg-emerald-50 text-emerald-700"
                    : scanResult.status === "failed"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {scanResult.status}
              </span>
            </div>

            {scanResult.summary && (
              <div className="text-xs text-slate-700 space-y-1">
                <p>
                  <span className="font-medium">Severity:</span>{" "}
                  {scanResult.summary.severity}
                </p>
                <p>
                  <span className="font-medium">Recommendation:</span>{" "}
                  {scanResult.summary.recommendation}
                </p>
              </div>
            )}

            {scanResult.ai_result && (
              <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                {scanResult.modality === "mri" ? (
                  <>
                    <p className="font-semibold text-slate-800">MRI Findings</p>
                    <p>
                      Tumor detected:{" "}
                      {scanResult.ai_result.tumor_detected ? "Yes" : "No"}
                    </p>
                    <p>
                      Risk score:{" "}
                      {(scanResult.ai_result.risk_score * 100).toFixed(1)}%
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-slate-800">X-ray Findings</p>
                    <p>
                      Label: {scanResult.ai_result.prediction?.label ?? "N/A"}
                    </p>
                    <p>
                      Confidence:{" "}
                      {scanResult.ai_result.prediction?.confidence
                        ? `${(scanResult.ai_result.prediction.confidence * 100).toFixed(1)}%`
                        : "N/A"}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
