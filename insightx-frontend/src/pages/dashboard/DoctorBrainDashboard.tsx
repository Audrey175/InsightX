import React, { useState} from "react";
import { predictMRI } from "../../api/predict";
import type { PredictionResult } from "../../api/predict";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import BrainHero from "../../assets/brainhome.png";
import {
  findPatientById,
  getDoctorBrainFor,
  patients,
} from "../../data/fakeDatabase";
import PatientSelector from "../../components/PatientSelector";

const DoctorBrainDashboard: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const patient = findPatientById(patientId) ?? patients[0];
  const data = getDoctorBrainFor(patient.id)!;
  
  const [selectedImage, setSelectedImage] = useState <string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult  | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleMRIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(URL.createObjectURL(file));
    setPrediction(null);
    setError(null);
    setLoading(true)

    try {
    const result = await predictMRI(file);
    console.log("API RESULT:", result);   // ← DEBUG
    setPrediction(result);
    } catch {
      setError("Failed to analyze MRI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">
              Home &gt; Personal Dashboard &gt; {data.scanId}
            </p>
            <h1 className="text-lg font-semibold mt-1">{patient.name}</h1>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Organ switch */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  navigate(`/dashboard/doctor/heart/${patient.id}`)
                }
                className="px-3 py-1 rounded-full border text-slate-600"
              >
                Heart
              </button>
              <button className="px-3 py-1 rounded-full bg-sky-600 text-white">
                Brain
              </button>
            </div>

            {/* Patient selector */}
            <PatientSelector currentId={patient.id} organ="brain" />

            <div className="h-8 w-8 rounded-full bg-amber-300 flex items-center justify-center text-xs font-bold">
              {patient.avatar}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)] gap-4">
          {/* LEFT PANEL */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mt-2">
            <h2 className="text-xs font-semibold text-slate-700 mb-2">AI MRI Diagnosis</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleMRIUpload}
              className="text-xs"
            />

            {selectedImage && (
              <img
                src={selectedImage}
                alt="Uploaded MRI"
                className="mt-2 h-32 object-contain rounded"
              />
            )}

            {loading && (
              <p className="text-blue-600 font-medium">Analyzing MRI...</p>
            )}

            {error && (
              <p className="text-red-600 font-medium">{error}</p>
            )}

            {prediction && (
              <div className="bg-slate-100 p-4 rounded-xl mt-4">
                <h3 className="font-semibold text-slate-800 mb-2">Diagnosis Result</h3>
                <p><strong>Image:</strong> {prediction.filename}</p>
                <p><strong>Prediction:</strong> {prediction.prediction}</p>
                <p><strong>Confidence:</strong> {prediction.confidence}%</p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Cognitive Activity</span>
              <span>3D · Heat map · Raw</span>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex items-center justify-center">
                <img
                  src={BrainHero}
                  alt="Brain visualization"
                  className="max-h-56 object-contain"
                />
              </div>

              <div className="w-60 space-y-3 text-xs">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="font-semibold text-slate-700 mb-1">
                    Cognitive Activity
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                    <span>Brain Oxygenation (SO₂)</span>
                    <span className="text-right">{data.oxygenation}%</span>
                    <span>Stress Level</span>
                    <span className="text-right">{data.stress}</span>
                    <span>Focus Index</span>
                    <span className="text-right">{data.focus}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="font-semibold text-slate-700 mb-1">
                    Cognitive Performance
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {data.performanceScore} / 100 · Normal
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 text-xs">
              <button className="px-4 py-1.5 rounded-full bg-sky-700 text-white font-medium">
                3D
              </button>
              <button className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700">
                Heat map
              </button>
              <button className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700">
                Raw
              </button>
            </div>
          </div>

          {/* RIGHT PANELS */}
          <div className="space-y-4 text-xs">
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold text-slate-800 mb-2">
                Injury details
              </h2>
              <div className="space-y-1 text-[11px] text-slate-700">
                <p>Injury Location: {data.injury.location}</p>
                <p>Injury Type: {data.injury.type}</p>
                <p>Injury Size: {data.injury.size}</p>
                <p>Edema Volume: {data.injury.edema}</p>
                <p>Imaging Used: {data.injury.imaging.join(", ")}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold text-slate-800 mb-2">
                Potential risk
              </h2>
              <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1">
                {data.risks.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold text-slate-800 mb-2">
                Related cases
              </h2>
              <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1">
                {data.relatedCases.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorBrainDashboard;
