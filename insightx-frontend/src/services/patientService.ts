import type { StressLevel } from "../data/fakeDatabase";
import type { PatientBrainRecord } from "../data/patientBrainData";
import type { PatientHeartRecord } from "../data/patientHeartData";
import { USE_MOCK, simulateRequest, apiClient } from "./api";
import { getLatestDoneSession } from "./localScanStore";
import type { ApiScan } from "../types/scan";

const loadMockData = async () => {
  const [{ patientBrainViews }, { patientHeartViews }, { findPatientById }] =
    await Promise.all([
      import("../data/patientBrainData"),
      import("../data/patientHeartData"),
      import("../data/fakeDatabase"),
    ]);
  return { patientBrainViews, patientHeartViews, findPatientById };
};

const makeAvatar = (name: string): string => {
  const parts = name.split(" ").filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((p) => (p[0] ? p[0].toUpperCase() : ""))
    .join("");
  return initials || "NA";
};

const pickLatest = (scans: ApiScan[]) =>
  scans
    .slice()
    .sort((a, b) =>
      String(b.created_at || "").localeCompare(String(a.created_at || ""))
    )[0];

const resolveSeverity = (scan?: ApiScan | null): string | undefined =>
  scan?.summary?.severity ?? scan?.risk_level ?? undefined;

const normalizeRiskToStress = (risk?: string | null): StressLevel | undefined => {
  if (!risk) return undefined;
  const r = risk.toLowerCase();
  if (r.includes("high")) return "High" as any;
  if (r.includes("medium") || r.includes("moderate")) return "Normal" as any;
  if (r.includes("low")) return "Low" as any;
  return undefined;
};

const metricsFromSeverity = (severity?: string) => {
  const normalized = (severity || "low").toLowerCase();
  if (normalized.includes("high")) {
    return { oxygenation: 64, focus: "Fluctuating", score: 60 };
  }
  if (normalized.includes("moderate") || normalized.includes("medium")) {
    return { oxygenation: 74, focus: "Stable", score: 75 };
  }
  return { oxygenation: 86, focus: "Stable", score: 90 };
};

const fetchPatientInfo = async (patientId: string) => {
  const response = await apiClient.get<any>(`/api/patients/${patientId}`);
  const p = response.data;
  if (!p) return { name: "Unknown patient", avatar: "NA" };
  const name =
    p.full_name ||
    p.fullName ||
    [p.first_name, p.last_name].filter(Boolean).join(" ") ||
    "Unknown";
  return { name, avatar: makeAvatar(name) };
};

export async function fetchPatientBrainScan(
  patientId = "P-0001"
): Promise<PatientBrainRecord | null> {
  if (USE_MOCK) {
    const { patientBrainViews, findPatientById } = await loadMockData();
    return simulateRequest(() => {
      const patient = findPatientById(patientId);
      const session = getLatestDoneSession(patientId, "brain");
      const sessionPatient = session?.data?.patient as PatientBrainRecord | undefined;
      if (sessionPatient) {
        const base = sessionPatient as Partial<PatientBrainRecord>;
        return {
          ...base,
          patientId,
          name: base.name ?? patient?.name ?? "Unknown patient",
          avatar: base.avatar ?? patient?.avatar ?? "NA",
          scanId: base.scanId ?? (session?.id ? `B-SESSION-${session.id}` : "B-SESSION"),
        } as PatientBrainRecord;
      }
      const scan = patientBrainViews.find((item) => item.patientId === patientId);
      return scan ?? null;
    });
  }

  const scansRes = await apiClient.get<ApiScan[]>(`/api/scans`, {
    params: { patient_id: patientId, modality: "mri" },
  });
  const latest = pickLatest(scansRes.data ?? []);
  if (!latest) return null;

  const patient = await fetchPatientInfo(patientId);
  const severity = resolveSeverity(latest);
  const metrics = metricsFromSeverity(severity);
  const stress = normalizeRiskToStress(severity) ?? ("Low" as any);
  const keyFindings = latest.summary?.key_findings ?? {};
  const tumorDetected = (keyFindings as any).tumor_detected;
  const tumorSize = (keyFindings as any).tumor_size_pixels;
  const riskScore = (keyFindings as any).risk_score;
  const classification = (latest.ai_result as any)?.classification?.tumor_type;

  const doctorNotes: string[] = [];
  if (classification) doctorNotes.push(`Classification: ${classification}`);
  if (tumorDetected !== undefined)
    doctorNotes.push(`Tumor detected: ${tumorDetected ? "Yes" : "No"}`);
  if (typeof tumorSize !== "undefined") doctorNotes.push(`Tumor size: ${tumorSize} px`);
  if (typeof riskScore !== "undefined") {
    doctorNotes.push(`Risk score: ${(Number(riskScore) * 100).toFixed(1)}%`);
  }
  if (!doctorNotes.length) doctorNotes.push("No additional findings available yet.");

  return {
    patientId: String(patientId),
    name: patient.name,
    avatar: patient.avatar,
    scanId: String(latest.id),
    oxygenation: metrics.oxygenation,
    stress,
    focus: metrics.focus as any,
    score: metrics.score,
    doctorSummary:
      latest.summary?.recommendation ?? "Awaiting clinician review.",
    doctorNotes,
  } as PatientBrainRecord;
}

export async function fetchPatientHeartScan(
  patientId = "P-0001"
): Promise<PatientHeartRecord | null> {
  if (USE_MOCK) {
    const { patientHeartViews, findPatientById } = await loadMockData();
    return simulateRequest(() => {
      const patient = findPatientById(patientId);
      const session = getLatestDoneSession(patientId, "heart");
      const sessionPatient = session?.data?.patient as PatientHeartRecord | undefined;
      if (sessionPatient) {
        const base = sessionPatient as Partial<PatientHeartRecord>;
        return {
          ...base,
          patientId,
          name: base.name ?? patient?.name ?? "Unknown patient",
          avatar: base.avatar ?? patient?.avatar ?? "NA",
          scanId: base.scanId ?? (session?.id ? `H-SESSION-${session.id}` : "H-SESSION"),
        } as PatientHeartRecord;
      }
      const scan = patientHeartViews.find((item) => item.patientId === patientId);
      return scan ?? null;
    });
  }

  const scansRes = await apiClient.get<ApiScan[]>(`/api/scans`, {
    params: { patient_id: patientId, modality: "xray" },
  });
  const latest = pickLatest(scansRes.data ?? []);
  if (!latest) return null;

  const patient = await fetchPatientInfo(patientId);
  const severity = resolveSeverity(latest);
  const stress = normalizeRiskToStress(severity) ?? ("Low" as any);
  const prediction = (latest.ai_result as any)?.prediction;
  const label = prediction?.label;
  const confidence = prediction?.confidence;

  const doctorNotes: string[] = [];
  if (label) doctorNotes.push(`AI label: ${label}`);
  if (typeof confidence === "number")
    doctorNotes.push(`Confidence: ${(confidence * 100).toFixed(1)}%`);
  if (latest.summary?.recommendation)
    doctorNotes.push(latest.summary.recommendation);
  if (!doctorNotes.length) doctorNotes.push("Awaiting clinician review.");

  return {
    patientId: String(patientId),
    name: patient.name,
    avatar: patient.avatar,
    scanId: String(latest.id),
    bpm: 80,
    oxygen: 97,
    stress,
    pressure: "120/80 mmHg",
    condition:
      latest.summary?.recommendation ??
      (label ? `AI classification: ${label}` : "Pending review"),
    doctorNotes,
  } as PatientHeartRecord;
}

export const patientService = {
  fetchPatientBrainScan,
  fetchPatientHeartScan,
};
