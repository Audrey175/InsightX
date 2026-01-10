import { useEffect, useState } from 'react';
import { 
  Users, // Added missing import
  AlertTriangle, 
  Activity, 
  FileText, 
  Brain 
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import RiskDistributionChart from '../../components/dashboard/RiskDistributionChart';
import ScanCoverageChart from '../../components/dashboard/ScanCoverageChart';
import { USE_MOCK, simulateRequest, apiClient } from '../../services/api';

// 1. Define the API response shape
interface DashboardData {
  stats: {
    totalPatients: number;
    totalScans: number;
    activeScans: number;
    criticalCases: number;
  };
  riskDistribution: Array<{ name: string; value: number }>;
  scanCoverage: Array<{ subject: string; A: number; fullMark: number }>;
  recentScans: Array<{
    id: number;
    patient_name: string;
    type: string;
    date: string;
    status: string;
    risk: string;
  }>;
}

const mockDashboardData: DashboardData = {
  stats: {
    totalPatients: 128,
    totalScans: 342,
    activeScans: 9,
    criticalCases: 6,
  },
  riskDistribution: [
    { name: "Low", value: 180 },
    { name: "Medium", value: 120 },
    { name: "High", value: 42 },
  ],
  scanCoverage: [
    { subject: "MRI", A: 140, fullMark: 150 },
    { subject: "Xray", A: 120, fullMark: 150 },
    { subject: "CT", A: 82, fullMark: 150 },
  ],
  recentScans: [
    {
      id: 1,
      patient_name: "Mock Patient A",
      type: "MRI",
      date: "2025-01-08",
      status: "Processing",
      risk: "Medium",
    },
    {
      id: 2,
      patient_name: "Mock Patient B",
      type: "Xray",
      date: "2025-01-07",
      status: "Completed",
      risk: "Low",
    },
  ],
};

const GeneralDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (USE_MOCK) {
          const mock = await simulateRequest(() => mockDashboardData, 200);
          if (!active) return;
          setData(mock);
          return;
        }
        const response = await apiClient.get('/api/dashboard/stats');
        if (!active) return;
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError("Failed to load dashboard data.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>{error}</div>;
  if (!data) return null;

  const { stats, riskDistribution, scanCoverage, recentScans } = data;

  // 2. Transform data for charts
  // The chart expects 'label' but API gives 'name'
  const riskChartData = riskDistribution.map(item => ({
    label: item.name,
    value: item.value
  }));

  // The chart expects 'label'/'value' but API gives 'subject'/'A'
  const coverageChartData = scanCoverage.map(item => ({
    label: item.subject,
    value: item.A
  }));

  return (
    // FIXED: Removed 'role' prop
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Patients"
            value={stats.totalPatients.toString()}
            icon={Users} 
            trend="+12% from last month"
            trendUp={true}
          />
          <StatCard
            title="Critical Cases"
            value={stats.criticalCases.toString()}
            icon={AlertTriangle}
            trend="+2 new today"
            trendUp={false}
          />
          <StatCard
            title="Active Scans"
            value={stats.activeScans.toString()}
            icon={Activity}
            trend="5 processing"
            trendUp={true}
          />
          <StatCard
            title="Total Scans"
            value={stats.totalScans.toString()}
            icon={FileText}
            trend="+8% from last month"
            trendUp={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FIXED: Passed transformed data */}
          <RiskDistributionChart data={riskChartData} />
          <ScanCoverageChart data={coverageChartData} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Recent Scans</h2>
          <div className="space-y-4">
            {recentScans.map((scan) => {
              const statusRaw = String(scan.status || "");
              const statusNormalized = statusRaw.toLowerCase();
              const statusLabel =
                statusNormalized === "predicted" || statusNormalized === "completed"
                  ? "Completed"
                  : statusNormalized === "processing" || statusNormalized === "uploaded"
                  ? "Processing"
                  : statusRaw || "Unknown";

              const riskRaw = String(scan.risk || "");
              const riskLabel = riskRaw
                ? riskRaw.charAt(0).toUpperCase() + riskRaw.slice(1)
                : "Unknown";
              const riskNormalized = riskLabel.toLowerCase();

              return (
                <div key={scan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{scan.patient_name}</p>
                      <p className="text-sm text-gray-500">{scan.type} - {scan.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusLabel === "Completed" ? "bg-green-100 text-green-700" :
                      statusLabel === "Processing" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {statusLabel}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      riskNormalized === "high" ? "bg-red-100 text-red-700" :
                      riskNormalized === "medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {riskLabel} Risk
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GeneralDashboard;
