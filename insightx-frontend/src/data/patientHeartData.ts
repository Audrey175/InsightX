// Patient-facing heart scan views with patient metadata
import type { PatientHeartView } from "./fakeDatabase";
import { patients } from "./fakeDatabase";

export type PatientHeartRecord = PatientHeartView & {
  patientId: string;
  name: string;
  avatar: string;
};

export const patientHeartViews: PatientHeartRecord[] = patients
  .filter((patient) => patient.patient?.heart)
  .map((patient) => ({
    patientId: patient.id,
    name: patient.name,
    avatar: patient.avatar,
    ...patient.patient!.heart!,
  }));
