import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { type ScanSession, type ScanType } from "../../services/localScanStore";
import { deleteScan, listScans } from "../../services/scanService";
import { USE_MOCK, apiClient } from "../../services/api";
import {
  claimPatient,
  fetchPatientRecord,
  unassignPatient,
} from "../../services/doctorService";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import type { ApiScan } from "../../types/scan";

type Tab = "all" | ScanType;

type PatientForm = {
  full_name: string;
  age: string;
  gender: string;
  contact_number: string;
  address: string;
  medical_history: string;
  doctor_id?: number | null;
};

const emptyPatientForm: PatientForm = {
  full_name: "",
  age: "",
  gender: "",
  contact_number: "",
  address: "",
  medical_history: "",
  doctor_id: null,
};

const mapScanToSession = (scan: ApiScan): ScanSession => {
  const rawModality = String(scan.modality || "").toLowerCase();
  
  const modalityMap: Record<string, "MRI" | "Xray" | "Other"> = {
    mri: "MRI",
    xray: "Xray",
    ct: "Other", 
  };

  const modalityLabel = modalityMap[rawModality] || "Other";

  // 1. Extract Real AI Data
  const aiData = scan.ai_result;
  const tumorType = aiData?.classification?.tumor_type;
  const confidence = aiData?.classification?.confidence;

  const statusRaw = String(scan.status || "").toLowerCase();
  const status =
    statusRaw === "failed"
      ? "failed"
      : statusRaw === "completed" || statusRaw === "predicted"
      ? "done"
      : "processing";

  return {
    id: String(scan.id),
    patientId: String(scan.patient_id ?? ""),
    type: rawModality === "mri" ? "brain" : "heart", 
    createdAt: scan.created_at ?? new Date().toISOString(),
    fileName: scan.original_filename ?? "MRI Scan Session",
    modality: modalityLabel,
    riskLevel: (tumorType ? `${tumorType.toUpperCase()} (${(confidence * 100).toFixed(1)}%)` : scan.risk_level) ?? undefined,
    status: status as any, // Cast status to match expected literal types
    progress: status === "done" ? 100 : 50,
    reviewStatus: scan.review_status ?? "Draft",
    clinicianNote: scan.clinician_note ?? undefined,
    notes: scan.clinician_note ?? undefined,
  };
};

export default function DoctorPatientScanHistory() {
  const { patientId = "" } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const doctorId = user?.doctorId ? String(user.doctorId) : null;

  const [tab, setTab] = useState<Tab>("all");
  const [patientName, setPatientName] = useState<string | null>(null);
  const [patientForm, setPatientForm] = useState<PatientForm>(emptyPatientForm);
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [patientMessage, setPatientMessage] = useState<string | null>(null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(
    null
  );
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [savingPatient, setSavingPatient] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setError("Patient not found.");
      setLoading(false);
      return;
    }

    const loadPatient = async () => {
      try {
        if (USE_MOCK) {
          const record = await fetchPatientRecord(patientId);
          if (!record) {
            setError("Patient not found.");
            return;
          }
          setPatientName(record.name ?? null);
          setPatientForm({
            full_name: record.name ?? "",
            age: record.age ? String(record.age) : "",
            gender: "",
            contact_number: "",
            address: "",
            medical_history: "",
            doctor_id: record.doctorId ? Number(record.doctorId) : null,
          });
          return;
        }

        const res = await apiClient.get<any>(`/api/patients/${patientId}`);
        const p = res.data;
        if (!p) {
          setError("Patient not found.");
          return;
        }
        const name =
          p.full_name ||
          p.fullName ||
          [p.first_name, p.last_name].filter(Boolean).join(" ") ||
          "Unknown";
        setPatientName(name);
        setPatientForm({
          full_name: p.full_name ?? name,
          age: p.age ? String(p.age) : "",
          gender: p.gender ?? "",
          contact_number: p.contact_number ?? "",
          address: p.address ?? "",
          medical_history: p.medical_history ?? "",
          doctor_id: p.doctor_id ?? null,
        });
      } catch (err: any) {
        setError(err?.message ?? "Unable to load patient.");
      }
    };

    const loadScans = async () => {
      setScanLoading(true);
      setScanError(null);
      try {
        const scans = await listScans({ patient_id: patientId });
        setSessions(scans.map(mapScanToSession));
      } catch (err: any) {
        setScanError(err?.message ?? "Unable to load scans.");
      } finally {
        setScanLoading(false);
      }
    };

    setLoading(true);
    setError(null);
    Promise.all([loadPatient(), loadScans()]).finally(() => setLoading(false));
  }, [patientId]);

  const filtered = useMemo(
    () => sessions.filter((s) => (tab === "all" ? true : s.type === tab)),
    [sessions, tab]
  );

  const assignedDoctorId =
    patientForm.doctor_id !== null && patientForm.doctor_id !== undefined
      ? String(patientForm.doctor_id)
      : null;
  const isAssignedToMe =
    assignedDoctorId && doctorId && assignedDoctorId === doctorId;
  const isUnassigned = assignedDoctorId === null;
  const assignedElsewhere =
    assignedDoctorId && doctorId && assignedDoctorId !== doctorId;

  const handlePatientChange =
    (field: keyof PatientForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setPatientForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSavePatient = async () => {
    if (!patientId) return;
    setPatientMessage(null);
    setPatientError(null);

    if (USE_MOCK) {
      setPatientMessage("Mock mode: changes are not saved.");
      return;
    }

    setSavingPatient(true);
    try {
      const payload: any = {
        full_name: patientForm.full_name || undefined,
        gender: patientForm.gender || undefined,
        contact_number: patientForm.contact_number || undefined,
        address: patientForm.address || undefined,
        medical_history: patientForm.medical_history || undefined,
      };
      if (patientForm.age.trim()) {
        const parsedAge = Number(patientForm.age);
        if (!Number.isNaN(parsedAge)) {
          payload.age = parsedAge;
        }
      }

      const res = await apiClient.put<any>(
        `/api/patients/${patientId}`,
        payload
      );
      const p = res.data ?? {};
      const name =
        p.full_name ||
        p.fullName ||
        [p.first_name, p.last_name].filter(Boolean).join(" ") ||
        patientForm.full_name ||
        "Unknown";
      setPatientName(name);
      setPatientForm({
        full_name: p.full_name ?? name,
        age: p.age ? String(p.age) : "",
        gender: p.gender ?? "",
        contact_number: p.contact_number ?? "",
        address: p.address ?? "",
        medical_history: p.medical_history ?? "",
        doctor_id: p.doctor_id ?? null,
      });
      setPatientMessage("Patient updated.");
    } catch (err: any) {
      setPatientError(err?.message ?? "Unable to update patient.");
    } finally {
      setSavingPatient(false);
    }
  };

  const handleClaim = async () => {
    if (!patientId) return;
    setAssignmentMessage(null);
    setAssignmentError(null);
    if (!doctorId) {
      setAssignmentError("Doctor ID missing.");
      return;
    }
    try {
      await claimPatient(patientId);
      setPatientForm((prev) => ({
        ...prev,
        doctor_id: Number(doctorId),
      }));
      setAssignmentMessage("Patient assigned to you.");
    } catch (err: any) {
      setAssignmentError(err?.message ?? "Unable to claim patient.");
    }
  };

  const handleUnassign = async () => {
    if (!patientId) return;
    setAssignmentMessage(null);
    setAssignmentError(null);
    try {
      await unassignPatient(patientId);
      setPatientForm((prev) => ({
        ...prev,
        doctor_id: null,
      }));
      setAssignmentMessage("Patient unassigned.");
    } catch (err: any) {
      setAssignmentError(err?.message ?? "Unable to unassign patient.");
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!window.confirm("Delete this scan? This cannot be undone.")) return;
    setDeletingId(scanId);
    setScanError(null);
    try {
      await deleteScan(scanId);
      setSessions((prev) => prev.filter((s) => s.id !== scanId));
    } catch (err: any) {
      setScanError(err?.message ?? "Unable to delete scan.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-sm text-slate-600">Loading patient...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 text-sm text-rose-600">{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">History</p>
            <h1 className="text-lg font-semibold">
              Scan History - {patientName ?? patientId}
            </h1>
          </div>
          <Link
            to={`/dashboard/doctor/patients`}
            className="text-xs text-sky-600 hover:underline"
          >
            Back to Patients
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border rounded-2xl shadow-sm p-4 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Patient Information</h2>
              {USE_MOCK && (
                <span className="text-[11px] text-slate-400">
                  Mock mode: edits are not saved.
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-semibold">Full name</span>
                <input
                  value={patientForm.full_name}
                  onChange={handlePatientChange("full_name")}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold">Age</span>
                <input
                  value={patientForm.age}
                  onChange={handlePatientChange("age")}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold">Gender</span>
                <input
                  value={patientForm.gender}
                  onChange={handlePatientChange("gender")}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold">Contact number</span>
                <input
                  value={patientForm.contact_number}
                  onChange={handlePatientChange("contact_number")}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="font-semibold">Address</span>
                <input
                  value={patientForm.address}
                  onChange={handlePatientChange("address")}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="font-semibold">Medical history</span>
                <textarea
                  value={patientForm.medical_history}
                  onChange={handlePatientChange("medical_history")}
                  rows={3}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                />
              </label>
            </div>
            {patientMessage && (
              <p className="text-xs text-emerald-600">{patientMessage}</p>
            )}
            {patientError && (
              <p className="text-xs text-rose-600">{patientError}</p>
            )}
            <div>
              <Button
                className="bg-sky-600 hover:bg-sky-700 text-xs"
                onClick={handleSavePatient}
                disabled={savingPatient || USE_MOCK}
              >
                {savingPatient ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-4 space-y-3 text-xs">
            <h2 className="text-sm font-semibold">Assignment</h2>
            <p>
              Assigned doctor ID:{" "}
              <span className="font-semibold">
                {assignedDoctorId ?? "Unassigned"}
              </span>
            </p>
            {assignmentMessage && (
              <p className="text-emerald-600">{assignmentMessage}</p>
            )}
            {assignmentError && (
              <p className="text-rose-600">{assignmentError}</p>
            )}
            {USE_MOCK ? (
              <p className="text-slate-400">Mock mode: assignment disabled.</p>
            ) : isAssignedToMe ? (
              <Button
                variant="secondary"
                className="border border-slate-200 text-xs"
                onClick={handleUnassign}
              >
                Unassign Patient
              </Button>
            ) : isUnassigned ? (
              <Button
                className="bg-sky-600 hover:bg-sky-700 text-xs"
                onClick={handleClaim}
              >
                Claim Patient
              </Button>
            ) : assignedElsewhere ? (
              <p className="text-slate-500">Assigned to another doctor.</p>
            ) : (
              <p className="text-slate-500">Assignment unavailable.</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "brain", "heart"] as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1 rounded-full border text-xs ${
                tab === key
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700"
              }`}
            >
              {key === "all" ? "All" : key === "brain" ? "Brain" : "Heart"}
            </button>
          ))}
        </div>

        <div className="bg-white border rounded-2xl shadow-sm">
          {scanLoading ? (
            <div className="p-6 text-sm text-slate-600">Loading scans...</div>
          ) : scanError ? (
            <div className="p-6 text-sm text-rose-600">{scanError}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">
              No scan sessions yet.
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((session) => (
                <li key={session.id} className="p-4 flex flex-col gap-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {session.type.toUpperCase()} - {session.fileName}
                        </span>
                        {/* Display real AI result badge */}
                        {session.riskLevel && (
                          <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                            AI: {session.riskLevel}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ID: {session.id} |{" "}
                        {new Date(session.createdAt).toLocaleString()}
                      </span>
                      {session.clinicianNote && (
                        <span className="text-xs text-slate-600 italic mt-1 bg-slate-50 p-1 rounded border-l-2 border-slate-300">
                          " {session.clinicianNote} "
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
                      {session.status === "processing" ||
                      session.status === "queued" ? (
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
