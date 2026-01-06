// import React, { useState} from "react";
import { predictXRay } from "../../api/xray_predict";
import type { XRayPredictionResult } from "../../api/xray_predict";
// import { useParams, useNavigate } from "react-router-dom";
// import HeartHero from "../../assets/researchers.png";
import {
  findPatientById,
  getDoctorHeartFor,
  patients,
} from "../../data/fakeDatabase";
import React, { useState } from "react";
import {  useNavigate, useParams } from "react-router-dom";
// import { jsPDF } from "jspdf";
import DashboardLayout from "../../layouts/DashboardLayout";
// import HeartHero from "../../assets/researchers.png";
import PatientSelector from "../../components/PatientSelector";
// import { fetchDoctorHeartScan } from "../../services/doctorService";
// import type { DoctorHeartScanRecord } from "../../data/doctorHeartData";
// import { LoadingState } from "../../components/ui/LoadingState";
// import { ErrorState } from "../../components/ui/ErrorState";
// import { getLatestDoneSession, getSession } from "../../services/localScanStore";
// import { findPatientById } from "../../data/fakeDatabase";


const DoctorHeartDashboard: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();

  const navigate = useNavigate();

  const patient = findPatientById(patientId) ?? patients[0];
  const data = getDoctorHeartFor(patient.id)!;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<XRayPredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleXrayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setSelectedImage(URL.createObjectURL(file));
  setLoading(true);
  setError(null);

  try {
    const result = await predictXRay(file);
    console.log("X-RAY RESULT:", result);
    setPrediction(result);
  } catch {
    setError("Failed to analyze X-ray.");
  } finally {
    setLoading(false);
  }
};

  return (
    <DashboardLayout>
      <div className="space-y-4 min-w-0">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">
              Home &gt; Personal Dashboard &gt; {data.scanId}
            </p>
            <h1 className="text-lg font-semibold mt-1">{patient.name}</h1>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded-full bg-sky-600 text-white">
                Heart
              </button>
              <button
                onClick={() =>
                  navigate(`/dashboard/doctor/brain/${patient.id}`)
                }
                className="px-3 py-1 rounded-full border text-slate-600"
              >
                Brain
              </button>
            </div>

            <PatientSelector currentId={patient.id} organ="heart" />

            <div className="h-8 w-8 rounded-full bg-amber-300 flex items-center justify-center text-xs font-bold">
              {patient.avatar}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)] gap-4">
          {/* LEFT */}
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <div className="flex justify-between text-xs text-slate-500">
              <h2 className="font-semibold mb-2">Upload Chest X-ray</h2>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleXrayUpload}
              className="text-xs"
            />

            {selectedImage && ( 
              <img src={selectedImage} 
              alt="Uploaded Xray" 
              className="mt-2 h-32 object-contain rounded" 
              /> 
            )}

             {loading && (
              <p className="text-xs text-slate-500 mt-2">
                Analyzing X-ray...
              </p>
            )}

            {error && (
              <p className="text-xs text-red-500 mt-2">
                {error}
              </p>
            )}
            
          </div>

          {/* RIGHT */}
          {prediction && (
            <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-2 text-xs">
              <h2 className="font-semibold text-sm">X-ray AI Analysis</h2>

              <p>
                <strong>File:</strong> {prediction.filename}
              </p>

              <p>
                <strong>Modality:</strong> {prediction.modality.toUpperCase()}
              </p>

              <p>
                <strong>Prediction:</strong>{" "}
                <span
                  className={
                    prediction.prediction.label === "PNEUMONIA"
                      ? "text-red-600 font-semibold"
                      : "text-green-600 font-semibold"
                  }
                >
                  {prediction.prediction.label}
                </span>
              </p>

              <p>
                <strong>Confidence:</strong>{" "}
                {(prediction.prediction.confidence * 100).toFixed(1)}%
              </p>

              <p>
                <strong>Risk Level:</strong>{" "}
                <span className="capitalize">
                  {prediction.prediction.risk_level}
                </span>
              </p>

              <div className="mt-2">
                <p className="font-semibold">Probabilities</p>
                <ul className="ml-3 list-disc">
                  <li>
                    NORMAL: {(prediction.prediction.probabilities.NORMAL * 100).toFixed(1)}%
                  </li>
                  <li>
                    PNEUMONIA:{" "}
                    {(prediction.prediction.probabilities.PNEUMONIA * 100).toFixed(1)}%
                  </li>
                </ul>
              </div>

              <div className="mt-2">
                <p className="font-semibold">Model Information</p>
                <p>Architecture: {prediction.model_info.architecture}</p>
                <p>Version: {prediction.model_info.version}</p>
              </div>

              <p className="text-[10px] text-slate-400 mt-3">
                {prediction.disclaimer}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorHeartDashboard;