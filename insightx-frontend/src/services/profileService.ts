// src/services/profileService.ts
import { USE_MOCK, simulateRequest, apiClient } from "./api";
import type { AuthResponse, AuthUser } from "../types/auth";
import type { ApiScan } from "../types/scan";

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

const STORAGE_KEY = "insightx_auth";

const getSessionUser = (): AuthUser | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthResponse;
    return parsed.user ?? null;
  } catch {
    return null;
  }
};

const pickLatestDate = (scans: ApiScan[]) => {
  if (!scans.length) return "";
  const latest = scans
    .slice()
    .sort((a, b) =>
      String(b.created_at || "").localeCompare(String(a.created_at || ""))
    )[0];
  return latest?.created_at ? new Date(latest.created_at).toISOString().slice(0, 10) : "";
};

export const profileService = {
  async getDoctorProfile(_user: AuthUser): Promise<DoctorProfile> {
    if (USE_MOCK) {
      return simulateRequest(() => mockDoctorProfile);
    }

    const user = _user ?? getSessionUser();
    const doctorId = user?.doctorId;
    if (!doctorId) {
      throw new Error("Doctor profile not available.");
    }

    const [doctorRes, patientsRes] = await Promise.all([
      apiClient.get<{ id: number; full_name: string; specialization?: string | null }>(
        `/api/doctors/${doctorId}`
      ),
      apiClient.get<any[]>(`/api/doctors/${doctorId}/patients`),
    ]);

    const doctor = doctorRes.data;
    return {
      id: String(doctor.id),
      fullName: doctor.full_name,
      hospital: "InsightX Medical Center",
      department: doctor.specialization ?? "General",
      totalPatients: (patientsRes.data ?? []).length,
      avatarUrl: null,
    };
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

    const user = getSessionUser();
    const doctorId = user?.doctorId;
    if (!doctorId) {
      throw new Error("Doctor profile not available.");
    }

    await apiClient.put(`/api/doctors/${doctorId}`, {
      full_name: updates.fullName,
      specialization: updates.department,
    });
    return await this.getDoctorProfile(user);
  },

  async getPatientProfile(_user: AuthUser): Promise<PatientProfile> {
    if (USE_MOCK) {
      return simulateRequest(() => mockPatientProfile);
    }

    const user = _user ?? getSessionUser();
    const patientId = user?.patientId;
    if (!patientId) {
      throw new Error("Patient profile not available.");
    }

    const patientRes = await apiClient.get<any>(`/api/patients/${patientId}`);
    const scansRes = await apiClient.get<ApiScan[]>(`/api/scans`, {
      params: { patient_id: patientId },
    });

    const patient = patientRes.data;
    let doctorName = "Unassigned";
    if (patient?.doctor_id) {
      const doctorRes = await apiClient.get<{ full_name: string }>(
        `/api/doctors/${patient.doctor_id}`
      );
      doctorName = doctorRes.data?.full_name ?? doctorName;
    }

    const age = patient?.age ?? 0;
    return {
      id: String(patient.id),
      fullName:
        patient.full_name ||
        [patient.first_name, patient.last_name].filter(Boolean).join(" ") ||
        "Unknown",
      age,
      lastScanDate: pickLatestDate(scansRes.data ?? []),
      primaryDoctorName: doctorName,
      avatarUrl: null,
    };
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

    const user = getSessionUser();
    const patientId = user?.patientId;
    if (!patientId) {
      throw new Error("Patient profile not available.");
    }

    await apiClient.put(`/api/patients/${patientId}`, {
      full_name: updates.fullName,
      age: updates.age,
    });

    return await this.getPatientProfile(user);
  },
};
