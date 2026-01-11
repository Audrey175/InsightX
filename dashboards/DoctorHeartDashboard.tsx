import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Layouts & Components
import DashboardLayout from "../../layouts/DashboardLayout";
import PatientSelector from "../../components/PatientSelector";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/button";

// Services & Icons
import { fetchDoctorHeartScan, fetchPatientRecord } from "../../services/doctorService";
import type { DoctorHeartScanRecord } from "../../data/doctorHeartData";
import { useAuth } from "../../context/AuthContext";
import { uploadScan, updateScan, deleteScan } from "../../services/scanService";
import type { ApiScan } from "../../types/scan";
import { Heart, Activity, Clipboard, Trash2, Save, FileText } from "lucide-react";

// Assets
import HeartHero from "../../assets/brainhome.png"; // Replace with heart icon if available

const DoctorHeartDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const [scan, setScan] = useState<DoctorHeartScanRecord | null>(null);
  const [activeScan, setActiveScan] = useState<ApiScan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [clinicianNote, setClinicianNote] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const { patientId: pathId } = useParams<{ patientId: string }>();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("patientId");
  const patientId = pathId || queryId || "";

  const NO_SPLIT_CLASS = "break-inside-avoid page-break-inside-avoid block";

  useEffect(() => {
    if (!patientId) return;
    const load = async () => {
      setLoading(true);
      try {
        const record = await fetchDoctorHeartScan(patientId);
        if (record) {
          setScan(record);
        } else {
          const patient = await fetchPatientRecord(patientId);
          setScan({
            patientId,
            patientName: patient?.name ?? "Unknown patient",
            avatar: patient?.avatar ?? "NA",
            scanId: "NEW-PENDING",
            heartRate: 72,
            oxygen: 98,
            pressure: "120/80",
            condition: "Stable",
            injury: { region: "Thoracic", type: "N/A", severity: "Low", size: "N/A", imaging: [] },
            risks: [],
            relatedCases: [],
          });
        }
      } catch (err: any) {
        setError("Unable to load heart diagnostic data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  const handleXrayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientId) return;

    setSelectedImage(URL.createObjectURL(file));
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patient_id", patientId);
      formData.append("modality", "xray");

      const created = await uploadScan(formData, { patientId, modality: "xray" });
      setActiveScan(created);
      setClinicianNote(created.clinician_note ?? "");
      setActionMessage("X-RAY ANALYSIS COMPLETE");
    } catch (err: any) {
      setUploadError("Analysis engine offline. Uploaded to database only.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!activeScan?.id) return;
    try {
      await updateScan(activeScan.id, { review_status: "saved", clinician_note: clinicianNote });
      setActionMessage("Clinical findings saved.");
    } catch (err) {
      setActionMessage("Save failed.");
    }
  };

  if (loading) return <DashboardLayout><LoadingState message="Syncing cardiac data..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="w-full flex justify-center bg-slate-200 py-8 px-4 md:px-8">
        <div
          ref={reportRef}
          className="bg-slate-50 shadow-2xl transition-all duration-300"
          style={{ width: "100%", maxWidth: "1100px", minHeight: "1123px", padding: "48px" }}
        >
          {/* HEADER SECTION */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-4 border-slate-200 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                <p className="text-[10px] font-bold text-rose-800 uppercase tracking-widest">InsightX Cardiac Diagnostic</p>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{scan?.patientName}</h1>
              <p className="text-[11px] text-slate-500 font-mono uppercase">ID: {patientId} | Scan Ref: {scan?.scanId}</p>
            </div>
            <div className="flex items-center gap-2 no-print">
              <PatientSelector currentId={patientId} organ="heart" />
              <Button onClick={() => navigate(`/dashboard/doctor/brain?patientId=${patientId}`)} variant="secondary" className="text-xs h-9">Switch to Brain</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1.4fr] gap-6">
            <div className="space-y-6">
              {/* ANALYSIS BOX */}
              <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">X-Ray Analysis Summary</h2>
                  <input type="file" accept="image/*" onChange={handleXrayUpload} className="text-[10px] file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-rose-50 file:text-rose-700 cursor-pointer" />
                </div>

                {uploading && <p className="text-rose-600 text-xs animate-pulse font-bold mb-4 uppercase">AI Processing Cardiac Image...</p>}

                {activeScan ? (
                  <div className="space-y-4 text-xs border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-slate-400 text-[9px] uppercase font-bold">Modality</p>
                        <p className="font-bold uppercase">{activeScan.modality}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-slate-400 text-[9px] uppercase font-bold">Risk Factor</p>
                        <p className={`font-bold uppercase ${activeScan.risk_level === 'High' ? 'text-rose-600' : 'text-emerald-600'}`}>{activeScan.risk_level ?? "Normal"}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Clinician Observations</label>
                      <textarea
                        value={clinicianNote}
                        onChange={(e) => setClinicianNote(e.target.value)}
                        rows={4}
                        className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs bg-slate-50/50"
                        placeholder="Enter cardiac findings..."
                      />
                      {actionMessage && <p className="text-[10px] text-emerald-600 font-bold uppercase">{actionMessage}</p>}
                      <div className="flex gap-2">
                        <Button onClick={handleSave} className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-6 rounded-full"><Save className="w-3 h-3 mr-2" /> Save Results</Button>
                        <Button onClick={() => setActiveScan(null)} variant="secondary" className="text-xs rounded-full"><Trash2 className="w-3 h-3 mr-2" /> Discard</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs italic">
                    Upload Chest X-Ray (PNG/JPG) to initiate AI pathology detection
                  </div>
                )}
              </div>

              {/* IMAGING VIEW */}
              <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Diagnostic Imaging</h3>
                <div className="min-h-[400px] flex items-center justify-center bg-slate-900 rounded-2xl overflow-hidden relative border-4 border-slate-800 shadow-2xl">
                   {selectedImage ? (
                     <img src={selectedImage} alt="Xray" className="max-h-[500px] w-full object-contain" />
                   ) : (
                     <div className="flex flex-col items-center gap-4">
                        <Activity className="w-12 h-12 text-slate-700 animate-pulse" />
                        <span className="text-slate-600 text-[10px] uppercase tracking-widest">No active image stream</span>
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* SIDEBAR PANEL */}
            <div className="space-y-6">
              <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                <h2 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">Vitals Monitor</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                    <p className="text-[10px] text-rose-600 font-bold uppercase mb-1">Heart Rate</p>
                    <p className="text-2xl font-black text-rose-900">{scan?.heartRate} <span className="text-xs font-normal">BPM</span></p>
                  </div>
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                    <p className="text-[10px] text-sky-600 font-bold uppercase mb-1">Blood Pressure</p>
                    <p className="text-2xl font-black text-sky-900">{scan?.pressure}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 col-span-2">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Oxygen Saturation (SpO2)</p>
                    <p className="text-2xl font-black text-emerald-900">{scan?.oxygen}%</p>
                  </div>
                </div>
              </div>

              <div className={`${NO_SPLIT_CLASS} bg-white rounded-2xl p-6 shadow-sm border border-slate-200`}>
                <h2 className="text-xs font-bold text-slate-800 uppercase mb-4 tracking-wider">Clinical Observations</h2>
                <div className="space-y-4">
                   <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-xs text-slate-500 font-medium">Primary Condition</span>
                      <span className="text-xs font-bold text-slate-800 uppercase">{scan?.condition}</span>
                   </div>
                   <div className="pt-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cardiac Risk Assessment</p>
                      <ul className="space-y-2">
                        {scan?.risks.length ? scan.risks.map((r, i) => (
                           <li key={i} className="text-xs text-slate-700 flex gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                              {r}
                           </li>
                        )) : <li className="text-xs text-slate-400 italic">No historical risks recorded.</li>}
                      </ul>
                   </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-white text-center">
                 <FileText className="w-8 h-8 text-sky-400 mx-auto mb-3" />
                 <h4 className="text-sm font-bold mb-1 uppercase tracking-tight">Generate Report</h4>
                 <p className="text-[10px] text-slate-400 mb-4 uppercase">Official Clinical Documentation</p>
                 <Button className="w-full bg-sky-500 hover:bg-sky-600 rounded-full text-[10px] font-bold py-2">EXPORT PDF RECORD</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorHeartDashboard;