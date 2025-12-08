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
  { category: "Tumor", uploads: 380, predicted: 320 },
  { category: "Hemorrhage", uploads: 300, predicted: 260 },
  { category: "Infection", uploads: 260, predicted: 210 },
  { category: "Stroke", uploads: 340, predicted: 290 },
];

const DiseaseCategoryChart: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="category" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="uploads" />
        <Bar dataKey="predicted" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DiseaseCategoryChart;
