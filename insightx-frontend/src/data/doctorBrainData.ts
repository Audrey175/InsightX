// Doctor-facing brain scan records with patient metadata
import type { DoctorBrainScan } from "./fakeDatabase";
import { patients } from "./fakeDatabase";

export type DoctorBrainScanRecord = DoctorBrainScan & {
  patientId: string;
  patientName: string;
  avatar: string;
  lastScanDate?: string;
};

export const doctorBrainScans: DoctorBrainScanRecord[] = patients.map(
  (patient) => ({
    patientId: patient.id,
    patientName: patient.name,
    avatar: patient.avatar,
    lastScanDate: patient.lastBrainScan,
    ...patient.doctor.brain,
  })
);
