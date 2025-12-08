import { USE_MOCK, simulateRequest, apiClient } from "./api";
import {
  patientBrainViews,
  type PatientBrainRecord,
} from "../data/patientBrainData";
import {
  patientHeartViews,
  type PatientHeartRecord,
} from "../data/patientHeartData";

export async function fetchPatientBrainScan(
  patientId = "P-0001"
): Promise<PatientBrainRecord | null> {
  if (USE_MOCK) {
    return simulateRequest(() => {
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
