export interface PredictionResult {
  filename: string;
  segmentation: {
    tumor_detected: boolean;
    tumor_size_pixels: number;
    tumor_location: {
      x: number;
      y: number;
    } | null;
    
  };
  classification: {
    tumor_type: "glioma" | "meningioma" | "notumor" | "pituitary";
    confidence: number;
    probabilities: {
      glioma: number;
      meningioma: number;
      notumor: number;
      pituitary: number;
    }
  };
  risk_analysis: {
    risks: string[];
  };
}

export async function predictMRI(file: File): Promise<PredictionResult>{
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API returned status ${response.status}`);
  }
  return await response.json();
  
}