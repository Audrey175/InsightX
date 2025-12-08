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
import { USE_MOCK, simulateRequest, apiClient } from "./api";

export type DoctorPatientListItem = {
  id: string;
  name: string;
  avatar: string;
  age?: number;
  brainStress: StressLevel;
  brainScanId: string;
  heartSeverity: InjurySeverity;
  heartScanId: string;
  lastBrainScan?: string;
  lastHeartScan?: string;
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
      const scan = doctorBrainScans.find(
        (item) => item.patientId === patientId
      );
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
      const scan = doctorHeartScans.find(
        (item) => item.patientId === patientId
      );
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
      patients.map<DoctorPatientListItem>((patient) => ({
        id: patient.id,
        name: patient.name,
        avatar: patient.avatar,
        age: patient.age,
        brainStress: patient.doctor.brain.stress,
        brainScanId: patient.doctor.brain.scanId,
        heartSeverity: patient.doctor.heart.injury.severity,
        heartScanId: patient.doctor.heart.scanId,
        lastBrainScan: patient.lastBrainScan,
        lastHeartScan: patient.lastHeartScan,
      }))
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
