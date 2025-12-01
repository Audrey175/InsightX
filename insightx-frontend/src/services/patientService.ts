import { simulateRequest } from "./api";
import { dummyPatientBrain } from "../data/patientBrainData";
import { dummyPatientHeart } from "../data/patientHeartData";

export async function fetchPatientBrainScan() {
  return simulateRequest(dummyPatientBrain, 700);
}

export async function fetchPatientHeartScan() {
  return simulateRequest(dummyPatientHeart, 700);
}
