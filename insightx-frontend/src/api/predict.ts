export interface MRIPredictionResult {
  modality: string;
  reconstruction_engine: string; 
  series_uid: string;
  series_detected: number;
  volume_shape: { depth: number; height: number; width: number };
  voxel_spacing: [number, number, number];
  reconstruction_file: string; // The .vti file
  heatmap_slice: string;       // The Grad-CAM .png
  canonical_volume_file: string;
  statistics: { 
    mean_intensity: number; 
    max_intensity: number; 
  };
  ai_analysis?: {
    classification: { tumor_type: string; confidence: number };
    risk_analysis: { risks: string[] };
  };
  disclaimer: string;
}

export async function predictMRI(file: File): Promise<MRIPredictionResult> {
  const formData = new FormData();
  formData.append("file", file);

  // CHANGED: Use 127.0.0.1 instead of localhost for Mac stability
  const response = await fetch("http://127.0.0.1:8000/predict/mri", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MRI analysis failed (${response.status}): ${errorText}`);
  }

  return response.json();
}