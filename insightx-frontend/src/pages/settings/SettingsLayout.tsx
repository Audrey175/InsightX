import { NavLink, Outlet } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";

export default function SettingsLayout() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 border rounded-lg bg-white p-3">
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/settings/account"
              className={({ isActive }) =>
                `px-3 py-2 rounded ${isActive ? "bg-slate-100 font-medium" : ""}`
              }
            >
              Account
            </NavLink>
            <NavLink
              to="/settings/system"
              className={({ isActive }) =>
                `px-3 py-2 rounded ${isActive ? "bg-slate-100 font-medium" : ""}`
              }
            >
              System
            </NavLink>
            <NavLink
              to="/settings/notifications"
              className={({ isActive }) =>
                `px-3 py-2 rounded ${isActive ? "bg-slate-100 font-medium" : ""}`
              }
            >
              Notifications
            </NavLink>
          </nav>
        </aside>

        <main className="md:col-span-3">
          <Outlet />
        </main>
      </div>
    </DashboardLayout>
  );
}
