import type { AuthUser } from "../types/auth";

export type MockUserRecord = AuthUser & { password: string };

export const mockUsers: MockUserRecord[] = [
  {
    id: "u-doctor-1",
    role: "doctor",
    email: "doctor@example.com",
    fullName: "Dr. Alice Nguyen",
    password: "doctor123",
    doctorId: "d-1",
  },
  {
    id: "u-patient-1",
    role: "patient",
    email: "patient1@example.com",
    fullName: "Mr. Glenn Quagmire",
    password: "patient123",
    patientId: "P-0001",
  },
  {
    id: "u-patient-2",
    role: "patient",
    email: "patient2@example.com",
    fullName: "Ms. Lois Griffin",
    password: "patient123",
    patientId: "P-0002",
  },
];
