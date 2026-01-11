import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { deleteScan, getScan, updateScan } from "../../services/scanService";
import type { ApiScan } from "../../types/scan";
import { 
  FileText, 
  User, 
  Activity, 
  Calendar, 
  Database, 
  ChevronDown,
  Trash2,
  Save
} from "lucide-react";

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
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
  const [success, setSuccess] = useState<string | null>(null);

  const isDoctor = user?.role === "doctor";

  useEffect(() => {
    if (!scanId) return;
    const load = async () => {
      setLoading(true);
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

  // Extract Real AI Data from the nested object
  const aiResult = scan?.ai_result;
  const classification = aiResult?.classification;
  const segmentation = aiResult?.segmentation;
  const riskAnalysis = aiResult?.risk_analysis;

  const handleSave = async () => {
    if (!scanId || !isDoctor) return;
    setSaving(true);
    setSuccess(null);
    try {
      const response = await updateScan(scanId, {
        clinician_note: note,
        review_status: reviewStatus || "reviewed",
      });
      setScan(response);
      setSuccess("Report updated successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setLoadError("Failed to update clinician notes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!scanId || !window.confirm("Permanently delete this medical record?")) return;
    setDeleting(true);
    try {
      await deleteScan(scanId);
      navigate(isDoctor ? `/dashboard/doctor/history/${scan?.patient_id}` : "/dashboard/patient/history");
    } catch (err: any) {
      setLoadError("Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingState message="Fetching record..." /></DashboardLayout>;
  if (loadError || !scan) return <DashboardLayout><ErrorState message={loadError ?? "Scan not found."} /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sky-600 font-bold text-[10px] uppercase tracking-widest">
              <FileText className="w-3 h-3" />
              Clinical Diagnostic Report
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Scan #{scan.id}</h1>
            <p className="text-xs text-slate-500 font-mono">UID: {aiResult?.series_uid ?? "N/A"}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDelete} disabled={deleting} variant="secondary" className="text-rose-600 border-rose-100 hover:bg-rose-50 px-4 h-9 text-xs">
              <Trash2 className="w-3 h-3 mr-2" /> {deleting ? "Deleting..." : "Delete Record"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata Column */}
          <div className="space-y-6">
            <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-3 h-3" /> Metadata
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Patient ID</span>
                  <span className="font-bold text-slate-900">{scan.patient_id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Modality</span>
                  <span className="font-bold uppercase text-slate-900">{scan.modality}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Risk Level</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full ${scan.risk_level?.toLowerCase().includes('high') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {scan.risk_level ?? "Low"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Analysis Date</span>
                  <span className="font-medium text-slate-700">{formatDate(scan.created_at)}</span>
                </div>
              </div>
            </div>

            {/* AI Summary Box */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-4">
               <h2 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">AI Intelligence Summary</h2>
               {classification ? (
                 <div className="space-y-4">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase mb-1">Detected Pathology</p>
                      <p className="text-xl font-black uppercase text-white">{classification.tumor_type}</p>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full" style={{ width: `${(classification.confidence * 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                       <span className="text-slate-400">CONFIDENCE</span>
                       <span className="text-sky-400">{(classification.confidence * 100).toFixed(1)}%</span>
                    </div>
                 </div>
               ) : (
                 <p className="text-xs text-slate-500 italic">No AI classification data available.</p>
               )}
            </div>
          </div>

          {/* Analysis & Notes Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">Clinical Observations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Segmentation Details</p>
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tumor Detected</span>
                        <span className="font-bold">{segmentation?.tumor_detected ? "YES" : "NO"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Voxel Volume</span>
                        <span className="font-bold">{segmentation?.tumor_size_pixels?.toLocaleString()} px³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Center Coordinate</span>
                        <span className="font-mono text-sky-600 font-bold">
                          {segmentation?.tumor_location ? `X:${segmentation.tumor_location.x.toFixed(1)} Y:${segmentation.tumor_location.y.toFixed(1)}` : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Automated Risk Flags</p>
                  <ul className="space-y-2">
                    {riskAnalysis?.risks.map((risk: string, i: number) => (
                      <li key={i} className="flex gap-3 text-xs text-slate-700 bg-rose-50/50 p-2 rounded-lg border border-rose-100/50">
                        <Activity className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                        {risk}
                      </li>
                    )) || <li className="text-xs text-slate-400 italic">No significant risks flagged.</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* Review Section */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Clinician Review</h2>
                {isDoctor && (
                   <select 
                    value={reviewStatus} 
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="text-[10px] font-bold uppercase bg-slate-100 border-none rounded-full px-4 py-1.5 focus:ring-0"
                  >
                    <option value="draft">Draft</option>
                    <option value="saved">Saved</option>
                    <option value="reviewed">Finalized</option>
                  </select>
                )}
              </div>
              
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!isDoctor}
                rows={4}
                className="w-full rounded-2xl border-slate-200 text-sm focus:ring-sky-500 focus:border-sky-500 p-4 bg-slate-50/50 placeholder:italic"
                placeholder={isDoctor ? "Enter professional findings and patient advice..." : "No notes from the clinician yet."}
              />

              {isDoctor && (
                <div className="flex items-center justify-between pt-2">
                   {success && <p className="text-xs text-emerald-600 font-bold">{success}</p>}
                   <Button onClick={handleSave} disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-xs ml-auto rounded-xl px-8 shadow-lg shadow-sky-100">
                    <Save className="w-3 h-3 mr-2" /> {saving ? "Saving..." : "Update Report"}
                  </Button>
                </div>
              )}
            </div>

            {/* Raw Data Toggle */}
            <div className="bg-slate-50 rounded-2xl p-4">
               <details className="group">
                  <summary className="text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer flex items-center gap-2">
                    <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                    Advanced Diagnostic JSON
                  </summary>
                  <pre className="mt-4 text-[10px] text-slate-500 bg-white p-4 rounded-xl border overflow-x-auto font-mono leading-relaxed">
                    {JSON.stringify(scan.ai_result, null, 2)}
                  </pre>
               </details>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}