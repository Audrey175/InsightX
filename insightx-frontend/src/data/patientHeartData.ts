// src/data/patientHeartData.ts

export type PatientHeartView = {
  patientId: string;
  name: string;
  avatar: string;
  scanId: string;
  bpm: number;
  oxygen: number;
  stress: "Low" | "Normal" | "High";
  pressure: string;
  condition: string;
  doctorNotes: string[];
};

export const patientHeartViews: PatientHeartView[] = [
  {
    patientId: "P-0001",
    name: "Glenn Quagmire",
    avatar: "GQ",
    scanId: "H-0001",
    bpm: 84,
    oxygen: 98,
    stress: "Normal",
    pressure: "130/85 mmHg",
    condition: "Mild strain under high activity.",
    doctorNotes: [
      "You may feel shortness of breath during intense exercise.",
      "Try to avoid sudden overexertion.",
      "Follow-up in 6 months or if symptoms worsen.",
    ],
  },
  {
    patientId: "P-0002",
    name: "Lois Griffin",
    avatar: "LG",
    scanId: "H-0002",
    bpm: 76,
    oxygen: 99,
    stress: "Low",
    pressure: "118/75 mmHg",
    condition: "Your heart looks healthy.",
    doctorNotes: [
      "Maintain regular physical activity and a balanced diet.",
      "Annual checkup is sufficient at this time.",
    ],
  },
  {
    patientId: "P-0003",
    name: "Peter Griffin",
    avatar: "PG",
    scanId: "H-0003",
    bpm: 92,
    oxygen: 96,
    stress: "High",
    pressure: "145/95 mmHg",
    condition: "Blood pressure is higher than ideal. Heart wall is slightly thickened.",
    doctorNotes: [
      "Reduce salt and processed food intake.",
      "Daily walking or light exercise is highly recommended.",
      "Regular blood pressure monitoring is important.",
    ],
  },
];
