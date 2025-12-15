import React from "react";
import { Link, NavLink } from "react-router-dom";
import Logo from "../../assets/logo/Logo.png";
import { useAuth } from "../../context/AuthContext";
import { getSidebarNav, type Role } from "../../lib/nav";

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = (user?.role ?? "patient") as Role;
  const { sections, bottomItems } = getSidebarNav(role);

  const linkBase =
    "flex items-center px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100";
  const active = "bg-slate-100 text-slate-900 font-semibold";

  return (
    <aside className="w-64 bg-white border-r hidden md:flex flex-col">
      {/* Header with logo */}
      <div className="h-16 flex items-center px-4 border-b">
        <Link to="/" className="inline-flex items-center">
          <img src={Logo} className="h-10 w-auto" alt="InsightX" />
        </Link>
      </div>

      {/* Main categorized nav */}
      <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? active : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pinned bottom: AI Assistant */}
      <div className="mt-auto border-t px-4 py-4">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? active : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
