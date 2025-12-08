import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import BrainHero from "../../assets/brainhome.png";
import PatientSelector from "../../components/PatientSelector";
import { fetchDoctorBrainScan } from "../../services/doctorService";
import type { DoctorBrainScanRecord } from "../../data/doctorBrainData";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const DoctorBrainDashboard: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [scan, setScan] = useState<DoctorBrainScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setError("Patient not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetchDoctorBrainScan(patientId)
      .then((record) => {
        if (!record) {
          setError("Patient not found.");
        }
        setScan(record);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [patientId]);

  const handleNavigate = (target: "brain" | "heart") => {
    const targetId = patientId ?? scan?.patientId ?? "";
    if (targetId) {
      navigate(`/dashboard/doctor/${target}/${targetId}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading brain scan..." />
      </DashboardLayout>
    );
  }

  if (error || !scan) {
    return (
      <DashboardLayout>
        <ErrorState
          message={error ?? "Patient not found."}
          actionLabel="Go to patient list"
          onAction={() => navigate("/dashboard/doctor/patients")}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">
              Home &gt; Personal Dashboard &gt; {scan.scanId}
            </p>
            <h1 className="text-lg font-semibold mt-1">{scan.patientName}</h1>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Organ switch */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavigate("heart")}
                className="px-3 py-1 rounded-full border text-slate-600"
              >
                Heart
              </button>
              <button className="px-3 py-1 rounded-full bg-sky-600 text-white">
                Brain
              </button>
            </div>

            <PatientSelector currentId={scan.patientId} organ="brain" />

            <div className="h-8 w-8 rounded-full bg-amber-300 flex items-center justify-center text-xs font-bold">
              {scan.avatar}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)] gap-4">
          {/* LEFT PANEL */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Cognitive Activity</span>
              <span>3D | Heat map | Raw</span>
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
                    <span>Brain Oxygenation (SO2)</span>
                    <span className="text-right">{scan.oxygenation}%</span>
                    <span>Stress Level</span>
                    <span className="text-right">{scan.stress}</span>
                    <span>Focus Index</span>
                    <span className="text-right">{scan.focus}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="font-semibold text-slate-700 mb-1">
                    Cognitive Performance
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {scan.performanceScore} / 100
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
                <p>Injury Location: {scan.injury.location}</p>
                <p>Injury Type: {scan.injury.type}</p>
                <p>Injury Size: {scan.injury.size}</p>
                <p>Edema Volume: {scan.injury.edema}</p>
                <p>Imaging Used: {scan.injury.imaging.join(", ")}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold text-slate-800 mb-2">
                Potential risk
              </h2>
              <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1">
                {scan.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold text-slate-800 mb-2">
                Related cases
              </h2>
              <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1">
                {scan.relatedCases.map((relatedCase) => (
                  <li key={relatedCase}>{relatedCase}</li>
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
