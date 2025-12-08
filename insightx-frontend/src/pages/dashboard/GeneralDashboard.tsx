import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatCard from "../../components/dashboard/StatCard";
import ConsultationByDepartmentChart from "../../components/dashboard/ConsultationByDepartmentChart";
import DiseaseCategoryChart from "../../components/dashboard/DiseaseCategoryChart";
import {
  fetchDoctorPatients,
  type DoctorPatientListItem,
} from "../../services/doctorService";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const GeneralDashboard: React.FC = () => {
  const [patients, setPatients] = useState<DoctorPatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDoctorPatients()
      .then(setPatients)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalPatients = patients.length;
  const totalBrainCases = patients.length; // 1 brain scan per patient
  const totalHeartCases = patients.length; // 1 heart scan per patient

  const highRiskCount =
    patients.filter((p) => p.brainStress === "High").length +
    patients.filter((p) => p.heartSeverity === "High").length;

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState message={`Unable to load dashboard data: ${error}`} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-slate-900">
          General Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Patients" value={totalPatients} change="+9.5%" />
          <StatCard
            title="Total Brain Cases"
            value={totalBrainCases}
            change="+4.5%"
          />
          <StatCard
            title="Total Heart Cases"
            value={totalHeartCases}
            change="-1.5% in last 7 days"
            changeType="down"
          />
          <StatCard
            title="High-Risk Alerts"
            value={highRiskCount}
            change="+21% in last 7 days"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Consultation By Department
              </h2>
              <select className="text-xs border rounded px-2 py-1">
                <option>Monthly</option>
              </select>
            </div>
            <ConsultationByDepartmentChart />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Diseases Scanned by Category
              </h2>
              <select className="text-xs border rounded px-2 py-1">
                <option>Monthly</option>
              </select>
            </div>
            <DiseaseCategoryChart />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GeneralDashboard;
