import { useAuth } from "../../context/AuthContext";

export default function AccountSettings() {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <h1 className="text-lg font-semibold">Account</h1>

      <div className="text-sm text-slate-600">
        <div>
          <span className="font-medium">Name:</span>{" "}
          {user?.fullName || "—"}
        </div>
        <div>
          <span className="font-medium">Email:</span> {user?.email || "—"}
        </div>
        <div>
          <span className="font-medium">Role:</span> {user?.role || "—"}
        </div>
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
