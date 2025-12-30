import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const data = [
  { department: "Cardiology", general: 65, followup: 45 },
  { department: "Urology", general: 50, followup: 38 },
  { department: "Pediatrics", general: 80, followup: 55 },
  { department: "Gynecology", general: 70, followup: 50 },
  { department: "Psychiatry", general: 55, followup: 40 },
  { department: "General", general: 60, followup: 42 },
];

const ConsultationByDepartmentChart: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} stackOffset="none">
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="department" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="general" stackId="a" />
        <Bar dataKey="followup" stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ConsultationByDepartmentChart;
