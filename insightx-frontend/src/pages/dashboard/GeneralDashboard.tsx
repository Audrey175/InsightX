import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatCard from "../../components/dashboard/StatCard";
import ScanCoverageChart from "../../components/dashboard/ScanCoverageChart";
import RiskDistributionChart from "../../components/dashboard/RiskDistributionChart";

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

  const stats = useMemo(() => {
    const totalPatients = patients.length;

    const totalBrainCases = patients.filter((p) => !!p.hasBrain).length;
    const totalHeartCases = patients.filter((p) => !!p.hasHeart).length;

    const highRiskCount =
      patients.filter((p) => p.brainStress === "High").length +
      patients.filter((p) => p.heartSeverity === "High").length;

    return { totalPatients, totalBrainCases, totalHeartCases, highRiskCount };
  }, [patients]);

  const scanCoverageData = useMemo(() => {
    const brain = patients.filter((p) => !!p.hasBrain).length;
    const heart = patients.filter((p) => !!p.hasHeart).length;

    return [
      { label: "Brain scans available", value: brain },
      { label: "Heart scans available", value: heart },
      { label: "Missing brain scans", value: patients.length - brain },
      { label: "Missing heart scans", value: patients.length - heart },
    ];
  }, [patients]);

  const riskDistributionData = useMemo(() => {
    const brainLow = patients.filter((p) => p.brainStress === "Low").length;
    const brainNormal = patients.filter((p) => p.brainStress === "Normal").length;
    const brainHigh = patients.filter((p) => p.brainStress === "High").length;

    const heartLow = patients.filter((p) => p.heartSeverity === "Low").length;
    const heartModerate = patients.filter((p) => p.heartSeverity === "Moderate").length;
    const heartHigh = patients.filter((p) => p.heartSeverity === "High").length;

    return [
      { label: "Brain risk: Low", value: brainLow },
      { label: "Brain risk: Normal", value: brainNormal },
      { label: "Brain risk: High", value: brainHigh },
      { label: "Heart severity: Low", value: heartLow },
      { label: "Heart severity: Moderate", value: heartModerate },
      { label: "Heart severity: High", value: heartHigh },
    ];
  }, [patients]);

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
      <div className="space-y-6 min-w-0">
        <h1 className="text-lg font-semibold text-slate-900">General Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Patients" value={stats.totalPatients} change="+9.5%" />
          <StatCard title="Total Brain Cases" value={stats.totalBrainCases} change="+4.5%" />
          <StatCard
            title="Total Heart Cases"
            value={stats.totalHeartCases}
            change="-1.5% in last 7 days"
            changeType="down"
          />
          <StatCard
            title="High-Risk Alerts"
            value={stats.highRiskCount}
            change="+21% in last 7 days"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Scan Coverage Overview
              </h2>
              <select className="text-xs border rounded px-2 py-1">
                <option>All time</option>
              </select>
            </div>
            <div className="min-w-[320px]">
              <ScanCoverageChart data={scanCoverageData} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Risk Distribution
              </h2>
              <select className="text-xs border rounded px-2 py-1">
                <option>All time</option>
              </select>
            </div>
            <div className="min-w-[320px]">
              <RiskDistributionChart data={riskDistributionData} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GeneralDashboard;
