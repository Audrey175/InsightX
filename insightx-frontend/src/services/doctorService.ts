import type { InjurySeverity, PatientRecord, StressLevel } from "../data/fakeDatabase";
import type { DoctorBrainScanRecord } from "../data/doctorBrainData";
import type { DoctorHeartScanRecord } from "../data/doctorHeartData";
import { getLatestDoneSession } from "./localScanStore";
import { USE_MOCK, simulateRequest, apiClient } from "./api";
import type { AuthResponse } from "../types/auth";
import type { ApiScan } from "../types/scan";

export type DoctorPatientListItem = {
  id: string;
  name: string;
  avatar: string;
  age?: number;
  brainStress?: StressLevel;
  brainScanId?: string;
  heartSeverity?: InjurySeverity;
  heartScanId?: string;
  lastBrainScan?: string;
  lastHeartScan?: string;
  hasBrain?: boolean;
  hasHeart?: boolean;
};

const STORAGE_KEY = "insightx_auth";

const loadMockData = async () => {
  const [{ patients, findPatientById }, { doctorBrainScans }, { doctorHeartScans }] =
    await Promise.all([
      import("../data/fakeDatabase"),
      import("../data/doctorBrainData"),
      import("../data/doctorHeartData"),
    ]);
  return { patients, findPatientById, doctorBrainScans, doctorHeartScans };
};

function getDoctorIdFromSession(): string {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error("Not authenticated");

  let parsed: AuthResponse;
  try {
    parsed = JSON.parse(raw) as AuthResponse;
  } catch {
    throw new Error("Invalid session data");
  }

  const doctorId = parsed.user.doctorId;
  if (!doctorId) throw new Error("Doctor account missing doctorId");
  return doctorId;
}

function makeAvatar(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((p) => (p[0] ? p[0].toUpperCase() : ""))
    .join("");
  return initials || "NA";
}

function mapPatientRowBase(p: any): DoctorPatientListItem {
  const name =
    p.full_name ||
    p.fullName ||
    [p.first_name, p.last_name].filter(Boolean).join(" ") ||
    "Unknown";
  return {
    id: String(p.id),
    name,
    avatar: makeAvatar(name),
    age: p.age ?? undefined,
    hasBrain: false,
    hasHeart: false,
  };
}

function pickLatest(scans: ApiScan[]): ApiScan | undefined {
  return scans
    .slice()
    .sort((a, b) =>
      String(b.created_at || "").localeCompare(String(a.created_at || ""))
    )[0];
}

function normalizeRiskToStress(risk?: string | null): StressLevel | undefined {
  if (!risk) return undefined;
  const r = risk.toLowerCase();
  // If your StressLevel union differs, adjust these mappings
  if (r.includes("high")) return "High" as any;
  if (r.includes("medium") || r.includes("moderate")) return "Normal" as any;
  if (r.includes("low")) return "Low" as any;
  return undefined;
}

function normalizeRiskToSeverity(
  risk?: string | null
): InjurySeverity | undefined {
  if (!risk) return undefined;
  const r = risk.toLowerCase();
  if (r.includes("high")) return "High" as any;
  if (r.includes("medium") || r.includes("moderate")) return "Medium" as any;
  if (r.includes("low")) return "Low" as any;
  return undefined;
}

function resolveSeverity(scan?: ApiScan | null): string | undefined {
  return scan?.summary?.severity ?? scan?.risk_level ?? undefined;
}

function metricsFromSeverity(severity?: string) {
  const normalized = (severity || "low").toLowerCase();
  if (normalized.includes("high")) {
    return { oxygenation: 64, focus: "Fluctuating", score: 60 };
  }
  if (normalized.includes("moderate") || normalized.includes("medium")) {
    return { oxygenation: 74, focus: "Stable", score: 75 };
  }
  return { oxygenation: 86, focus: "Stable", score: 90 };
}

// ---------------------------------------
// Patient record
// ---------------------------------------
export async function fetchPatientRecord(
  patientId: string
): Promise<PatientRecord | null> {
  if (USE_MOCK) {
    const { findPatientById } = await loadMockData();
    return simulateRequest(() => findPatientById(patientId) ?? null);
  }

  const response = await apiClient.get<any>(`/api/patients/${patientId}`);
  const p = response.data;
  if (!p) return null;

  const name =
    p.full_name ||
    p.fullName ||
    [p.first_name, p.last_name].filter(Boolean).join(" ") ||
    "Unknown";

  // Return whatever your UI expects in PatientRecord; keep minimal fields safe.
  return {
    id: String(p.id),
    name,
    avatar: makeAvatar(name),
    age: p.age ?? undefined,
    gender: p.gender ?? undefined,
    medicalHistory: p.medical_history ?? p.medicalHistory ?? undefined,
    address: p.address ?? undefined,
    contact: p.contact_number ?? p.contact ?? undefined,
    lastBrainScan: undefined,
    lastHeartScan: undefined,
    doctor: {},
    patient: {},
  } as PatientRecord;
}

// ---------------------------------------
// Doctor brain scan
// ---------------------------------------
export async function fetchDoctorBrainScan(
  patientId: string
): Promise<DoctorBrainScanRecord | null> {
  if (USE_MOCK) {
    const { findPatientById, doctorBrainScans } = await loadMockData();
    return simulateRequest(() => {
      const patient = findPatientById(patientId);
      const session = getLatestDoneSession(patientId, "brain");
      const sessionDoctor =
        session?.data?.doctor as DoctorBrainScanRecord | undefined;

      if (sessionDoctor) {
        const base = sessionDoctor as Partial<DoctorBrainScanRecord>;
        return {
          ...base,
          patientId,
          patientName: base.patientName ?? patient?.name ?? "Unknown patient",
          avatar: base.avatar ?? patient?.avatar ?? "NA",
          lastScanDate: base.lastScanDate ?? session?.createdAt,
          scanId:
            base.scanId ??
            (session?.id ? `B-SESSION-${session.id}` : "B-SESSION"),
        } as DoctorBrainScanRecord;
      }

      const scan = doctorBrainScans.find((item) => item.patientId === patientId);
      return scan ?? null;
    });
  }

  // ✅ LIVE: latest MRI scan for patient
  const res = await apiClient.get<ApiScan[]>(`/api/scans`, {
    params: { patient_id: patientId, modality: "mri" },
  });

  const latest = pickLatest(res.data ?? []);
  if (!latest) return null;

  const patient = await fetchPatientRecord(patientId);
  const severity = resolveSeverity(latest);
  const metrics = metricsFromSeverity(severity);
  const stress = normalizeRiskToStress(severity) ?? ("Low" as any);
  const keyFindings = latest.summary?.key_findings ?? {};
  const tumorDetected = Boolean((keyFindings as any).tumor_detected);
  const tumorLocation = (keyFindings as any).tumor_location;
  const tumorSize = (keyFindings as any).tumor_size_pixels;
  const risks =
    (latest.ai_result as any)?.risk_analysis?.risks ??
    (latest.summary?.recommendation ? [latest.summary.recommendation] : []);

  return {
    patientId: String(patientId),
    patientName: patient?.name ?? "Unknown patient",
    avatar: patient?.avatar ?? "NA",
    scanId: String(latest.id),
    lastScanDate: latest.created_at ?? undefined,
    oxygenation: metrics.oxygenation,
    stress,
    focus: metrics.focus as any,
    performanceScore: metrics.score,
    injury: {
      location: tumorLocation
        ? `X:${tumorLocation.x?.toFixed?.(1) ?? tumorLocation.x}, Y:${tumorLocation.y?.toFixed?.(1) ?? tumorLocation.y}`
        : "N/A",
      type: tumorDetected ? "Potential lesion detected" : "No lesion detected",
      size: tumorSize ? `${tumorSize} px` : "N/A",
      edema: "N/A",
      imaging: [latest.modality?.toUpperCase?.() ?? "MRI"],
    },
    risks: risks.length ? risks : ["AI review pending."],
    relatedCases: ["Awaiting clinician review."],
  } as DoctorBrainScanRecord;
}

// ---------------------------------------
// Doctor heart scan
// ---------------------------------------
export async function fetchDoctorHeartScan(
  patientId: string
): Promise<DoctorHeartScanRecord | null> {
  if (USE_MOCK) {
    const { findPatientById, doctorHeartScans } = await loadMockData();
    return simulateRequest(() => {
      const patient = findPatientById(patientId);
      const session = getLatestDoneSession(patientId, "heart");
      const sessionDoctor =
        session?.data?.doctor as DoctorHeartScanRecord | undefined;

      if (sessionDoctor) {
        const base = sessionDoctor as Partial<DoctorHeartScanRecord>;
        return {
          ...base,
          patientId,
          patientName: base.patientName ?? patient?.name ?? "Unknown patient",
          avatar: base.avatar ?? patient?.avatar ?? "NA",
          lastScanDate: base.lastScanDate ?? session?.createdAt,
          scanId:
            base.scanId ??
            (session?.id ? `H-SESSION-${session.id}` : "H-SESSION"),
        } as DoctorHeartScanRecord;
      }

      const scan = doctorHeartScans.find((item) => item.patientId === patientId);
      return scan ?? null;
    });
  }

  // ✅ LIVE: latest XRAY scan for patient
  const res = await apiClient.get<ApiScan[]>(`/api/scans`, {
    params: { patient_id: patientId, modality: "xray" },
  });

  const latest = pickLatest(res.data ?? []);
  if (!latest) return null;

  const patient = await fetchPatientRecord(patientId);
  const severity = resolveSeverity(latest);
  const riskSeverity = normalizeRiskToSeverity(severity) ?? ("Low" as any);
  const prediction = (latest.ai_result as any)?.prediction;
  const risks =
    (latest.ai_result as any)?.prediction?.risk_level ??
    latest.summary?.severity ??
    latest.risk_level ??
    "low";

  return {
    patientId: String(patientId),
    patientName: patient?.name ?? "Unknown patient",
    avatar: patient?.avatar ?? "NA",
    scanId: String(latest.id),
    lastScanDate: latest.created_at ?? undefined,
    injury: {
      severity: riskSeverity,
      region: "Chest",
      type: prediction?.label ? `AI: ${prediction.label}` : "Awaiting review",
      size: "N/A",
      imaging: [latest.modality?.toUpperCase?.() ?? "XRAY"],
    },
    heartRate: 80,
    oxygen: 97,
    pressure: "120/80 mmHg",
    condition:
      latest.summary?.recommendation ??
      (prediction?.label ? `AI classification: ${prediction.label}` : "Pending review"),
    risks: [String(risks).toUpperCase()],
    relatedCases: ["Awaiting clinician review."],
  } as DoctorHeartScanRecord;
}

// ---------------------------------------
// Doctor patients list (MAIN)
// ---------------------------------------
export async function fetchDoctorPatients(): Promise<DoctorPatientListItem[]> {
  if (USE_MOCK) {
    const { patients } = await loadMockData();
    return simulateRequest<DoctorPatientListItem[]>(() =>
      patients.map<DoctorPatientListItem>((patient) => {
        const brainSession = getLatestDoneSession(patient.id, "brain");
        const heartSession = getLatestDoneSession(patient.id, "heart");

        const brainScan =
          (brainSession?.data?.doctor as DoctorBrainScanRecord | undefined) ??
          patient.doctor?.brain;
        const heartScan =
          (heartSession?.data?.doctor as DoctorHeartScanRecord | undefined) ??
          patient.doctor?.heart;

        return {
          id: patient.id,
          name: patient.name,
          avatar: patient.avatar,
          age: patient.age,
          brainStress: (brainScan as DoctorBrainScanRecord | undefined)?.stress,
          brainScanId: (brainScan as any)?.scanId,
          heartSeverity: (heartScan as DoctorHeartScanRecord | undefined)?.injury
            ?.severity as InjurySeverity | undefined,
          heartScanId: (heartScan as any)?.scanId,
          lastBrainScan: brainSession?.createdAt ?? patient.lastBrainScan,
          lastHeartScan: heartSession?.createdAt ?? patient.lastHeartScan,
          hasBrain: !!brainScan,
          hasHeart: !!heartScan,
        };
      })
    );
  }

  const doctorId = getDoctorIdFromSession();

  // 1) Get patients assigned to this doctor
  const patientsRes = await apiClient.get<any[]>(
    `/api/doctors/${doctorId}/patients`
  );
  const patientRows = patientsRes.data ?? [];

  // 2) Get scans for this doctor once; then compute per-patient summary
  const scansRes = await apiClient.get<ApiScan[]>(`/api/scans`, {
    params: { doctor_id: doctorId },
  });
  const scans = scansRes.data ?? [];

  const scansByPatient = new Map<string, ApiScan[]>();
  for (const s of scans) {
    const pid = String(s.patient_id);
    const list = scansByPatient.get(pid) ?? [];
    list.push(s);
    scansByPatient.set(pid, list);
  }

  return patientRows.map((p: any) => {
    const pid = String(p.id);
    const name =
      p.full_name ||
      p.fullName ||
      [p.first_name, p.last_name].filter(Boolean).join(" ") ||
      "Unknown";

    const patientScans = scansByPatient.get(pid) ?? [];
    const brain = pickLatest(
      patientScans.filter(
        (s) => (s.modality || "").toLowerCase() === "mri"
      )
    );
    const heart = pickLatest(
      patientScans.filter(
        (s) => (s.modality || "").toLowerCase() === "xray"
      )
    );

    return {
      id: pid,
      name,
      avatar: makeAvatar(name),
      age: p.age ?? undefined,

      hasBrain: !!brain,
      hasHeart: !!heart,

      brainStress: normalizeRiskToStress(brain?.risk_level),
      heartSeverity: normalizeRiskToSeverity(heart?.risk_level),

      brainScanId: brain ? String(brain.id) : undefined,
      heartScanId: heart ? String(heart.id) : undefined,

      lastBrainScan: brain?.created_at ?? undefined,
      lastHeartScan: heart?.created_at ?? undefined,
    } as DoctorPatientListItem;
  });
}

export async function fetchUnassignedPatients(): Promise<DoctorPatientListItem[]> {
  if (USE_MOCK) {
    const { patients } = await loadMockData();
    return simulateRequest(() =>
      patients
        .filter((patient) => !patient.doctorId)
        .map((patient) => ({
          id: patient.id,
          name: patient.name,
          avatar: patient.avatar,
          age: patient.age,
          hasBrain: false,
          hasHeart: false,
        }))
    );
  }

  const response = await apiClient.get<any[]>(`/api/patients`, {
    params: { unassigned: true },
  });
  return (response.data ?? []).map(mapPatientRowBase);
}

export async function claimPatient(patientId: string): Promise<any> {
  if (USE_MOCK) {
    return simulateRequest(() => ({ success: true }));
  }
  const response = await apiClient.post(
    `/api/doctors/me/patients/${patientId}/claim`
  );
  return response.data;
}

export async function unassignPatient(patientId: string): Promise<any> {
  if (USE_MOCK) {
    return simulateRequest(() => ({ success: true }));
  }
  const response = await apiClient.delete(
    `/api/doctors/me/patients/${patientId}`
  );
  return response.data;
}

export const doctorService = {
  fetchPatientRecord,
  fetchDoctorBrainScan,
  fetchDoctorHeartScan,
  fetchDoctorPatients,
  fetchUnassignedPatients,
  claimPatient,
  unassignPatient,
};
