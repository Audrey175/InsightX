import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  profileService,
  type PatientProfile,
} from "../../services/profileService";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const PatientProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setError("Not authenticated.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    profileService
      .getPatientProfile(user)
      .then(setProfile)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-500">Profile</p>
          <h1 className="text-lg font-semibold text-slate-900">
            Patient Profile
          </h1>
        </div>

        {loading && <LoadingState message="Loading profile..." />}

        {error && <ErrorState message={error} />}

        {profile && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Patient ID</p>
                <p className="text-sm font-semibold text-slate-900">
                  {profile.id}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold">
                {profile.fullName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Full Name</p>
                <p className="font-medium text-slate-900">{profile.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Age</p>
                <p className="font-medium text-slate-900">{profile.age}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Scan Date</p>
                <p className="font-medium text-slate-900">
                  {profile.lastScanDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Primary Doctor</p>
                <p className="font-medium text-slate-900">
                  {profile.primaryDoctorName}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientProfilePage;
