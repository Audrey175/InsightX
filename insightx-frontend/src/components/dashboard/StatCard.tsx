import React from "react";

type Props = {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down";
  children?: React.ReactNode; // for mini chart or icon
};

const StatCard: React.FC<Props> = ({
  title,
  value,
  change,
  changeType = "up",
  children,
}) => {
  const changeColor =
    changeType === "up" ? "text-emerald-600" : "text-rose-600";
  const badgeColor =
    changeType === "up" ? "bg-emerald-50" : "bg-rose-50";

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="text-xs font-medium text-slate-500">{title}</div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-semibold text-slate-900">
            {value}
          </div>
          {change && (
            <span
              className={`inline-flex mt-1 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeColor} ${changeColor}`}
            >
              {change}
            </span>
          )}
        </div>
        {children && <div className="h-10 w-20">{children}</div>}
      </div>
    </div>
  );
};

export default StatCard;
