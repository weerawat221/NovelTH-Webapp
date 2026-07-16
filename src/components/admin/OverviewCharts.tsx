"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OverviewChartsProps {
  data: { date: string; count: number }[];
}

export default function OverviewCharts({ data }: OverviewChartsProps) {
  // Format dates for display
  const chartData = data.map((item) => {
    const d = new Date(item.date);
    return {
      name: d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      }),
      ยอดเข้าชม: item.count,
    };
  });

  return (
    <div className="w-full h-80 bg-[#171513]/60 border border-white/5 rounded-2xl p-6">
      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6">
        แนวโน้มยอดเข้าชม (7 วันล่าสุด)
      </h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2a27" />
            <XAxis
              dataKey="name"
              stroke="#8c8278"
              fontSize={10}
              fontWeight="bold"
            />
            <YAxis stroke="#8c8278" fontSize={10} fontWeight="bold" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#171513",
                borderColor: "#2e2a27",
                borderRadius: "12px",
                color: "#e8e2da",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="ยอดเข้าชม"
              stroke="#e09050"
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
