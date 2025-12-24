// src/data/patientBrainData.ts

export type PatientBrainView = {
  patientId: string;
  name: string;
  avatar: string;
  scanId: string;
  oxygenation: number;
  stress: "Low" | "Normal" | "High";
  focus: "Stable" | "Fluctuating" | "Low";
  score: number;
  doctorSummary: string;
  doctorNotes: string[];
};

export const patientBrainViews: PatientBrainView[] = [
  {
    patientId: "P-0001",
    name: "Glenn Quagmire",
    avatar: "GQ",
    scanId: "B-0001",
    oxygenation: 72,
    stress: "Normal",
    focus: "Stable",
    score: 85,
    doctorSummary: "Overall brain activity is within an acceptable range.",
    doctorNotes: [
      "Short-term memory may be slightly affected for a few weeks.",
      "Follow-up scan recommended in 3 months.",
      "Avoid high-risk activities until dizziness fully resolves.",
    ],
  },
  {
    patientId: "P-0002",
    name: "Lois Griffin",
    avatar: "LG",
    scanId: "B-0002",
    oxygenation: 78,
    stress: "Low",
    focus: "Stable",
    score: 92,
    doctorSummary: "Your brain scan looks healthy.",
    doctorNotes: [
      "Mild concussion–like symptoms may occur (headache, fatigue).",
      "Rest and proper sleep are recommended.",
    ],
  },
  {
    patientId: "P-0003",
    name: "Peter Griffin",
    avatar: "PG",
    scanId: "B-0003",
    oxygenation: 68,
    stress: "High",
    focus: "Fluctuating",
    score: 73,
    doctorSummary:
      "There are changes related to a small stroke. Treatment and monitoring are required.",
    doctorNotes: [
      "Blood pressure control is very important.",
      "Report immediately if you notice new weakness, speech problems, or severe headache.",
    ],
  },
];
