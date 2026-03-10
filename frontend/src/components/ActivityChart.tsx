"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ActivityData {
  _id: string;
  count: number;
}

export default function ActivityChart({ data }: { data: ActivityData[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="_id" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#4f46ef" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
