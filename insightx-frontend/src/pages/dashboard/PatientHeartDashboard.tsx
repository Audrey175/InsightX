import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { fetchPatientHeartScan } from "../../services/patientService";
import type { PatientHeartRecord } from "../../data/patientHeartData";
import { useAuth } from "../../context/AuthContext";
import { uploadScan, updateScan, deleteScan } from "../../services/scanService";
import type { ApiScan } from "../../types/scan";

const PatientHeartDashboard: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.patientId;

  const [scan, setScan] = useState<PatientHeartRecord | null>(null);
  const [activeScan, setActiveScan] = useState<ApiScan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [clinicianNote, setClinicianNote] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    const resolvedPatientId = String(patientId);

    setLoading(true);
    setError(null);
    setActiveScan(null);
    setActionMessage(null);
    setActionError(null);

    const load = async () => {
      try {
        const record = await fetchPatientHeartScan(resolvedPatientId);
        if (record) {
          setScan(record);
          return;
        }
        setScan({
          patientId: resolvedPatientId,
          name: user?.fullName ?? "Patient",
          avatar: "NA",
          scanId: "N/A",
          bpm: 0,
          oxygen: 0,
          stress: "Low",
          pressure: "N/A",
          condition: "No scans yet.",
          doctorNotes: [],
        });
      } catch (err: any) {
        setError(err?.message ?? "Unable to load heart scan.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [patientId, user?.fullName]);

  const handleXrayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(URL.createObjectURL(file));
    if (!patientId) {
      setUploadError("Patient ID missing. Please sign in again.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patient_id", String(patientId));
      formData.append("modality", "xray");

      const created = await uploadScan(formData, {
        patientId: String(patientId),
        modality: "xray",
      });
      setActiveScan(created);
      setClinicianNote(created.clinician_note ?? "");
      setActionMessage("Scan uploaded.");
    } catch (err: any) {
      setUploadError(err?.message ?? "Failed to analyze X-ray.");
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
      setSelectedImage(null);
      setClinicianNote("");
      setActionMessage("Scan discarded.");
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to discard scan.");
    }
  };

  const aiResult = activeScan?.ai_result ?? null;
  const summary = activeScan?.summary ?? null;
  const keyFindings = summary?.key_findings ?? null;
  const prediction = (aiResult as any)?.prediction ?? null;
  const summaryError =
    String(activeScan?.status || "").toLowerCase() === "failed"
      ? typeof summary?.error === "string" && summary.error.trim()
        ? summary.error
        : "Prediction failed."
      : null;
  const aiResultJson = aiResult ? JSON.stringify(aiResult, null, 2) : "";

  const patientName = scan?.name ?? user?.fullName ?? "Patient";
  const scanIdDisplay = activeScan?.id ?? scan?.scanId ?? "N/A";
  const avatar = scan?.avatar ?? "NA";

  if (!patientId) {
    return (
      <DashboardLayout>
        <ErrorState message="Patient ID missing. Please sign in again." />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading your heart scan..." />
      </DashboardLayout>
    );
  }

  if (error || !scan) {
    return (
      <DashboardLayout>
        <ErrorState message={error ?? "No heart scan data found."} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">
              Home &gt; Personal Dashboard &gt; {scanIdDisplay}
            </p>
            <h1 className="text-lg font-semibold mt-1">{patientName}</h1>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded-full bg-sky-600 text-white">
                Heart
              </button>
              <Link
                to="/dashboard/patient/brain"
                className="px-3 py-1 rounded-full border text-slate-600"
              >
                Brain
              </Link>
            </div>

            <Link
              to="/dashboard/patient/history"
              className="px-3 py-1 rounded-full border text-slate-600"
            >
              View History
            </Link>

            <div className="h-8 w-8 rounded-full bg-amber-300 flex items-center justify-center text-xs font-bold">
              {avatar}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)] gap-4">
          <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
            <div className="flex justify-between text-xs text-slate-500">
              <h2 className="font-semibold mb-2">Upload Chest X-ray</h2>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleXrayUpload}
              className="text-xs"
            />

            {selectedImage && (
              <img
                src={selectedImage}
                alt="Uploaded Xray"
                className="mt-2 h-32 object-contain rounded"
              />
            )}

            {uploading && (
              <p className="text-xs text-slate-500 mt-2">Analyzing X-ray...</p>
            )}

            {uploadError && (
              <p className="text-xs text-red-500 mt-2">{uploadError}</p>
            )}

            {activeScan && (
              <div className="mt-3 space-y-3 text-xs text-slate-700">
                {summaryError && (
                  <p className="text-rose-600 font-semibold">{summaryError}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <p>
                    <span className="font-semibold">Scan ID:</span> {activeScan.id}
                  </p>
                  <p>
                    <span className="font-semibold">Created:</span>{" "}
                    {activeScan.created_at
                      ? new Date(activeScan.created_at).toLocaleString()
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    {activeScan.status ?? "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Risk:</span>{" "}
                    {activeScan.risk_level ?? "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Review:</span>{" "}
                    {activeScan.review_status ?? "draft"}
                  </p>
                  <p>
                    <span className="font-semibold">Modality:</span>{" "}
                    {activeScan.modality ?? "xray"}
                  </p>
                </div>

                {summary && (
                  <div className="border-t pt-3 space-y-2">
                    <p>
                      <span className="font-semibold">Severity:</span>{" "}
                      <span className="uppercase">
                        {summary.severity ?? "N/A"}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold">Recommendation:</span>{" "}
                      {summary.recommendation ?? "N/A"}
                    </p>
                    {keyFindings && (
                      <div className="text-[11px] text-slate-600">
                        <p className="uppercase text-[10px] text-slate-400 font-bold">
                          Key Findings
                        </p>
                        <ul className="list-disc list-inside">
                          {Object.entries(keyFindings).map(([key, value]) => (
                            <li key={key}>
                              {key}: {String(value)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

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
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 rounded bg-sky-600 text-white text-xs"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleDiscard}
                    className="px-3 py-1 rounded border text-xs"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs space-y-1 text-slate-600">
              <p>
                <span className="font-semibold">Condition:</span> {scan.condition}
              </p>
              <p>
                <span className="font-semibold">Heart rate:</span> {scan.bpm} bpm
              </p>
              <p>
                <span className="font-semibold">Oxygen:</span> {scan.oxygen}%
              </p>
            </div>
          </div>

          {activeScan && (
            <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3 text-xs">
              <h2 className="font-semibold text-sm">X-ray AI Analysis</h2>

              {prediction ? (
                <>
                  <p>
                    <strong>Label:</strong>{" "}
                    <span
                      className={
                        prediction.label === "PNEUMONIA"
                          ? "text-red-600 font-semibold"
                          : "text-emerald-600 font-semibold"
                      }
                    >
                      {prediction.label}
                    </span>
                  </p>
                  <p>
                    <strong>Confidence:</strong>{" "}
                    {typeof prediction.confidence === "number"
                      ? `${(prediction.confidence * 100).toFixed(1)}%`
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Risk Level:</strong>{" "}
                    <span className="capitalize">
                      {prediction.risk_level ?? "N/A"}
                    </span>
                  </p>
                  {prediction.probabilities && (
                    <div>
                      <p className="font-semibold">Probabilities</p>
                      <ul className="ml-3 list-disc">
                        {Object.entries(prediction.probabilities).map(
                          ([key, value]) => (
                            <li key={key}>
                              {key}:{" "}
                              {typeof value === "number"
                                ? `${(value * 100).toFixed(1)}%`
                                : String(value)}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500">No AI result available yet.</p>
              )}

              {(aiResult as any)?.model_info && (
                <div className="text-[11px] text-slate-600">
                  <p className="font-semibold">Model Info</p>
                  <p>Architecture: {(aiResult as any).model_info.architecture}</p>
                  <p>Version: {(aiResult as any).model_info.version}</p>
                </div>
              )}

              {(aiResult as any)?.disclaimer && (
                <p className="text-[10px] text-slate-400">
                  {(aiResult as any).disclaimer}
                </p>
              )}

              {aiResultJson && (
                <details className="text-[11px] text-slate-600">
                  <summary className="cursor-pointer">View raw AI result</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-[10px] text-slate-600 bg-slate-50 p-2 rounded">
                    {aiResultJson}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientHeartDashboard;
