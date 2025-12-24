import React from "react";
import { Search } from "lucide-react";

const Topbar: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      {/* Breadcrumb / page title area placeholder */}
      <div className="text-sm text-slate-500">
        <span className="font-medium text-slate-700">Home</span>
        <span className="mx-1">{">"}</span>
        <span>General Dashboard</span>
      </div>

      {/* Search + profile */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Search"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-amber-300 flex items-center justify-center text-xs font-bold">
            PG
          </div>
          <div className="text-xs text-slate-700">
            <div className="font-semibold">Dr. Peter Griffin</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
