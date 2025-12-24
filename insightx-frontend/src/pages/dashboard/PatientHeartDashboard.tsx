import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import HeartHero from "../../assets/researchers.png";
import { getPatientHeartFor } from "../../data/fakeDatabase";

const PatientHeartDashboard: React.FC = () => {
  const data = getPatientHeartFor("P-0001");

  if (!data) {
    return (
      <DashboardLayout>
        <p className="text-sm text-red-500">No heart scan data found.</p>
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
            {data.doctorNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientHeartDashboard;
