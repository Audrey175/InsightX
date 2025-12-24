import { simulateRequest } from "./api";
import { dummyBrainScan } from "../data/doctorBrainData";
import { dummyDoctorHeart } from "../data/doctorHeartData";

export async function fetchDoctorBrainScan(patientId: string) {
  // patientId kept for future DB lookup
  void patientId;
  return simulateRequest(dummyBrainScan, 700);
}

export async function fetchDoctorHeartScan(patientId: string) {
  void patientId;
  return simulateRequest(dummyDoctorHeart, 700);
}
