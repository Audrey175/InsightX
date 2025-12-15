import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  profileService,
  type PatientProfile,
} from "../../services/profileService";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/button";

const PatientProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [editProfile, setEditProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setEditProfile(null);
      setError("Not authenticated.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    profileService
      .getPatientProfile(user)
      .then((p) => {
        setProfile(p);
        setEditProfile(p);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const handleStartEdit = () => {
    if (!profile) return;
    setEditProfile(profile);
    setIsEditing(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditProfile(profile);
    setIsEditing(false);
    setError(null);
  };

  const handleChange =
    (field: keyof PatientProfile) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editProfile) return;
      const value =
        field === "age" ? Number(e.target.value) || 0 : e.target.value;
      setEditProfile({ ...editProfile, [field]: value as any });
    };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editProfile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result?.toString() ?? null;
      setEditProfile((prev) =>
        prev ? { ...prev, avatarUrl: dataUrl } : prev
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!editProfile) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await profileService.updatePatientProfile(editProfile);
      setProfile(updated);
      setEditProfile(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message ?? "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const activeProfile = isEditing ? editProfile : profile;

  const initials =
    activeProfile?.fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2) ?? "";

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Profile</p>
            <h1 className="text-lg font-semibold text-slate-900">
              Patient Profile
            </h1>
          </div>

          {profile && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="text-xs bg-sky-600 hover:bg-sky-700 text-white"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  className="text-xs bg-sky-600 hover:bg-sky-700 text-white"
                  onClick={handleStartEdit}
                >
                  Edit profile
                </Button>
              )}
            </div>
          )}
        </div>

        {loading && <LoadingState message="Loading profile..." />}

        {error && <ErrorState message={error} />}

        {activeProfile && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-4">
            {/* AVATAR + BASIC INFO */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {activeProfile.avatarUrl ? (
                    <img
                      src={activeProfile.avatarUrl}
                      alt={activeProfile.fullName}
                      className="h-14 w-14 rounded-full object-cover border border-sky-100"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold">
                      {initials}
                    </div>
                  )}

                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="absolute -bottom-1 -right-1 bg-white border border-slate-200 rounded-full px-2 py-0.5 text-[10px] shadow-sm hover:bg-slate-50"
                    >
                      Change
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-500">Patient ID</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {activeProfile.id}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Primary doctor: {activeProfile.primaryDoctorName}
                  </p>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500">
                <p>Age</p>
                <p className="text-lg font-semibold text-slate-900">
                  {activeProfile.age}
                </p>
              </div>
            </div>

            {/* DETAILS GRID */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-1">Full Name</p>
                {isEditing ? (
                  <input
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                    value={editProfile?.fullName ?? ""}
                    onChange={handleChange("fullName")}
                  />
                ) : (
                  <p className="font-medium text-slate-900">
                    {activeProfile.fullName}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Age</p>
                {isEditing ? (
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                    value={editProfile?.age ?? 0}
                    onChange={handleChange("age")}
                  />
                ) : (
                  <p className="font-medium text-slate-900">
                    {activeProfile.age}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Last Scan Date</p>
                {isEditing ? (
                  <input
                    type="date"
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                    value={editProfile?.lastScanDate ?? ""}
                    onChange={handleChange("lastScanDate")}
                  />
                ) : (
                  <p className="font-medium text-slate-900">
                    {activeProfile.lastScanDate}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Primary Doctor</p>
                {isEditing ? (
                  <input
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                    value={editProfile?.primaryDoctorName ?? ""}
                    onChange={handleChange("primaryDoctorName")}
                  />
                ) : (
                  <p className="font-medium text-slate-900">
                    {activeProfile.primaryDoctorName}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientProfilePage;
