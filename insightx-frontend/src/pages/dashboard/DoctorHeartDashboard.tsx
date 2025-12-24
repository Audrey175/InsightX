import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import HeartHero from "../../assets/researchers.png";
import {
  findPatientById,
  getDoctorHeartFor,
  patients,
} from "../../data/fakeDatabase";
import PatientSelector from "../../components/PatientSelector";

const DoctorHeartDashboard: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const patient = findPatientById(patientId) ?? patients[0];
  const data = getDoctorHeartFor(patient.id)!;

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
          <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Cardiac Function</span>
              <span>3D · Heat map · Raw</span>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex items-center justify-center">
                <img
                  src={HeartHero}
                  alt="Heart visualization"
                  className="max-h-56 object-contain"
                />
              </div>

              <div className="w-60 space-y-3 text-xs">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="font-semibold mb-1">Heart Metrics</p>
                  <div className="grid grid-cols-2 text-[11px] text-slate-700 gap-1">
                    <span>BPM</span>
                    <span className="text-right">{data.heartRate}</span>
                    <span>Oxygenation</span>
                    <span className="text-right">{data.oxygen}%</span>
                    <span>Blood Pressure</span>
                    <span className="text-right">{data.pressure}</span>
                    <span>Condition</span>
                    <span className="text-right">{data.condition}</span>
                  </div>
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

          {/* RIGHT */}
          <div className="space-y-4 text-xs">
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold mb-2">Injury details</h2>
              <div className="space-y-1 text-[11px]">
                <p>Region: {data.injury.region}</p>
                <p>Type: {data.injury.type}</p>
                <p>Severity: {data.injury.severity}</p>
                <p>Size: {data.injury.size}</p>
                <p>Imaging Used: {data.injury.imaging.join(", ")}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold mb-2">Potential Risks</h2>
              <ul className="list-disc list-inside text-[11px] space-y-1">
                {data.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold mb-2">Related Cases</h2>
              <ul className="list-disc list-inside text-[11px] space-y-1">
                {data.relatedCases.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorHeartDashboard;
