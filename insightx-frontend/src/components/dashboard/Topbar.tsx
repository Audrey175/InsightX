import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getSidebarNav, type Role } from "../../lib/nav";
import MobileSidebar from "./MobileSidebar";

const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const role = (user?.role ?? "patient") as Role;
  const nav = getSidebarNav(role);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
      <button
        className="md:hidden border rounded px-2 py-1"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        ☰
      </button>

      <div className="font-semibold">InsightX</div>

      {user ? (
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-600">
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
      ) : (
        <div className="w-12" />
      )}

      <MobileSidebar
        open={open}
        onClose={() => setOpen(false)}
        sections={nav.sections}
        bottomItems={nav.bottomItems}
      />
    </div>
  );
};

export default Topbar;
