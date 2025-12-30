export type StressLevel = "Low" | "Normal" | "High";
export type FocusLevel = "Stable" | "Fluctuating" | "Low";
export type InjurySeverity = "Low" | "Moderate" | "High";

export type DoctorBrainScan = {
  scanId: string;
  oxygenation: number;
  stress: StressLevel;
  focus: FocusLevel;
  performanceScore: number;
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

export type DoctorHeartScan = {
  scanId: string;
  heartRate: number;
  oxygen: number;
  pressure: string;
  condition: string;
  injury: {
    region: string;
    type: string;
    severity: InjurySeverity;
    size: string;
    imaging: string[];
  };
  risks: string[];
  relatedCases: string[];
};

export type PatientBrainView = {
  scanId: string;
  oxygenation: number;
  stress: StressLevel;
  focus: FocusLevel;
  score: number;
  doctorSummary: string;
  doctorNotes: string[];
};

export type PatientHeartView = {
  scanId: string;
  bpm: number;
  oxygen: number;
  stress: StressLevel;
  pressure: string;
  condition: string;
  doctorNotes: string[];
};

export type PatientRecord = {
  id: string;          // P-0001
  name: string;        // Glenn Quagmire
  avatar: string;      // initials like GQ
  age?: number;
  lastBrainScan?: string;
  lastHeartScan?: string;
  doctorId?: string;
  doctor: {
    brain?: DoctorBrainScan;
    heart?: DoctorHeartScan;
  };
  patient: {
    brain?: PatientBrainView;
    heart?: PatientHeartView;
  };
};

// ==== DATA ====
// You can add more patients by pushing new objects into this array.

export const patients: PatientRecord[] = [
  {
    id: "P-0001",
    name: "Mr. Glenn Quagmire",
    avatar: "GQ",
    age: 45,
    lastBrainScan: "2025-01-12",
    lastHeartScan: "2025-01-10",
    doctorId: "d-1",
    doctor: {
      brain: {
        scanId: "B-0001",
        oxygenation: 72,
        stress: "Normal",
        focus: "Stable",
        performanceScore: 85,
        injury: {
          location: "Left Temporal Lobe",
          type: "Hemorrhagic Contusion",
          size: "2.4 cm x 1.1 cm",
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
          "Motorbike chest impact - Mild RV contusion",
          "Sports collision - Head impact",
          "Post-traumatic seizure episodes",
        ],
      },
      heart: {
        scanId: "H-0001",
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
          "Sports collision - Chest impact",
          "Minor car crash trauma",
        ],
      },
    },
    patient: {
      brain: {
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
      heart: {
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
    },
  },

  {
    id: "P-0002",
    name: "Ms. Lois Griffin",
    avatar: "LG",
    age: 42,
    lastBrainScan: "2025-01-05",
    lastHeartScan: "2025-01-05",
    doctorId: "d-1",
    doctor: {
      brain: {
        scanId: "B-0002",
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
          "Headache and attention span reduction for 1-2 weeks",
          "Low risk of long-term complications",
        ],
        relatedCases: [
          "Minor domestic fall - No loss of consciousness",
          "Sports injury - Soccer header",
        ],
      },
      heart: {
        scanId: "H-0002",
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
        relatedCases: ["Routine checkup - No abnormalities"],
      },
    },
    patient: {
      brain: {
        scanId: "B-0002",
        oxygenation: 78,
        stress: "Low",
        focus: "Stable",
        score: 92,
        doctorSummary: "Your brain scan looks healthy.",
        doctorNotes: [
          "Mild concussion-like symptoms may occur (headache, fatigue).",
          "Rest and proper sleep are recommended.",
        ],
      },
      heart: {
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
    },
  },

  {
    id: "P-0003",
    name: "Mr. Peter Griffin",
    avatar: "PG",
    age: 48,
    lastBrainScan: "2024-12-22",
    lastHeartScan: "2024-12-18",
    doctorId: "d-2",
    doctor: {
      brain: {
        scanId: "B-0003",
        oxygenation: 68,
        stress: "High",
        focus: "Fluctuating",
        performanceScore: 73,
        injury: {
          location: "Right Parietal Lobe",
          type: "Ischemic Stroke (subacute)",
          size: "3.1 cm x 2.2 cm",
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
      heart: {
        scanId: "H-0003",
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
    },
    patient: {
      brain: {
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
      heart: {
        scanId: "H-0003",
        bpm: 92,
        oxygen: 96,
        stress: "High",
        pressure: "145/95 mmHg",
        condition:
          "Blood pressure is higher than ideal. Heart wall is slightly thickened.",
        doctorNotes: [
          "Reduce salt and processed food intake.",
          "Daily walking or light exercise is highly recommended.",
          "Regular blood pressure monitoring is important.",
        ],
      },
    },
  },

  {
    id: "P-0004",
    name: "Ms. Diane Simmons",
    avatar: "DS",
    age: 38,
    lastHeartScan: "2025-01-08",
    doctorId: "d-1",
    doctor: {
      heart: {
        scanId: "H-0004",
        heartRate: 88,
        oxygen: 97,
        pressure: "125/80 mmHg",
        condition: "Post-viral myocarditis (resolving)",
        injury: {
          region: "Myocardium",
          type: "Mild inflammation",
          severity: "Moderate",
          size: "1.1 cm focal region",
          imaging: ["Cardiac MRI", "ECG"],
        },
        risks: ["Shortness of breath on exertion"],
        relatedCases: ["Recent viral infection with cardiac impact"],
      },
    },
    patient: {
      heart: {
        scanId: "H-0004",
        bpm: 88,
        oxygen: 97,
        stress: "Normal",
        pressure: "125/80 mmHg",
        condition: "Recovering myocarditis; monitor symptoms.",
        doctorNotes: [
          "Avoid strenuous exercise until cleared.",
          "Report chest pain or palpitations immediately.",
        ],
      },
    },
  },

  {
    id: "P-0005",
    name: "Mr. Cleveland Brown",
    avatar: "CB",
    age: 50,
    lastBrainScan: "2025-01-02",
    doctorId: "d-2",
    doctor: {
      brain: {
        scanId: "B-0005",
        oxygenation: 75,
        stress: "Low",
        focus: "Stable",
        performanceScore: 88,
        injury: {
          location: "Occipital Lobe",
          type: "Minor contusion",
          size: "1.0 cm region",
          edema: "~6 ml",
          imaging: ["MRI T1", "T2"],
        },
        risks: ["Temporary visual disturbances"],
        relatedCases: ["Slip and fall - back of head impact"],
      },
    },
    patient: {
      brain: {
        scanId: "B-0005",
        oxygenation: 75,
        stress: "Low",
        focus: "Stable",
        score: 88,
        doctorSummary: "Minor injury with low risk of complications.",
        doctorNotes: [
          "Monitor for headaches or visual changes.",
          "Follow-up scan suggested in 2 months.",
        ],
      },
    },
  },

  {
    id: "P-0006",
    name: "Ms. Brenda Quagmire",
    avatar: "BQ",
    age: 47,
    lastBrainScan: "2025-01-04",
    doctorId: "d-3",
    doctor: {
      brain: {
        scanId: "B-0006",
        oxygenation: 80,
        stress: "Normal",
        focus: "Stable",
        performanceScore: 90,
        injury: {
          location: "Parietal Lobe",
          type: "Minor contusion",
          size: "1.2 cm region",
          edema: "~5 ml",
          imaging: ["CT", "MRI T2"],
        },
        risks: ["Mild dizziness possible"],
        relatedCases: ["Household fall"],
      },
    },
    patient: {
      brain: {
        scanId: "B-0006",
        oxygenation: 80,
        stress: "Normal",
        focus: "Stable",
        score: 90,
        doctorSummary: "Minor issue, no major concerns.",
        doctorNotes: ["Monitor for dizziness.", "Return if symptoms worsen."],
      },
    },
  },

  {
    id: "P-0007",
    name: "Mr. Joe Swanson",
    avatar: "JS",
    age: 46,
    lastHeartScan: "2025-01-09",
    doctorId: "d-2",
    doctor: {
      heart: {
        scanId: "H-0007",
        heartRate: 88,
        oxygen: 97,
        pressure: "135/88 mmHg",
        condition: "Post-operative monitoring",
        injury: {
          region: "Right Ventricle",
          type: "Surgical repair",
          severity: "Moderate",
          size: "2.0 cm region",
          imaging: ["Cardiac MRI", "Echo"],
        },
        risks: ["Monitor for arrhythmia", "Post-op inflammation"],
        relatedCases: ["Recent surgery follow-up"],
      },
    },
    patient: {
      heart: {
        scanId: "H-0007",
        bpm: 88,
        oxygen: 97,
        stress: "High",
        pressure: "135/88 mmHg",
        condition: "Recovering post-surgery.",
        doctorNotes: [
          "Avoid strenuous activity.",
          "Report palpitations immediately.",
        ],
      },
    },
  },

  {
    id: "P-0008",
    name: "Ms. Angela Jones",
    avatar: "AJ",
    age: 36,
    doctorId: "d-4",
    doctor: {},
    patient: {},
  },

  {
    id: "P-0009",
    name: "Mr. Carl Johnson",
    avatar: "CJ",
    age: 40,
    doctorId: "d-4",
    doctor: {},
    patient: {},
  },
];

// ==== HELPERS ====

export const findPatientById = (patientId: string | undefined) =>
  patients.find((p) => p.id === patientId);

export const getDoctorBrainFor = (patientId: string | undefined) =>
  findPatientById(patientId)?.doctor?.brain;

export const getDoctorHeartFor = (patientId: string | undefined) =>
  findPatientById(patientId)?.doctor?.heart;

export const getPatientBrainFor = (patientId: string | undefined) =>
  findPatientById(patientId)?.patient?.brain;

export const getPatientHeartFor = (patientId: string | undefined) =>
  findPatientById(patientId)?.patient?.heart;
