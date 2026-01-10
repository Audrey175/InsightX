import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import BrainHero from "../../assets/brainhome.png";
import { fetchPatientBrainScan } from "../../services/patientService";
import type { PatientBrainRecord } from "../../data/patientBrainData";
import { useAuth } from "../../context/AuthContext";
import { USE_MOCK } from "../../services/api";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { uploadScan, updateScan, deleteScan } from "../../services/scanService";
import type { ApiScan } from "../../types/scan";

const DEFAULT_PATIENT_ID = "P-0001";

const PatientBrainDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PatientBrainRecord | null>(null);
  const [activeScan, setActiveScan] = useState<ApiScan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const patientId = user?.patientId ?? (USE_MOCK ? DEFAULT_PATIENT_ID : undefined);

  useEffect(() => {
    if (!patientId) {
      setError("Patient not found.");
      setLoading(false);
      return;
    }
    const resolvedPatientId = String(patientId);
    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        const record = await fetchPatientBrainScan(resolvedPatientId);
        setData(record);
      } catch (err: any) {
        setError(err?.message ?? "Unable to load brain scan.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  const summary = activeScan?.summary ?? null;
  const keyFindings = summary?.key_findings ?? null;
  const summaryError =
    String(activeScan?.status || "").toLowerCase() === "failed"
      ? typeof summary?.error === "string" && summary.error.trim()
        ? summary.error
        : "Prediction failed."
      : null;
  const aiResultJson = activeScan?.ai_result
    ? JSON.stringify(activeScan.ai_result, null, 2)
    : "";

  const scanIdDisplay = activeScan?.id ?? data?.scanId ?? "N/A";
  const summaryText =
    summary?.recommendation ?? data?.doctorSummary ?? "Awaiting clinician review.";
  const detailNotes = keyFindings
    ? Object.entries(keyFindings).map(([key, value]) => `${key}: ${String(value)}`)
    : data?.doctorNotes ?? [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!patientId) {
      setUploadError("Patient not found.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    setActionMessage(null);
    setActionError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patient_id", String(patientId));
      formData.append("modality", "mri");

      const created = await uploadScan(formData, {
        patientId: String(patientId),
        modality: "mri",
      });
      setActiveScan(created);
      setNote(created.clinician_note ?? "");
      setActionMessage("Scan uploaded.");

      const latest = await fetchPatientBrainScan(String(patientId));
      setData(latest);
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
        clinician_note: note,
      });
      setActiveScan(updated);
      setNote(updated.clinician_note ?? "");
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
      setNote("");
      setActionMessage("Scan discarded.");
      if (patientId) {
        const latest = await fetchPatientBrainScan(String(patientId));
        setData(latest);
      }
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to discard scan.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading your brain scan..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState message={error ?? "No brain scan data found."} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Your Brain Scan Overview</h1>
            <p className="text-xs text-slate-500">Scan ID: {scanIdDisplay}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Link
              to="/dashboard/patient/history"
              className="px-3 py-1 rounded-full border text-slate-700"
            >
              View Scan History
            </Link>
            <Link
              to="/dashboard/patient/scans"
              className="px-3 py-1 rounded-full border text-slate-700"
            >
              My Scans
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold">Upload Brain MRI</h2>
            <input
              type="file"
              accept=".zip"
              onChange={handleUpload}
              className="text-xs"
            />
          </div>

          {uploading && (
            <p className="text-xs text-slate-500">Analyzing MRI...</p>
          )}
          {uploadError && (
            <p className="text-xs text-rose-600">{uploadError}</p>
          )}

          {activeScan ? (
            <div className="space-y-3 text-xs text-slate-700">
              {summaryError && (
                <p className="text-rose-600 font-semibold">{summaryError}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
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
                  <span className="font-semibold">Created:</span>{" "}
                  {activeScan.created_at
                    ? new Date(activeScan.created_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>

              {summary && (
                <div className="border-t pt-3 space-y-2">
                  <p>
                    <span className="font-semibold">Severity:</span>{" "}
                    <span className="uppercase">{summary.severity ?? "N/A"}</span>
                  </p>
                  <p>
                    <span className="font-semibold">Recommendation:</span>{" "}
                    {summary.recommendation ?? "N/A"}
                  </p>
                </div>
              )}

              <label className="text-[10px] uppercase text-slate-400 font-bold">
                Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
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

              {aiResultJson && (
                <details className="text-[11px] text-slate-600">
                  <summary className="cursor-pointer">View AI result</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-[10px] bg-slate-50 p-2 rounded">
                    {aiResultJson}
                  </pre>
                </details>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Upload a DICOM .zip to run analysis.
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex items-center justify-center">
              <img src={BrainHero} className="max-h-64 object-contain" />
            </div>

            <div className="w-full lg:w-60 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="font-semibold mb-1">Your Cognitive Stats</p>
                <div className="grid grid-cols-2 text-[11px] text-slate-700 gap-1">
                  <span>Oxygenation</span>
                  <span className="text-right">
                    {data?.oxygenation ?? "--"}%
                  </span>
                  <span>Stress Level</span>
                  <span className="text-right">{data?.stress ?? "--"}</span>
                  <span>Focus</span>
                  <span className="text-right">{data?.focus ?? "--"}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="font-semibold mb-1">Cognitive Score</p>
                <p className="text-[11px]">{data?.score ?? "--"} / 100</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 text-xs">
            <button className="px-4 py-1.5 rounded-full bg-sky-700 text-white font-medium">
              3D
            </button>
            <button className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700">
              Heat map
            </button>
            <button className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700">
              Raw
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <h2 className="text-sm font-semibold">Doctor's Summary</h2>
          <p className="mt-1 text-[11px] text-slate-700">{summaryText}</p>

          <h3 className="mt-3 text-xs font-semibold">Detailed Notes</h3>
          <ul className="list-disc list-inside mt-1 text-[11px] text-slate-700 space-y-1">
            {detailNotes.length ? (
              detailNotes.map((note) => <li key={note}>{note}</li>)
            ) : (
              <li>No additional notes available.</li>
            )}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientBrainDashboard;
