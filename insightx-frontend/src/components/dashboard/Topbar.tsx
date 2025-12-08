import React from "react";
import { useAuth } from "../../context/AuthContext";

const Topbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6">
      <div className="text-sm font-semibold text-slate-800">
        Welcome{user ? `, ${user.fullName}` : ""} 👋
      </div>

      {user && (
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="px-2 py-1 rounded-full bg-slate-100">
            {user.role.toUpperCase()}
          </span>
          <button
            onClick={logout}
            className="px-3 py-1 rounded-full border text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
};

export default Topbar;
