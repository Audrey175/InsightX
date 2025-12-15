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

  // Existing patients
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

  // Added patients for testing missing scans
  {
    id: "u-patient-3",
    role: "patient",
    email: "patient3@example.com",
    fullName: "Mr. Peter Griffin",
    password: "patient123",
    patientId: "P-0003", // brain-only (in fakeDatabase)
  },
  {
    id: "u-patient-4",
    role: "patient",
    email: "patient4@example.com",
    fullName: "Ms. Meg Griffin",
    password: "patient123",
    patientId: "P-0004", // brain-only (in fakeDatabase)
  },
  {
    id: "u-patient-5",
    role: "patient",
    email: "patient5@example.com",
    fullName: "Mr. Joe Swanson",
    password: "patient123",
    patientId: "P-0005", // heart-only (in fakeDatabase)
  },
  {
    id: "u-patient-6",
    role: "patient",
    email: "patient6@example.com",
    fullName: "Ms. Bonnie Swanson",
    password: "patient123",
    patientId: "P-0006", // heart-only (in fakeDatabase)
  },
  {
    id: "u-patient-7",
    role: "patient",
    email: "patient7@example.com",
    fullName: "Mr. Cleveland Brown",
    password: "patient123",
    patientId: "P-0007", // no scans (in fakeDatabase)
  },
  {
    id: "u-patient-8",
    role: "patient",
    email: "patient8@example.com",
    fullName: "Ms. Donna Tubbs",
    password: "patient123",
    patientId: "P-0008", // no scans (in fakeDatabase)
  },
];
