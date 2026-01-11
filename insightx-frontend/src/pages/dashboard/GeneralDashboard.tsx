import { useEffect, useState } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  FileText, 
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import RiskDistributionChart from '../../components/dashboard/RiskDistributionChart';
import ScanCoverageChart from '../../components/dashboard/ScanCoverageChart';
import { USE_MOCK, apiClient } from '../../services/api';
import { LoadingState } from "../../components/ui/LoadingState";

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
        setLoading(true);
        // This hits your FastAPI route we discussed earlier
        const response = await apiClient.get('/api/dashboard/stats');
        setData(response.data);
      } catch (err) {
        setError("Failed to sync dashboard with clinical database.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <DashboardLayout><LoadingState message="Aggregating clinical data..." /></DashboardLayout>;
  if (error) return <DashboardLayout><div className="p-8 text-rose-500 font-medium">{error}</div></DashboardLayout>;
  if (!data) return null;

  const { stats, riskDistribution, scanCoverage, recentScans } = data;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Overview</h1>
          <p className="text-slate-500 text-sm">Real-time health analytics and scan processing status.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Patients"
            value={stats.totalPatients.toLocaleString()}
            icon={Users} 
            trend="Live Database"
            trendUp={true}
          />
          <StatCard
            title="Critical Cases"
            value={stats.criticalCases.toLocaleString()}
            icon={AlertTriangle}
            trend="High Risk Identified"
            trendUp={false}
          />
          <StatCard
            title="Active Pipeline"
            value={stats.activeScans.toLocaleString()}
            icon={Activity}
            trend="Currently Processing"
            trendUp={true}
          />
          <StatCard
            title="System Scans"
            value={stats.totalScans.toLocaleString()}
            icon={FileText}
            trend="All Modalities"
            trendUp={true}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Pathology Distribution</h3>
             <RiskDistributionChart data={riskDistribution.map(i => ({ label: i.name, value: i.value }))} />
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Modality Coverage</h3>
             <ScanCoverageChart data={scanCoverage.map(i => ({ label: i.subject, value: i.A }))} />
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Recent Diagnostic Activity</h2>
            <button className="text-xs font-bold text-sky-600 hover:text-sky-700 uppercase tracking-widest">View All Scans</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Patient / Type</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4 text-center">AI Status</th>
                  <th className="px-6 py-4 text-right">Risk Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentScans.map((scan) => {
                  const isDone = ["completed", "predicted"].includes(scan.status.toLowerCase());
                  const isHighRisk = scan.risk?.toLowerCase().includes("high");

                  return (
                    <tr key={scan.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isHighRisk ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'}`}>
                            <Brain className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{scan.patient_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{scan.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          {scan.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          isDone ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700 animate-pulse"
                        }`}>
                          {scan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs font-bold ${isHighRisk ? 'text-rose-600' : 'text-slate-500'}`}>
                          {scan.risk || 'Low'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GeneralDashboard;