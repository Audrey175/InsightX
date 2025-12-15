import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { fetchPatientBrainScan, fetchPatientHeartScan } from "../../services/patientService";
import type { PatientBrainRecord } from "../../data/patientBrainData";
import type { PatientHeartRecord } from "../../data/patientHeartData";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function PatientScansOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const patientId = user?.patientId ?? "P-0001";

  const [brain, setBrain] = useState<PatientBrainRecord | null>(null);
  const [heart, setHeart] = useState<PatientHeartRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([fetchPatientBrainScan(patientId), fetchPatientHeartScan(patientId)])
      .then(([brainScan, heartScan]) => {
        setBrain(brainScan);
        setHeart(heartScan);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading your scans..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState message={error} />
      </DashboardLayout>
    );
  }

  const cards = [
    {
      title: "Brain",
      available: !!brain,
      onOpen: () => navigate("/dashboard/patient/brain"),
      description: brain ? "Latest brain scan available." : "No brain scan uploaded yet.",
    },
    {
      title: "Heart",
      available: !!heart,
      onOpen: () => navigate("/dashboard/patient/heart"),
      description: heart ? "Latest heart scan available." : "No heart scan uploaded yet.",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold">My Scans</h1>
            <p className="text-sm text-slate-600">
              Check availability for your brain and heart scans.
            </p>
          </div>
          <Link
            to="/dashboard/patient/history"
            className="px-4 py-2 rounded-md text-sm border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            View History
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div key={card.title} className="bg-white border rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">{card.title} Scan</h2>
                  <p className="text-xs text-slate-500">{card.description}</p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    card.available
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {card.available ? "Available" : "No data"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  disabled={!card.available}
                  onClick={card.available ? card.onOpen : undefined}
                  className={`px-4 py-2 rounded-md text-sm ${
                    card.available
                      ? "bg-sky-600 text-white hover:bg-sky-700"
                      : "bg-slate-100 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {card.available ? `Open ${card.title} Dashboard` : "No data"}
                </button>
                <Link
                  to="/assistant"
                  className="px-4 py-2 rounded-md text-sm border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Ask AI Assistant
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
