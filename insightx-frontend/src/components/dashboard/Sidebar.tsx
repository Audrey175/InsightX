import React from "react";
import { NavLink } from "react-router-dom";
import Logo from "../../assets/logo/Logo.png";
import { useAuth } from "../../context/AuthContext";

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";
  const isPatient = user?.role === "patient";

  const linkBase =
    "flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100";
  const active = "bg-slate-100 text-slate-900 font-semibold";

  return (
    <aside className="w-64 bg-white border-r flex-col hidden md:flex">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b">
        <img src={Logo} className="h-10 w-auto" alt="InsightX" />
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-4 space-y-6 text-sm">
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Main Menu</p>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? active : ""}`
            }
          >
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/assistant"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? active : ""}`
            }
          >
            <span>AI Assistant</span>
          </NavLink>
        </div>

        {isDoctor && (
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              Doctor Views
            </p>
            <NavLink
              to="/dashboard/doctor/patients"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : ""}`
              }
            >
              <span>Patients</span>
            </NavLink>
            <NavLink
              to="/dashboard/doctor/brain"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : ""}`
              }
            >
              <span>Brain</span>
            </NavLink>
            <NavLink
              to="/dashboard/doctor/heart"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : ""}`
              }
            >
              <span>Heart</span>
            </NavLink>
            <NavLink
              to="/profile/doctor"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : ""}`
              }
            >
              <span>Doctor Profile</span>
            </NavLink>
          </div>
        )}

        {isPatient && (
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              Patient Views
            </p>
            <NavLink
              to="/dashboard/patient/brain"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : ""}`
              }
            >
              <span>Brain</span>
            </NavLink>
            <NavLink
              to="/dashboard/patient/heart"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : ""}`
              }
            >
              <span>Heart</span>
            </NavLink>
            <NavLink
              to="/profile/patient"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : ""}`
              }
            >
              <span>Patient Profile</span>
            </NavLink>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Settings</p>
          <NavLink
            to="/settings/account"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? active : ""}`
            }
          >
            <span>Account Settings</span>
          </NavLink>
          <NavLink
            to="/settings/system"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? active : ""}`
            }
          >
            <span>System Settings</span>
          </NavLink>
          <NavLink
            to="/settings/other"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? active : ""}`
            }
          >
            <span>Other Settings</span>
          </NavLink>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Help</p>
          <button className={linkBase}>
            <span>Documentation</span>
          </button>
        </div>
      </div>

      {/* Dark mode switch (visual only) */}
      <div className="border-t px-4 py-3 flex items-center justify-between text-xs text-slate-500">
        <span>Dark Mode</span>
        <div className="w-10 h-5 rounded-full bg-slate-200 relative">
          <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
