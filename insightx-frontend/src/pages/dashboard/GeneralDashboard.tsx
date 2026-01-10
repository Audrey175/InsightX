import React, { useEffect, useState } from 'react';
import axios from 'axios'; // Ensure axios is imported
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

const GeneralDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/dashboard/stats');
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
            {recentScans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{scan.patient_name}</p>
                    <p className="text-sm text-gray-500">{scan.type} • {scan.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    scan.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    scan.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {scan.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    scan.risk === 'High' ? 'bg-red-100 text-red-700' :
                    scan.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {scan.risk} Risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GeneralDashboard;