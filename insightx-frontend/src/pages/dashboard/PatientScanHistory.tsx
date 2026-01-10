import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { type ScanSession, type ScanType } from "../../services/localScanStore";
import { deleteScan, listScans } from "../../services/scanService";
import { useAuth } from "../../context/AuthContext";
import type { ApiScan } from "../../types/scan";

type Tab = "all" | ScanType;

const mapScanToSession = (scan: ApiScan): ScanSession => {
  const modality = String(scan.modality || "").toLowerCase();
  const type: ScanType = modality === "mri" ? "brain" : "heart";
  const modalityLabel =
    modality === "mri" ? "MRI" : modality === "xray" ? "Xray" : "Other";
  const statusRaw = String(scan.status || "").toLowerCase();
  const status =
    statusRaw === "failed"
      ? "failed"
      : statusRaw === "predicted" || statusRaw === "completed"
      ? "done"
      : "processing";
  const progress = status === "done" || status === "failed" ? 100 : 50;
  const summaryError = scan.summary?.error;

  return {
    id: String(scan.id),
    patientId: String(scan.patient_id ?? ""),
    type,
    createdAt: scan.created_at ?? new Date().toISOString(),
    fileName: scan.original_filename ?? scan.file_path ?? "Uploaded scan",
    modality: modalityLabel,
    notes: scan.clinician_note ?? undefined,
    status,
    progress,
    error:
      status === "failed"
        ? typeof summaryError === "string" && summaryError.trim()
          ? summaryError
          : "Prediction failed"
        : undefined,
    riskLevel: scan.risk_level ?? undefined,
    reviewStatus: scan.review_status ?? undefined,
    clinicianNote: scan.clinician_note ?? undefined,
    updatedAt: scan.updated_at ?? undefined,
  };
};

export default function PatientScanHistory() {
  const { user } = useAuth();
  const patientId = user?.patientId;
  const [tab, setTab] = useState<Tab>("all");
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setSessions([]);
      setLoading(false);
      setError("Patient not found.");
      return;
    }

    setLoading(true);
    setError(null);
    listScans({ patient_id: patientId })
      .then((scans) => setSessions(scans.map(mapScanToSession)))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [patientId]);

  const filtered = useMemo(
    () => sessions.filter((s) => (tab === "all" ? true : s.type === tab)),
    [sessions, tab]
  );

  const handleDeleteScan = async (scanId: string) => {
    if (!window.confirm("Delete this scan? This cannot be undone.")) return;
    setDeletingId(scanId);
    setError(null);
    try {
      await deleteScan(scanId);
      setSessions((prev) => prev.filter((s) => s.id !== scanId));
    } catch (err: any) {
      setError(err?.message ?? "Unable to delete scan.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">History</p>
            <h1 className="text-lg font-semibold">My Scan History</h1>
          </div>
          <Link
            to="/dashboard/patient/scans"
            className="text-xs text-sky-600 hover:underline"
          >
            Back to Scans
          </Link>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "brain", "heart"] as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1 rounded-full border text-xs ${
                tab === key ? "bg-slate-900 text-white" : "bg-white text-slate-700"
              }`}
            >
              {key === "all" ? "All" : key === "brain" ? "Brain" : "Heart"}
            </button>
          ))}
        </div>

        <div className="bg-white border rounded-2xl shadow-sm">
          {loading ? (
            <div className="p-6 text-sm text-slate-600">Loading scans...</div>
          ) : error ? (
            <div className="p-6 text-sm text-rose-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">No scan sessions yet.</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((session) => (
                <li key={session.id} className="p-4 flex flex-col gap-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {session.type.toUpperCase()} - {session.fileName ?? "Uploaded scan"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(session.createdAt).toLocaleString()} - {session.modality ?? "Unknown"}
                      </span>
                      <span className="text-xs text-slate-500">
                        Scan ID: {session.id}
                        {session.riskLevel && ` | Risk: ${session.riskLevel}`}
                        {session.reviewStatus && ` | Review: ${session.reviewStatus}`}
                      </span>
                      {session.notes && (
                        <span className="text-xs text-slate-600 line-clamp-2">
                          Notes: {session.notes}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          session.status === "done"
                            ? "bg-emerald-50 text-emerald-700"
                            : session.status === "failed"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {session.status} - {session.progress}%
                      </span>
                      {session.status === "processing" || session.status === "queued" ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-slate-100 rounded overflow-hidden">
                            <div
                              className="h-full bg-sky-500"
                              style={{ width: `${session.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <Link
                          to={`/dashboard/scans/${session.id}`}
                          className="px-3 py-1 rounded-full border text-slate-700"
                        >
                          Open
                        </Link>
                      )}
                      <button
                        onClick={() => handleDeleteScan(session.id)}
                        className="px-3 py-1 rounded-full border text-rose-600"
                        disabled={deletingId === session.id}
                      >
                        {deletingId === session.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                  {session.status === "failed" && session.error && (
                    <div className="text-xs text-rose-600">{session.error}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
