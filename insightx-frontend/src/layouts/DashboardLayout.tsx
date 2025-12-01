import React from "react";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

type Props = {
  children: React.ReactNode;
};

const DashboardLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 px-6 py-6">{children}</main>

        <footer className="border-t bg-white text-xs text-slate-500 px-6 py-3 text-right">
          2025 © InsightX, All Rights Reserved
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
