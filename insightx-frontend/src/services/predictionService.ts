import { simulateRequest, apiClient } from "./api";

// Separate flag just for prediction (so dashboards/auth can stay mock)
const PREDICT_USE_MOCK = import.meta.env.VITE_PREDICT_USE_MOCK === "true";

export type PredictionResult = {
  filename: string;
  tumor_detected: boolean;
  tumor_size_pixels: {
    core: number;
    enhancing: number;
    whole: number;
  };
  tumor_location: { x: number; y: number } | null;
  risk_score: number;
};

export type XRayPredictionResult = {
  filename: string;
  modality: "xray";
  prediction_type: "classification";
  prediction: {
    label: "NORMAL" | "PNEUMONIA";
    confidence: number;
    probabilities: {
      NORMAL: number;
      PNEUMONIA: number;
    };
    risk_level: "low" | "medium" | "high";
  };
  model_info: {
    architecture: string;
    version: string;
  };
  disclaimer: string;
};

const mockPredictMRI = (file: File): PredictionResult => ({
  filename: file.name,
  tumor_detected: true,
  tumor_size_pixels: { core: 1320, enhancing: 410, whole: 1730 },
  tumor_location: { x: 124.6, y: 88.2 },
  risk_score: 0.62,
});

const mockPredictXRay = (file: File): XRayPredictionResult => ({
  filename: file.name,
  modality: "xray",
  prediction_type: "classification",
  prediction: {
    label: "PNEUMONIA",
    confidence: 0.83,
    probabilities: { NORMAL: 0.17, PNEUMONIA: 0.83 },
    risk_level: "high",
  },
  model_info: { architecture: "CNN (ResNet-based)", version: "xray-v1" },
  disclaimer: "This AI system is for research and decision support only.",
});

export async function predictMRI(file: File): Promise<PredictionResult> {
  if (PREDICT_USE_MOCK) {
    return simulateRequest(() => mockPredictMRI(file));
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<PredictionResult>("/predict", formData);
  return response.data;
}

export async function predictXRay(file: File): Promise<XRayPredictionResult> {
  if (PREDICT_USE_MOCK) {
    return simulateRequest(() => mockPredictXRay(file));
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<XRayPredictionResult>(
    "/predict/xray",
    formData
  );
  return response.data;
}
