// Patient-facing brain scan views with patient metadata
import type { PatientBrainView } from "./fakeDatabase";
import { patients } from "./fakeDatabase";

export type PatientBrainRecord = PatientBrainView & {
  patientId: string;
  name: string;
  avatar: string;
};

export const patientBrainViews: PatientBrainRecord[] = patients.map(
  (patient) => ({
    patientId: patient.id,
    name: patient.name,
    avatar: patient.avatar,
    ...patient.patient.brain,
  })
);
