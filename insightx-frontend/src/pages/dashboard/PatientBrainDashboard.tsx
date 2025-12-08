import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import BrainHero from "../../assets/brainhome.png";
import { fetchPatientBrainScan } from "../../services/patientService";
import type { PatientBrainRecord } from "../../data/patientBrainData";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const DEFAULT_PATIENT_ID = "P-0001";

const PatientBrainDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PatientBrainRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const patientId = user?.patientId ?? DEFAULT_PATIENT_ID;
    setLoading(true);
    setError(null);
    fetchPatientBrainScan(patientId)
      .then((record) => {
        if (!record) {
          setError("No brain scan data found.");
        }
        setData(record);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading your brain scan..." />
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <ErrorState message={error ?? "No brain scan data found."} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Your Brain Scan Overview</h1>
          <p className="text-xs text-slate-500">Scan ID: {data.scanId}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">
          <div className="flex gap-6">
            <div className="flex-1 flex items-center justify-center">
              <img src={BrainHero} className="max-h-64 object-contain" />
            </div>

            <div className="w-60 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="font-semibold mb-1">Your Cognitive Stats</p>
                <div className="grid grid-cols-2 text-[11px] text-slate-700 gap-1">
                  <span>Oxygenation</span>
                  <span className="text-right">{data.oxygenation}%</span>
                  <span>Stress Level</span>
                  <span className="text-right">{data.stress}</span>
                  <span>Focus</span>
                  <span className="text-right">{data.focus}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="font-semibold mb-1">Cognitive Score</p>
                <p className="text-[11px]">{data.score} / 100</p>
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

        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <h2 className="text-sm font-semibold">Doctor's Summary</h2>
          <p className="mt-1 text-[11px] text-slate-700">{data.doctorSummary}</p>

          <h3 className="mt-3 text-xs font-semibold">Detailed Notes</h3>
          <ul className="list-disc list-inside mt-1 text-[11px] text-slate-700 space-y-1">
            {data.doctorNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientBrainDashboard;
