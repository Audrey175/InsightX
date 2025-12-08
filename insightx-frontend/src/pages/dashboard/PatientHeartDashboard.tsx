import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import HeartHero from "../../assets/researchers.png";
import { fetchPatientHeartScan } from "../../services/patientService";
import type { PatientHeartRecord } from "../../data/patientHeartData";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const DEFAULT_PATIENT_ID = "P-0001";

const PatientHeartDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PatientHeartRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const patientId = user?.patientId ?? DEFAULT_PATIENT_ID;
    setLoading(true);
    setError(null);
    fetchPatientHeartScan(patientId)
      .then((record) => {
        if (!record) {
          setError("No heart scan data found.");
        }
        setData(record);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading your heart scan..." />
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <ErrorState message={error ?? "No heart scan data found."} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Your Heart Scan Overview</h1>
          <p className="text-xs text-slate-500">Scan ID: {data.scanId}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">
          <div className="flex gap-6">
            <div className="flex-1 flex items-center justify-center">
              <img src={HeartHero} className="max-h-64 object-contain" />
            </div>

            <div className="w-60 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="font-semibold mb-1">Heart Stats</p>
                <div className="grid grid-cols-2 text-[11px] text-slate-700 gap-1">
                  <span>BPM</span>
                  <span className="text-right">{data.bpm}</span>
                  <span>Oxygen Level</span>
                  <span className="text-right">{data.oxygen}%</span>
                  <span>Stress Level</span>
                  <span className="text-right">{data.stress}</span>
                  <span>Blood Pressure</span>
                  <span className="text-right">{data.pressure}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="font-semibold mb-1">Condition</p>
                <p className="text-[11px]">{data.condition}</p>
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
          <h2 className="text-sm font-semibold">Doctor Notes</h2>
          <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1 mt-2">
            {data.doctorNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientHeartDashboard;
