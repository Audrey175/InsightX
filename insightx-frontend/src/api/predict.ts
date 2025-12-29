export interface PredictionResult {
  filename: string;
  tumor_detected: boolean;
  tumor_size_pixels: {
    core: number;
    enhancing: number;
    whole: number;
  };
  tumor_location: {
    x: number;
    y: number;
  } | null;
  risk_score: number;
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