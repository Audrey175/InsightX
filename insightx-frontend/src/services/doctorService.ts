import {
  type InjurySeverity,
  type PatientRecord,
  type StressLevel,
  patients,
} from "../data/fakeDatabase";
import {
  doctorBrainScans,
  type DoctorBrainScanRecord,
} from "../data/doctorBrainData";
import {
  doctorHeartScans,
  type DoctorHeartScanRecord,
} from "../data/doctorHeartData";
import { getLatestDoneSession } from "./localScanStore";
import { USE_MOCK, simulateRequest, apiClient } from "./api";

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

const findPatient = (patientId: string) =>
  patients.find((patient) => patient.id === patientId);

export async function fetchPatientRecord(
  patientId: string
): Promise<PatientRecord | null> {
  if (USE_MOCK) {
    return simulateRequest(() => findPatient(patientId) ?? null);
  }

  const response = await apiClient.get<PatientRecord | null>(
    `/doctor/patients/${patientId}`
  );
  return response.data;
}

export async function fetchDoctorBrainScan(
  patientId: string
): Promise<DoctorBrainScanRecord | null> {
  if (USE_MOCK) {
    return simulateRequest(() => {
      const patient = findPatient(patientId);
      const session = getLatestDoneSession(patientId, "brain");
      const sessionDoctor = session?.data?.doctor as DoctorBrainScanRecord | undefined;
      if (sessionDoctor) {
        const base = sessionDoctor as Partial<DoctorBrainScanRecord>;
        return {
          ...base,
          patientId,
          patientName: base.patientName ?? patient?.name ?? "Unknown patient",
          avatar: base.avatar ?? patient?.avatar ?? "NA",
          lastScanDate: base.lastScanDate ?? session?.createdAt,
          scanId: base.scanId ?? (session?.id ? `B-SESSION-${session.id}` : "B-SESSION"),
        } as DoctorBrainScanRecord;
      }
      const scan = doctorBrainScans.find((item) => item.patientId === patientId);
      return scan ?? null;
    });
  }

  const response = await apiClient.get<DoctorBrainScanRecord | null>(
    `/doctor/patients/${patientId}/brain`
  );
  return response.data;
}

export async function fetchDoctorHeartScan(
  patientId: string
): Promise<DoctorHeartScanRecord | null> {
  if (USE_MOCK) {
    return simulateRequest(() => {
      const patient = findPatient(patientId);
      const session = getLatestDoneSession(patientId, "heart");
      const sessionDoctor = session?.data?.doctor as DoctorHeartScanRecord | undefined;
      if (sessionDoctor) {
        const base = sessionDoctor as Partial<DoctorHeartScanRecord>;
        return {
          ...base,
          patientId,
          patientName: base.patientName ?? patient?.name ?? "Unknown patient",
          avatar: base.avatar ?? patient?.avatar ?? "NA",
          lastScanDate: base.lastScanDate ?? session?.createdAt,
          scanId: base.scanId ?? (session?.id ? `H-SESSION-${session.id}` : "H-SESSION"),
        } as DoctorHeartScanRecord;
      }
      const scan = doctorHeartScans.find((item) => item.patientId === patientId);
      return scan ?? null;
    });
  }

  const response = await apiClient.get<DoctorHeartScanRecord | null>(
    `/doctor/patients/${patientId}/heart`
  );
  return response.data;
}

export async function fetchDoctorPatients(): Promise<DoctorPatientListItem[]> {
  if (USE_MOCK) {
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
          heartSeverity: (heartScan as DoctorHeartScanRecord | undefined)?.injury?.severity as
            | InjurySeverity
            | undefined,
          heartScanId: (heartScan as any)?.scanId,
          lastBrainScan: brainSession?.createdAt ?? patient.lastBrainScan,
          lastHeartScan: heartSession?.createdAt ?? patient.lastHeartScan,
          hasBrain: !!brainScan,
          hasHeart: !!heartScan,
        };
      })
    );
  }

  const response = await apiClient.get<DoctorPatientListItem[]>(
    "/doctor/patients"
  );
  return response.data;
}

export const doctorService = {
  fetchPatientRecord,
  fetchDoctorBrainScan,
  fetchDoctorHeartScan,
  fetchDoctorPatients,
};
