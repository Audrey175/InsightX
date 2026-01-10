import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { deleteScan, getScan, updateScan } from "../../services/scanService";
import type { ApiScan } from "../../types/scan";

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function ScanDetailPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scan, setScan] = useState<ApiScan | null>(null);
  const [note, setNote] = useState("");
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDoctor = user?.role === "doctor";

  useEffect(() => {
    if (!scanId) {
      setLoadError("Scan not found.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await getScan(scanId);
        setScan(data);
        setNote(data.clinician_note ?? "");
        setReviewStatus(data.review_status ?? "");
      } catch (err: any) {
        setLoadError(err?.message ?? "Unable to load scan.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [scanId]);

  const failedError = useMemo(() => {
    if (!scan) return null;
    if (String(scan.status || "").toLowerCase() !== "failed") return null;
    const err = scan.summary?.error;
    if (typeof err === "string" && err.trim()) return err;
    return "Prediction failed.";
  }, [scan]);

  const summary = scan?.summary ?? null;
  const keyFindings = summary?.key_findings ?? null;
  const aiResultJson = scan?.ai_result
    ? JSON.stringify(scan.ai_result, null, 2)
    : "";

  const handleSave = async () => {
    if (!scanId || !isDoctor) return;
    setSaving(true);
    setSuccess(null);
    setSaveError(null);

    try {
      const payload = {
        clinician_note: note,
        review_status: reviewStatus || undefined,
      };
      const response = await updateScan(scanId, payload);
      setScan(response);
      setSuccess("Saved.");
    } catch (err: any) {
      setSaveError(err?.message ?? "Unable to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!scanId) return;
    if (!window.confirm("Delete this scan? This cannot be undone.")) return;
    setDeleting(true);
    setSaveError(null);
    try {
      await deleteScan(scanId);
      if (user?.role === "patient") {
        navigate("/dashboard/patient/history", { replace: true });
      } else if (user?.role === "doctor" && scan?.patient_id) {
        navigate(`/dashboard/doctor/history/${scan.patient_id}`, {
          replace: true,
        });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      setSaveError(err?.message ?? "Unable to delete scan.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading scan..." />
      </DashboardLayout>
    );
  }

  if (loadError || !scan) {
    return (
      <DashboardLayout>
        <ErrorState message={loadError ?? "Scan not found."} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-500">Scan detail</p>
          <h1 className="text-lg font-semibold">Scan {scan.id}</h1>
        </div>

        {failedError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {failedError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-2xl p-4 space-y-2 text-sm">
            <h2 className="text-sm font-semibold">Metadata</h2>
            <div className="text-xs text-slate-700 space-y-1">
              <div>
                <span className="font-semibold">Patient ID:</span>{" "}
                {scan.patient_id ?? "N/A"}
              </div>
              <div>
                <span className="font-semibold">Doctor ID:</span>{" "}
                {scan.doctor_id ?? "N/A"}
              </div>
              <div>
                <span className="font-semibold">Modality:</span>{" "}
                {scan.modality ?? "N/A"}
              </div>
              <div>
                <span className="font-semibold">Status:</span>{" "}
                {scan.status ?? "N/A"}
              </div>
              <div>
                <span className="font-semibold">Risk Level:</span>{" "}
                {scan.risk_level ?? "N/A"}
              </div>
              <div>
                <span className="font-semibold">Review Status:</span>{" "}
                {scan.review_status ?? "Not set"}
              </div>
              <div>
                <span className="font-semibold">Created:</span>{" "}
                {formatDate(scan.created_at)}
              </div>
              <div>
                <span className="font-semibold">Updated:</span>{" "}
                {formatDate(scan.updated_at)}
              </div>
              <div>
                <span className="font-semibold">Original file:</span>{" "}
                {scan.original_filename ?? "N/A"}
              </div>
              <div>
                <span className="font-semibold">File path:</span>{" "}
                {scan.file_path ?? "N/A"}
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-4 space-y-3 text-sm">
            <h2 className="text-sm font-semibold">Clinician Review</h2>
            {isDoctor ? (
              <>
                <label className="text-xs font-medium">Review status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="">Not set</option>
                  <option value="saved">Saved</option>
                  <option value="reviewed">Reviewed</option>
                </select>
                <label className="text-xs font-medium">Clinician note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={5}
                  className="border rounded px-3 py-2 text-sm"
                  placeholder="Add a clinician note..."
                />
                {success && (
                  <p className="text-xs text-emerald-600">{success}</p>
                )}
                {saveError && (
                  <p className="text-xs text-rose-600">{saveError}</p>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-sky-600 hover:bg-sky-700"
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={deleting}
                    variant="secondary"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-700 space-y-2">
                <div>
                  <span className="font-semibold">Review status:</span>{" "}
                  {scan.review_status ?? "Not set"}
                </div>
                <div className="space-y-1">
                  <span className="font-semibold">Clinician note:</span>
                  <div className="rounded border bg-slate-50 p-2 whitespace-pre-wrap">
                    {scan.clinician_note ?? "No clinician notes available."}
                  </div>
                </div>
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  variant="secondary"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border rounded-2xl p-4 space-y-2">
            <h2 className="text-sm font-semibold">Summary</h2>
            <div className="text-xs text-slate-700 space-y-2">
              <p>
                <span className="font-semibold">Severity:</span>{" "}
                <span className="uppercase">{summary?.severity ?? "N/A"}</span>
              </p>
              <p>
                <span className="font-semibold">Recommendation:</span>{" "}
                {summary?.recommendation ?? "N/A"}
              </p>
              {keyFindings && (
                <div>
                  <p className="font-semibold">Key findings</p>
                  <ul className="list-disc list-inside text-[11px] text-slate-600">
                    {Object.entries(keyFindings).map(([key, value]) => (
                      <li key={key}>
                        {key}: {String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white border rounded-2xl p-4 space-y-2">
            <h2 className="text-sm font-semibold">AI Result</h2>
            {aiResultJson ? (
              <details className="text-xs text-slate-700">
                <summary className="cursor-pointer">View raw AI result</summary>
                <pre className="mt-2 text-[11px] text-slate-600 whitespace-pre-wrap bg-slate-50 p-2 rounded">
                  {aiResultJson}
                </pre>
              </details>
            ) : (
              <p className="text-xs text-slate-500">No AI result available.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
