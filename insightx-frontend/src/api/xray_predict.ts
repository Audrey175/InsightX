import { API_BASE_URL } from "../services/api";

export interface XRayPredictionResult {
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
}

export async function predictXRay(file: File): Promise<XRayPredictionResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/predict/xray`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return await response.json();
}
