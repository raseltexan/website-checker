"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#FFCC00", "#000000", "#8a8a84", "#e6b800", "#3d3d3d", "#d4d4cf"];

export function DonutChart({ data, height = 220 }: { data: { name: string; value: number }[]; height?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative w-full max-w-56" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#000", border: "none", borderRadius: 10, color: "#fff", fontSize: 12 }} itemStyle={{ color: "#fff" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-extrabold">{total}</p>
            <p className="text-xs text-muted">Total</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="size-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 font-medium">{d.name}</span>
            <span className="font-bold">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
