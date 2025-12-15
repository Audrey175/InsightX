import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { patients } from "../../data/fakeDatabase";
import { Button } from "../../components/ui/button";

export default function DoctorUploadHubPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const isDoctor = user?.role === "doctor";

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
    );
  }, [q]);

  if (!isDoctor) {
    return (
      <DashboardLayout>
        <div className="bg-white border rounded-2xl p-6 max-w-xl">
          <h1 className="text-lg font-semibold">Access denied</h1>
          <p className="text-sm text-slate-600 mt-2">
            This page is for doctors only.
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate("/dashboard", { replace: true })}
          >
            Back to Home
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 min-w-0">
        <div>
          <h1 className="text-lg font-semibold">Upload Scan</h1>
          <p className="text-sm text-slate-600">
            Select a patient to upload a scan.
          </p>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by patient name or ID..."
          className="border rounded px-3 py-2 w-full max-w-md text-sm"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white border rounded-2xl p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium text-slate-900 truncate">
                  {p.name}
                </div>
                <div className="text-xs text-slate-500">{p.id}</div>
              </div>
              <Button
                onClick={() => navigate(`/dashboard/doctor/upload/${p.id}`)}
                className="bg-sky-600 hover:bg-sky-700"
              >
                Upload
              </Button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-sm text-slate-600">No patients found.</div>
        )}
      </div>
    </DashboardLayout>
  );
}
