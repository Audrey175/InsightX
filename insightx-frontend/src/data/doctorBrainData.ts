// src/data/doctorBrainData.ts

export type DoctorBrainScan = {
  scanId: string;
  patientId: string;
  patientName: string;
  avatar: string; // initials
  oxygenation: number;
  stress: "Low" | "Normal" | "High";
  focus: "Stable" | "Fluctuating" | "Low";
  performanceScore: number; // 0–100
  injury: {
    location: string;
    type: string;
    size: string;
    edema: string;
    imaging: string[];
  };
  risks: string[];
  relatedCases: string[];
};

// You can add as many as you want here
export const doctorBrainScans: DoctorBrainScan[] = [
  {
    scanId: "B-0001",
    patientId: "P-0001",
    patientName: "Mr. Glenn Quagmire",
    avatar: "GQ",
    oxygenation: 72,
    stress: "Normal",
    focus: "Stable",
    performanceScore: 85,
    injury: {
      location: "Left Temporal Lobe",
      type: "Hemorrhagic Contusion",
      size: "2.4 cm × 1.1 cm",
      edema: "~12 ml",
      imaging: ["MRI T1", "T2", "FLAIR", "DWI"],
    },
    risks: [
      "Seizure risk: Elevated",
      "Risk of hemorrhage expansion: Moderate",
      "Short-term memory impairment likely",
      "Possible post-traumatic epilepsy (long term)",
    ],
    relatedCases: [
      "Motorbike chest impact · Mild RV contusion",
      "Sports collision · Head impact",
      "Post-traumatic seizure episodes",
    ],
  },
  {
    scanId: "B-0002",
    patientId: "P-0002",
    patientName: "Ms. Lois Griffin",
    avatar: "LG",
    oxygenation: 78,
    stress: "Low",
    focus: "Stable",
    performanceScore: 92,
    injury: {
      location: "Frontal Lobe",
      type: "Mild Concussion",
      size: "No focal lesion",
      edema: "Minimal",
      imaging: ["CT Head", "MRI T2"],
    },
    risks: [
      "Headache and attention span reduction for 1–2 weeks",
      "Low risk of long-term complications",
    ],
    relatedCases: [
      "Minor domestic fall · No LOC",
      "Sports injury · Soccer header",
    ],
  },
  {
    scanId: "B-0003",
    patientId: "P-0003",
    patientName: "Mr. Peter Griffin",
    avatar: "PG",
    oxygenation: 68,
    stress: "High",
    focus: "Fluctuating",
    performanceScore: 73,
    injury: {
      location: "Right Parietal Lobe",
      type: "Ischemic Stroke (subacute)",
      size: "3.1 cm × 2.2 cm",
      edema: "~18 ml",
      imaging: ["MRI DWI", "FLAIR", "Perfusion"],
    },
    risks: [
      "Risk of recurrent stroke: Moderate",
      "Motor coordination and balance deficits",
      "Requires strict blood pressure control",
    ],
    relatedCases: [
      "Hypertension-related microinfarcts",
      "Old lacunar infarcts in basal ganglia",
    ],
  },
];
