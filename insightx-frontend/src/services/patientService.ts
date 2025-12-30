import { USE_MOCK, simulateRequest, apiClient } from "./api";
import {
  patientBrainViews,
  type PatientBrainRecord,
} from "../data/patientBrainData";
import {
  patientHeartViews,
  type PatientHeartRecord,
} from "../data/patientHeartData";
import { getLatestDoneSession } from "./localScanStore";
import { findPatientById } from "../data/fakeDatabase";

export async function fetchPatientBrainScan(
  patientId = "P-0001"
): Promise<PatientBrainRecord | null> {
  if (USE_MOCK) {
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
      const scan = patientBrainViews.find(
        (item) => item.patientId === patientId
      );
      return scan ?? null;
    });
  }

  const response = await apiClient.get<PatientBrainRecord | null>(
    `/patient/${patientId}/brain`
  );
  return response.data;
}

export async function fetchPatientHeartScan(
  patientId = "P-0001"
): Promise<PatientHeartRecord | null> {
  if (USE_MOCK) {
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
      const scan = patientHeartViews.find(
        (item) => item.patientId === patientId
      );
      return scan ?? null;
    });
  }

  const response = await apiClient.get<PatientHeartRecord | null>(
    `/patient/${patientId}/heart`
  );
  return response.data;
}

export const patientService = {
  fetchPatientBrainScan,
  fetchPatientHeartScan,
};
