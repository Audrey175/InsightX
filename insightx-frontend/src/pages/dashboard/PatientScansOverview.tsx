import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { listScans } from "../../services/scanService";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Brain, Heart, ChevronRight, Activity, Clock } from "lucide-react";
import type { ApiScan } from "../../types/scan";

export default function PatientScansOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const patientId = user?.patientId;

  const [scans, setScans] = useState<ApiScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch real scans from the database
        const data = await listScans({ patient_id: patientId });
        setScans(data);
      } catch (err: any) {
        setError("Could not retrieve scan availability.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId]);

  // Logic to find the latest of each type
  const latestBrain = scans.find(s => s.modality?.toLowerCase() === "mri");
  // Assuming 'heart' scans might be X-ray or specific heart modality
  const latestHeart = scans.find(s => s.modality?.toLowerCase() === "xray"); 

  if (loading) return <DashboardLayout><LoadingState message="Syncing with clinical database..." /></DashboardLayout>;
  if (error) return <DashboardLayout><ErrorState message={error} /></DashboardLayout>;

  const scanCategories = [
    {
      title: "Brain",
      id: "brain",
      icon: <Brain className="w-6 h-6 text-purple-600" />,
      latest: latestBrain,
      route: "/dashboard/patient/brain",
      color: "bg-purple-50",
    },
    {
      title: "Heart",
      id: "heart",
      icon: <Heart className="w-6 h-6 text-rose-600" />,
      latest: latestHeart,
      route: "/dashboard/patient/heart",
      color: "bg-rose-50",
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Health Overview</h1>
            <p className="text-slate-500 text-sm">Welcome back, {user?.fullName}. Here is your latest diagnostic status.</p>
          </div>
          <Link to="/dashboard/patient/history" className="text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
            View Full History <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Diagnostic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scanCategories.map((cat) => (
            <div key={cat.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[220px]">
              <div className="flex justify-between items-start">
                <div className={`${cat.color} p-3 rounded-2xl`}>
                  {cat.icon}
                </div>
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${cat.latest ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {cat.latest ? "Records Found" : "No Data"}
                </span>
              </div>

              <div className="mt-4">
                <h2 className="text-xl font-bold text-slate-900">{cat.title} Analysis</h2>
                {cat.latest ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Activity className="w-3 h-3" /> 
                      Latest Result: <span className="font-bold text-slate-900 uppercase">
                        {cat.latest.ai_result?.classification?.tumor_type || "Completed"}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> 
                      {new Date(cat.latest.created_at || "").toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mt-2 italic">You haven't uploaded a {cat.title.toLowerCase()} scan yet.</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex gap-3">
                <button
                  onClick={() => navigate(cat.route)}
                  className="flex-1 bg-slate-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-black transition-colors"
                >
                  {cat.latest ? "View Dashboard" : "Upload Scan"}
                </button>
                <Link to="/assistant" className="flex-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl text-center hover:bg-slate-50">
                  Ask AI
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats Summary */}
        <div className="bg-sky-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="z-10 text-center md:text-left">
            <h3 className="text-lg font-bold">Total Recorded Scans</h3>
            <p className="text-sky-200 text-sm opacity-80">All modalities combined across your medical history</p>
          </div>
          <div className="z-10 text-5xl font-black text-sky-400">
            {scans.length.toString().padStart(2, '0')}
          </div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-800 rounded-full opacity-50 blur-3xl" />
        </div>
      </div>
    </DashboardLayout>
  );
}