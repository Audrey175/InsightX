// Doctor-facing heart scan records with patient metadata
import type { DoctorHeartScan } from "./fakeDatabase";
import { patients } from "./fakeDatabase";

export type DoctorHeartScanRecord = DoctorHeartScan & {
  patientId: string;
  patientName: string;
  avatar: string;
  lastScanDate?: string;
};

export const doctorHeartScans: DoctorHeartScanRecord[] = patients
  .filter((patient) => patient.doctor?.heart)
  .map((patient) => ({
    patientId: patient.id,
    patientName: patient.name,
    avatar: patient.avatar,
    lastScanDate: patient.lastHeartScan,
    ...patient.doctor!.heart!,
  }));
