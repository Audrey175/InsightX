import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import HeartHero from "../../assets/researchers.png";
import PatientSelector from "../../components/PatientSelector";
import { fetchDoctorHeartScan } from "../../services/doctorService";
import type { DoctorHeartScanRecord } from "../../data/doctorHeartData";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const DoctorHeartDashboard: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [scan, setScan] = useState<DoctorHeartScanRecord | null>(null);
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
    fetchDoctorHeartScan(patientId)
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
        <LoadingState message="Loading heart scan..." />
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
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded-full bg-sky-600 text-white">
                Heart
              </button>
              <button
                onClick={() => handleNavigate("brain")}
                className="px-3 py-1 rounded-full border text-slate-600"
              >
                Brain
              </button>
            </div>

            <PatientSelector currentId={scan.patientId} organ="heart" />

            <div className="h-8 w-8 rounded-full bg-amber-300 flex items-center justify-center text-xs font-bold">
              {scan.avatar}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)] gap-4">
          {/* LEFT */}
          <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Cardiac Function</span>
              <span>3D | Heat map | Raw</span>
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
                    <span className="text-right">{scan.heartRate}</span>
                    <span>Oxygenation</span>
                    <span className="text-right">{scan.oxygen}%</span>
                    <span>Blood Pressure</span>
                    <span className="text-right">{scan.pressure}</span>
                    <span>Condition</span>
                    <span className="text-right">{scan.condition}</span>
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
                <p>Region: {scan.injury.region}</p>
                <p>Type: {scan.injury.type}</p>
                <p>Severity: {scan.injury.severity}</p>
                <p>Size: {scan.injury.size}</p>
                <p>Imaging Used: {scan.injury.imaging.join(", ")}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold mb-2">Potential Risks</h2>
              <ul className="list-disc list-inside text-[11px] space-y-1">
                {scan.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold mb-2">Related Cases</h2>
              <ul className="list-disc list-inside text-[11px] space-y-1">
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

export default DoctorHeartDashboard;
