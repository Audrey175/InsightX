export interface MRIPredictionResult {
  modality: "medical_volume";
  input_type: "dicom_zip";

  series_used: string;
  series_detected: number;

  volume_shape: {
    depth: number;
    height: number;
    width: number;
  };

  voxel_spacing: [number, number, number];

  // Change this from reconstruction_image to reconstruction_file
  reconstruction_file: string; 

  reconstruction: {
    status: "success" | "failed";
    method: "VTK GPU Volume Rendering";
  };

  statistics: {
    mean_intensity: number;
    max_intensity: number;
  };

  disclaimer: string;
}

export async function predictMRI(
  file: File
): Promise<MRIPredictionResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://localhost:8000/predict/mri", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `MRI analysis failed (${response.status}): ${errorText}`
    );
  }

  return response.json();
}