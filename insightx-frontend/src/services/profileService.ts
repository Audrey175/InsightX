import { USE_MOCK, simulateRequest, apiClient } from "./api";
import type { AuthUser } from "../types/auth";
import { patients } from "../data/fakeDatabase";

export type PatientProfile = {
  id: string;
  fullName: string;
  age: number;
  lastScanDate: string;
  primaryDoctorName: string;
};

export type DoctorProfile = {
  id: string;
  fullName: string;
  hospital: string;
  department: string;
  totalPatients: number;
};

export const profileService = {
  async getPatientProfile(user: AuthUser): Promise<PatientProfile> {
    if (USE_MOCK) {
      return simulateRequest<PatientProfile>(() => {
        if (!user.patientId) {
          throw new Error("No patient profile available.");
        }

        const patient = patients.find((p) => p.id === user.patientId);
        if (!patient) {
          throw new Error("Patient not found.");
        }

        const profile: PatientProfile = {
          id: patient.id,
          fullName: patient.name,
          age: patient.age ?? 0,
          lastScanDate: patient.lastBrainScan ?? patient.lastHeartScan ?? "N/A",
          primaryDoctorName: "Assigned doctor",
        };

        return profile;
      });
    }

    const res = await apiClient.get<PatientProfile>("/patient/me/profile");
    return res.data;
  },

  async getDoctorProfile(user: AuthUser): Promise<DoctorProfile> {
    if (USE_MOCK) {
      return simulateRequest<DoctorProfile>(() => {
        if (!user.doctorId) {
          throw new Error("No doctor profile available.");
        }

        const doctorPatients = patients.filter(
          (patient) => patient.doctorId === user.doctorId
        );

        const profile: DoctorProfile = {
          id: user.doctorId,
          fullName: user.fullName,
          hospital: "InsightX Medical Center",
          department: "Neuroscience and Cardiology",
          totalPatients: doctorPatients.length,
        };

        return profile;
      });
    }

    const res = await apiClient.get<DoctorProfile>("/doctor/me/profile");
    return res.data;
  },
};
