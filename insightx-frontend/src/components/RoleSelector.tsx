import React from "react";
import { Link } from "react-router-dom";

interface RoleSelectorProps {
  current: "patient" | "researcher" | "doctor";
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ current }) => {
  const roles = [
    {
      key: "patient" as const,
      title: "Patient",
      desc: "View personal results",
      link: "/signup/patient",
    },
    {
      key: "researcher" as const,
      title: "Researcher",
      desc: "Data & insights",
      link: "/signup/researcher",
    },
    {
      key: "doctor" as const,
      title: "Doctor",
      desc: "Clinical tools",
      link: "/signup/doctor",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {roles.map((r) => {
        const isActive = r.key === current;

        if (isActive) {
          return (
            <div
              key={r.key}
              className="p-4 border-blue-600 border rounded-xl shadow-md bg-white"
            >
              <h3 className="font-semibold">{r.title}</h3>
              <p className="text-xs text-slate-500">{r.desc}</p>
            </div>
          );
        }

        return (
          <Link
            key={r.key}
            to={r.link}
            className="p-4 border border-slate-300 rounded-xl hover:bg-slate-50 transition"
          >
            <h3 className="font-semibold">{r.title}</h3>
            <p className="text-xs text-slate-500">{r.desc}</p>
          </Link>
        );
      })}
    </div>
  );
};

export default RoleSelector;
