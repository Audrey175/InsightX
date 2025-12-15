// src/services/profileService.ts
import { USE_MOCK, simulateRequest, apiClient } from "./api";
import type { AuthUser } from "../types/auth";

export interface DoctorProfile {
  id: string;
  fullName: string;
  hospital: string;
  department: string;
  totalPatients: number;
  avatarUrl?: string | null; // new
}

export interface PatientProfile {
  id: string;
  fullName: string;
  age: number;
  lastScanDate: string;
  primaryDoctorName: string;
  avatarUrl?: string | null; // new
}

// --- MOCK STORAGE (kept in memory for now) ---

let mockDoctorProfile: DoctorProfile = {
  id: "D-0001",
  fullName: "Dr. Alex Nguyen",
  hospital: "InsightX General Hospital",
  department: "Neurosurgery",
  totalPatients: 24,
  avatarUrl: null,
};

let mockPatientProfile: PatientProfile = {
  id: "P-0001",
  fullName: "Jane Smith",
  age: 32,
  lastScanDate: "2025-11-12",
  primaryDoctorName: "Dr. Alex Nguyen",
  avatarUrl: null,
};

// --- SERVICE IMPLEMENTATION ---

export const profileService = {
  async getDoctorProfile(_user: AuthUser): Promise<DoctorProfile> {
    if (USE_MOCK) {
      return simulateRequest(() => mockDoctorProfile);
    }

    const res = await apiClient.get<DoctorProfile>("/profile/doctor");
    return res.data;
  },

  async updateDoctorProfile(
    updates: Partial<DoctorProfile>
  ): Promise<DoctorProfile> {
    if (USE_MOCK) {
      return simulateRequest(() => {
        mockDoctorProfile = { ...mockDoctorProfile, ...updates };
        return mockDoctorProfile;
      });
    }

    const res = await apiClient.put<DoctorProfile>("/profile/doctor", updates);
    return res.data;
  },

  async getPatientProfile(_user: AuthUser): Promise<PatientProfile> {
    if (USE_MOCK) {
      return simulateRequest(() => mockPatientProfile);
    }

    const res = await apiClient.get<PatientProfile>("/profile/patient");
    return res.data;
  },

  async updatePatientProfile(
    updates: Partial<PatientProfile>
  ): Promise<PatientProfile> {
    if (USE_MOCK) {
      return simulateRequest(() => {
        mockPatientProfile = { ...mockPatientProfile, ...updates };
        return mockPatientProfile;
      });
    }

    const res = await apiClient.put<PatientProfile>("/profile/patient", updates);
    return res.data;
  },
};
