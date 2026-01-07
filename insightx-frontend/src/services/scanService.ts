import { apiClient, simulateRequest } from "./api";

export type ScanStatus = "uploaded" | "predicted" | "failed";
export type ScanModality = "mri" | "xray";

export type ScanSummary = {
  severity: "low" | "moderate" | "high";
  recommendation: string;
  key_findings?: Record<string, unknown>;
  error?: string;
};

export type ScanRecord = {
  id: number;
  patient_id: string;
  doctor_id?: string | null;
  modality: ScanModality;
  file_path: string;
  created_at: string;
  status: ScanStatus;
  ai_result?: any;
  summary?: ScanSummary | null;
  original_filename?: string | null;
};

type UploadPayload = {
  patientId: string;
  modality: ScanModality;
  doctorId?: string;
};

type ScanQuery = {
  patientId?: string;
  doctorId?: string;
  modality?: ScanModality;
};

const PREDICT_USE_MOCK = import.meta.env.VITE_PREDICT_USE_MOCK === "true";
const MOCK_STORAGE_KEY = "insightx_mock_scans";

const readMockScans = (): ScanRecord[] => {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScanRecord[];
  } catch {
    return [];
  }
};

const writeMockScans = (scans: ScanRecord[]) => {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(scans));
  } catch {
    // ignore storage errors
  }
};

const buildMockScan = (
  file: File,
  payload: UploadPayload
): ScanRecord => {
  const now = new Date().toISOString();
  const id = Date.now();

  if (payload.modality === "mri") {
    return {
      id,
      patient_id: payload.patientId,
      doctor_id: payload.doctorId ?? null,
      modality: "mri",
      file_path: `uploads/scans/${payload.patientId}/${file.name}`,
      created_at: now,
      status: "predicted",
      original_filename: file.name,
      ai_result: {
        filename: file.name,
        tumor_detected: true,
        tumor_size_pixels: { core: 980, enhancing: 220, whole: 1200 },
        tumor_location: { x: 122.3, y: 96.7 },
        risk_score: 0.58,
      },
      summary: {
        severity: "moderate",
        recommendation: "Follow-up imaging suggested.",
        key_findings: {
          tumor_detected: true,
          tumor_size_pixels: { core: 980, enhancing: 220, whole: 1200 },
          tumor_location: { x: 122.3, y: 96.7 },
          risk_score: 0.58,
        },
      },
    };
  }

  return {
    id,
    patient_id: payload.patientId,
    doctor_id: payload.doctorId ?? null,
    modality: "xray",
    file_path: `uploads/scans/${payload.patientId}/${file.name}`,
    created_at: now,
    status: "predicted",
    original_filename: file.name,
    ai_result: {
      filename: file.name,
      modality: "xray",
      prediction_type: "classification",
      prediction: {
        label: "PNEUMONIA",
        confidence: 0.78,
        probabilities: {
          NORMAL: 0.22,
          PNEUMONIA: 0.78,
        },
        risk_level: "medium",
      },
      model_info: {
        architecture: "CNN (ResNet-based)",
        version: "xray-v1",
      },
      disclaimer: "This AI system is for research and decision support only.",
    },
    summary: {
      severity: "moderate",
      recommendation: "Follow-up imaging suggested.",
      key_findings: {
        label: "PNEUMONIA",
        confidence: 0.78,
      },
    },
  };
};

export async function uploadAndPredictScan(
  file: File,
  payload: UploadPayload
): Promise<ScanRecord> {
  if (PREDICT_USE_MOCK) {
    return simulateRequest(() => {
      const record = buildMockScan(file, payload);
      const scans = readMockScans();
      scans.unshift(record);
      writeMockScans(scans);
      return record;
    });
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("patient_id", payload.patientId);
  formData.append("modality", payload.modality);
  if (payload.doctorId) {
    formData.append("doctor_id", payload.doctorId);
  }

  const response = await apiClient.post<ScanRecord>(
    "/scans/upload-and-predict",
    formData
  );
  return response.data;
}

export async function getScans(query: ScanQuery = {}): Promise<ScanRecord[]> {
  if (PREDICT_USE_MOCK) {
    return simulateRequest(() => {
      const scans = readMockScans();
      return scans.filter((scan) => {
        if (query.patientId && scan.patient_id !== query.patientId) return false;
        if (query.doctorId && scan.doctor_id !== query.doctorId) return false;
        if (query.modality && scan.modality !== query.modality) return false;
        return true;
      });
    });
  }

  const response = await apiClient.get<ScanRecord[]>("/scans", {
    params: {
      patient_id: query.patientId,
      doctor_id: query.doctorId,
      modality: query.modality,
    },
  });
  return response.data;
}

export async function getScanById(scanId: number): Promise<ScanRecord> {
  if (PREDICT_USE_MOCK) {
    return simulateRequest(() => {
      const scan = readMockScans().find((item) => item.id === scanId);
      if (!scan) {
        throw new Error("Scan not found.");
      }
      return scan;
    });
  }

  const response = await apiClient.get<ScanRecord>(`/scans/${scanId}`);
  return response.data;
}
