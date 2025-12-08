// src/data/doctorHeartData.ts

export type DoctorHeartScan = {
  scanId: string;
  patientId: string;
  patientName: string;
  avatar: string;
  heartRate: number;
  oxygen: number;
  pressure: string;
  condition: string;
  injury: {
    region: string;
    type: string;
    severity: "Low" | "Moderate" | "High";
    size: string;
    imaging: string[];
  };
  risks: string[];
  relatedCases: string[];
};

export const doctorHeartScans: DoctorHeartScan[] = [
  {
    scanId: "H-0001",
    patientId: "P-0001",
    patientName: "Mr. Glenn Quagmire",
    avatar: "GQ",
    heartRate: 84,
    oxygen: 98,
    pressure: "130/85 mmHg",
    condition: "Mild exertion-related strain",
    injury: {
      region: "Left Ventricle",
      type: "Mild Contusion",
      severity: "Low",
      size: "1.2 cm focal region",
      imaging: ["Cardiac MRI T1", "T2", "Echo"],
    },
    risks: [
      "Short-term chest discomfort during high exertion",
      "Low risk of arrhythmia",
    ],
    relatedCases: [
      "Sports collision · Chest impact",
      "Minor car crash trauma",
    ],
  },
  {
    scanId: "H-0002",
    patientId: "P-0002",
    patientName: "Ms. Lois Griffin",
    avatar: "LG",
    heartRate: 76,
    oxygen: 99,
    pressure: "118/75 mmHg",
    condition: "Normal function",
    injury: {
      region: "Myocardium",
      type: "No structural injury",
      severity: "Low",
      size: "N/A",
      imaging: ["Echo", "ECG"],
    },
    risks: ["Low global cardiovascular risk"],
    relatedCases: ["Routine checkup · No abnormalities"],
  },
  {
    scanId: "H-0003",
    patientId: "P-0003",
    patientName: "Mr. Peter Griffin",
    avatar: "PG",
    heartRate: 92,
    oxygen: 96,
    pressure: "145/95 mmHg",
    condition: "Hypertension with mild LV hypertrophy",
    injury: {
      region: "Left Ventricle",
      type: "Hypertrophy (chronic)",
      severity: "Moderate",
      size: "Wall thickening 1.6 cm",
      imaging: ["Echo", "Cardiac MRI", "ECG"],
    },
    risks: [
      "Increased risk of heart failure (long term)",
      "Higher risk of arrhythmias",
    ],
    relatedCases: [
      "Longstanding uncontrolled hypertension",
      "Family history of cardiovascular disease",
    ],
  },
];
