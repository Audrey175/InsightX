import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Layouts & Components
import DashboardLayout from "../../layouts/DashboardLayout";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/button";

// Services & Icons
import { fetchPatientHeartScan } from "../../services/patientService";
import type { PatientHeartRecord } from "../../data/patientHeartData";
import { useAuth } from "../../context/AuthContext";
import { uploadScan, updateScan, deleteScan } from "../../services/scanService";
import { Heart, Activity, Clipboard, Trash2, Save, FileText, Calendar, Fingerprint } from "lucide-react";
import type { ApiScan } from "../../types/scan";

const PatientHeartDashboard: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.patientId;
  const reportRef = useRef<HTMLDivElement>(null);

  const [scan, setScan] = useState<PatientHeartRecord | null>(null);
  const [activeScan, setActiveScan] = useState<ApiScan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [clinicianNote, setClinicianNote] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const NO_SPLIT_CLASS = "break-inside-avoid page-break-inside-avoid block";

  useEffect(() => {
    if (!patientId) return;
    const load = async () => {
      setLoading(true);
      try {
        const record = await fetchPatientHeartScan(String(patientId));
        if (record) {
          setScan(record);
        } else {
          setScan({
            patientId: String(patientId),
            name: user?.fullName ?? "Patient",
            avatar: "NA",
            scanId: "N/A",
            bpm: 72,
            oxygen: 98,
            stress: "Normal",
            pressure: "120/80",
            condition: "Stable",
            doctorNotes: [],
          });
        }
      } catch (err: any) {
        setError(err?.message ?? "Unable to load heart data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId, user?.fullName]);

  const handleXrayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientId) return;

    setSelectedImage(URL.createObjectURL(file));
    setUploading(true);
    setUploadError(null);

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
      setActionMessage("X-RAY ANALYSIS COMPLETE");
    } catch (err: any) {
      setUploadError("Analysis engine currently busy. Record created.");
    } finally {
      setUploading(false);
    }
  };

  const exportPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    setTimeout(async () => {
      try {
        const element = reportRef.current!;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#f8fafc" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        pdf.addImage(imgData, "PNG", 0, 0, 210, (canvas.height * 210) / canvas.width);
        pdf.save(`Heart_Report_${patientId}.pdf`);
      } catch (err) {
        console.error(err);
      } finally {
        setIsExporting(false);
      }
    }, 400);
  };

  if (loading) return <DashboardLayout><LoadingState message="Syncing cardiac metrics..." /></DashboardLayout>;
  if (error || !scan) return <DashboardLayout><ErrorState message={error ?? "No data found."} /></DashboardLayout>;

  const aiResult = activeScan?.ai_result ?? null;
  const prediction = (aiResult as any)?.prediction ?? null;

  return (
    <DashboardLayout>
      <div className="w-full flex justify-center bg-slate-200 py-8 px-4 md:px-8">
        <div
          ref={reportRef}
          className="bg-slate-50 shadow-2xl transition-all duration-300"
          style={{ width: "100%", maxWidth: "1100px", minHeight: "1123px", padding: isExporting ? "32px" : "48px" }}
        >
          {/* Header Section */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-4 border-slate-200 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                <p className="text-[10px] font-bold text-rose-800 uppercase tracking-widest">InsightX Cardiac Record</p>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{scan.name}</h1>
              <p className="text-[11px] text-slate-500 font-mono uppercase">Patient ID: {patientId} | Ref: {scan.scanId}</p>
            </div>
            {!isExporting && (
              <div className="flex items-center gap-2 no-print">
                <Button onClick={exportPdf} className="bg-slate-900 hover:bg-black text-white rounded-full px-4 text-xs h-9">
                  Export PDF
                </Button>
                <Link to="/dashboard/patient/history">
                  <Button variant="secondary" className="border border-slate-200 text-xs rounded-full">History</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1.4fr] gap-6">
            <div className="space-y-6">
              {/* Upload & Analysis Box */}
              <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Chest X-Ray Analysis</h2>
                  {!isExporting && (
                    <input type="file" accept="image/*" onChange={handleXrayUpload} className="text-[10px] file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-rose-50 file:text-rose-700 cursor-pointer" />
                  )}
                </div>

                {uploading && <p className="text-rose-600 text-xs animate-pulse font-bold mb-4 uppercase tracking-tighter">AI Scanning Pathology...</p>}

                {activeScan ? (
                  <div className="space-y-4 text-xs border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 text-[9px] uppercase font-bold block mb-1">AI Classification</span>
                        <span className={`font-bold uppercase ${prediction?.label === 'PNEUMONIA' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {prediction?.label ?? "Analyzing..."}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 text-[9px] uppercase font-bold block mb-1">Confidence</span>
                        <span className="font-bold">{prediction?.confidence ? `${(prediction.confidence * 100).toFixed(1)}%` : "N/A"}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase text-slate-400 font-bold">Your Notes</label>
                      <textarea
                        value={clinicianNote}
                        onChange={(e) => setClinicianNote(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                        placeholder="Add personal notes about this scan..."
                      />
                      {actionMessage && <p className="text-[10px] text-emerald-600 font-bold uppercase">{actionMessage}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs italic">
                    Upload your chest X-ray to start automated diagnostic analysis
                  </div>
                )}
              </div>

              {/* Imaging Container */}
              <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Diagnostic Imaging Output</h3>
                <div className="min-h-[350px] flex items-center justify-center bg-slate-900 rounded-2xl overflow-hidden relative shadow-2xl border-4 border-slate-800">
                   {selectedImage ? (
                     <img src={selectedImage} alt="Xray" className="max-h-[500px] w-full object-contain" />
                   ) : (
                     <div className="flex flex-col items-center gap-4">
                        <Activity className="w-10 h-10 text-slate-700 animate-pulse" />
                        <span className="text-slate-600 text-[10px] uppercase tracking-widest font-bold">No imaging data stream</span>
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* Side Metrics Panel */}
            <div className="space-y-6">
              <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                <h2 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">Health Vitals</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                    <p className="text-[10px] text-rose-600 font-bold uppercase mb-1">Heart Rate</p>
                    <p className="text-2xl font-black text-rose-900">{scan.bpm} <span className="text-xs font-normal">BPM</span></p>
                  </div>
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                    <p className="text-[10px] text-sky-600 font-bold uppercase mb-1">SpO2</p>
                    <p className="text-2xl font-black text-sky-900">{scan.oxygen}%</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 col-span-2">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Blood Pressure</p>
                    <p className="text-2xl font-black text-emerald-900">{scan.pressure}</p>
                  </div>
                </div>
              </div>

              <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                <h2 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">Observations</h2>
                <div className="space-y-4">
                   <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-xs text-slate-500">Condition Status</span>
                      <span className="text-xs font-bold text-slate-800 uppercase">{scan.condition}</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-xs text-slate-500">Stress Factor</span>
                      <span className="text-xs font-bold text-slate-800 uppercase">{scan.stress}</span>
                   </div>
                   <div className="pt-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Patient Bio-Reference</p>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-200 flex items-center justify-center text-xs font-black">
                          {scan.avatar}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">Identity verified via biometric gateway.</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 text-white text-center shadow-lg">
                 <FileText className="w-8 h-8 text-sky-400 mx-auto mb-3" />
                 <h4 className="text-sm font-bold uppercase tracking-tight">Full Health Record</h4>
                 <p className="text-[10px] text-slate-400 mb-4 uppercase">Sync with medical history</p>
                 <Link to="/dashboard/patient/history" className="block w-full bg-sky-500 hover:bg-sky-600 py-3 rounded-full text-[10px] font-bold transition-colors">
                    ACCESS PORTAL
                 </Link>
              </div>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="mt-12 pt-8 border-t border-slate-100 text-[9px] text-slate-400 text-center uppercase tracking-widest leading-relaxed">
            Personal Diagnostic Dashboard - InsightX Medical Systems - 2026<br />
            SECURE ENCRYPTED ACCESS - FOR PERSONAL REVIEW ONLY
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientHeartDashboard;