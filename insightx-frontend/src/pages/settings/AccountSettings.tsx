import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("All password fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <h1 className="text-lg font-semibold">Account</h1>

      <div className="text-sm text-slate-600">
        <div>
          <span className="font-medium">Name:</span>{" "}
          {user?.fullName || "N/A"}
        </div>
        <div>
          <span className="font-medium">Email:</span> {user?.email || "N/A"}
        </div>
        <div>
          <span className="font-medium">Role:</span> {user?.role || "N/A"}
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <h2 className="text-sm font-semibold">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-2 text-sm">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full rounded border border-slate-200 px-3 py-2"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded border border-slate-200 px-3 py-2"
          />
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded border border-slate-200 px-3 py-2"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-emerald-600">{success}</p>}
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-2 rounded bg-sky-600 text-white disabled:bg-slate-200 disabled:text-slate-500"
          >
            {saving ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>

      <div className="pt-2 border-t">
        <button
          onClick={logout}
          className="px-3 py-2 rounded bg-slate-900 text-white"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
