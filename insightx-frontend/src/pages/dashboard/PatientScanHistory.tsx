import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { type ScanSession, type ScanType } from "../../services/localScanStore";
import { deleteScan, listScans } from "../../services/scanService";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import type { ApiScan } from "../../types/scan";
import { Brain, Heart, Activity, Calendar, Fingerprint } from "lucide-react";

type Tab = "all" | ScanType;

const mapScanToSession = (scan: ApiScan): ScanSession => {
  const modality = String(scan.modality || "").toLowerCase();
  const type: ScanType = modality === "mri" ? "brain" : "heart";

  const aiData = scan.ai_result;
  const tumorType = aiData?.classification?.tumor_type;
  const confidence = aiData?.classification?.confidence;

  const statusRaw = String(scan.status || "").toLowerCase();
  const status =
    statusRaw === "failed"
      ? "failed"
      : statusRaw === "predicted" || statusRaw === "completed"
      ? "done"
      : "processing";

  return {
    id: String(scan.id),
    patientId: String(scan.patient_id ?? ""),
    type,
    createdAt: scan.created_at ?? new Date().toISOString(),
    fileName: scan.original_filename ?? "Clinical Scan Session",
    modality: modality === "mri" ? "MRI" : "Xray",
    riskLevel: tumorType ? `${tumorType.toUpperCase()} (${(confidence * 100).toFixed(1)}%)` : scan.risk_level ?? undefined,
    status,
    progress: status === "done" ? 100 : 45,
    reviewStatus: scan.review_status ?? undefined,
    clinicianNote: scan.clinician_note ?? undefined,
    notes: scan.clinician_note ?? undefined,
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
      setLoading(false);
      return;
    }

    setLoading(true);
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
    if (!window.confirm("Permanently delete this scan from your records?")) return;
    setDeletingId(scanId);
    try {
      await deleteScan(scanId);
      setSessions((prev) => prev.filter((s) => s.id !== scanId));
    } catch (err: any) {
      setError("Unable to delete scan.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Activity className="w-4 h-4 text-sky-600" />
               <p className="text-[10px] font-bold text-sky-800 uppercase tracking-widest">Medical Records</p>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Scan History</h1>
            <p className="text-sm text-slate-500">Access and manage your previous diagnostic sessions.</p>
          </div>
          <Link to="/dashboard/patient/brain">
            <Button className="bg-sky-600 hover:bg-sky-700 text-xs rounded-full px-6">New Analysis</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {(["all", "brain", "heart"] as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                tab === key 
                  ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>

        {/* List Section */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mb-4" />
               <p className="text-xs font-medium uppercase tracking-widest">Retrieving Records...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 italic text-sm">
              No medical scans found in this category.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((session) => (
                <li key={session.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    {/* Left: Info */}
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-2xl shrink-0 ${session.type === 'brain' ? 'bg-purple-50 text-purple-600' : 'bg-rose-50 text-rose-600'}`}>
                        {session.type === 'brain' ? <Brain className="w-6 h-6" /> : <Heart className="w-6 h-6" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900">{session.fileName}</h3>
                          {session.riskLevel && (
                            <span className="text-[9px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                              AI Result: {session.riskLevel}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(session.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Fingerprint className="w-3 h-3" /> ID: {session.id}</span>
                          <span className="uppercase font-semibold text-slate-400">{session.modality}</span>
                        </div>
                        {session.clinicianNote && (
                          <p className="text-xs text-slate-600 bg-white border border-slate-100 p-2 rounded-xl mt-2 line-clamp-1">
                             <span className="font-bold text-slate-400 text-[10px] uppercase mr-2">Note:</span>
                             {session.clinicianNote}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions/Status */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-4 lg:pt-0">
                      <div className="text-right">
                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                          session.status === "done" ? "bg-emerald-100 text-emerald-700" : 
                          session.status === "failed" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"
                        }`}>
                          {session.status}
                        </span>
                      </div>

                      {session.status === "done" ? (
                        <div className="flex items-center gap-2">
                          <Link to={`/dashboard/scans/${session.id}`}>
                            <Button variant="secondary" className="text-xs h-8 px-4 border-slate-200">View Details</Button>
                          </Link>
                          <Button 
                            onClick={() => handleDeleteScan(session.id)}
                            variant="ghost" 
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 px-3 text-xs"
                            disabled={deletingId === session.id}
                          >
                            {deletingId === session.id ? "..." : "Delete"}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-sky-500 animate-pulse" style={{ width: `${session.progress}%` }} />
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Processing {session.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
             End of Diagnostic History - InsightX Medical Records 2026
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}