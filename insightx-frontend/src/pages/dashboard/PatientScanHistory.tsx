import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getScans,
  type ScanModality,
  type ScanRecord,
} from "../../services/scanService";

type Tab = "all" | "brain" | "heart";

export default function PatientScanHistory() {
  const { user } = useAuth();
  const patientId = user?.patientId;
  const [tab, setTab] = useState<Tab>("all");
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setScans([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const modality =
          tab === "all" ? undefined : (tab === "brain" ? "mri" : "xray");
        const result = await getScans({
          patientId,
          modality: modality as ScanModality | undefined,
        });
        setScans(result);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ??
            err?.message ??
            "Unable to load scan history."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [patientId, tab]);

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
            <div className="p-6 text-sm text-slate-600">
              Loading scan history...
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-rose-600">{error}</div>
          ) : scans.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">No scans yet.</div>
          ) : (
            <ul className="divide-y">
              {scans.map((scan) => (
                <li key={scan.id} className="p-4 flex flex-col gap-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {scan.modality.toUpperCase()} •{" "}
                        {scan.original_filename ?? "Uploaded scan"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(scan.created_at).toLocaleString()} •{" "}
                        {scan.status}
                      </span>
                      {scan.summary?.severity && (
                        <span className="text-xs text-slate-600">
                          Severity: {scan.summary.severity}
                        </span>
                      )}
                      {scan.summary?.error && (
                        <span className="text-xs text-rose-600">
                          Error: {scan.summary.error}
                        </span>
                      )}
                      {scan.ai_result?.prediction?.label && (
                        <span className="text-xs text-slate-600">
                          Label: {scan.ai_result.prediction.label}
                          {scan.ai_result.prediction.confidence !== undefined
                            ? ` (${(scan.ai_result.prediction.confidence * 100).toFixed(1)}%)`
                            : ""}
                        </span>
                      )}
                      {scan.ai_result?.tumor_detected !== undefined && (
                        <span className="text-xs text-slate-600">
                          Tumor detected: {scan.ai_result.tumor_detected ? "Yes" : "No"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          scan.status === "predicted"
                            ? "bg-emerald-50 text-emerald-700"
                            : scan.status === "failed"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {scan.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
