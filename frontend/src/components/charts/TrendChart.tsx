"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TrendChartProps {
  data: { label: string; value: number }[];
  height?: number;
  valueLabel?: string;
  domain?: [number, number];
}

/** Single-series area chart in brand colours. */
export function TrendChart({ data, height = 240, valueLabel = "Value", domain }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="brandFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFCC00" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#FFCC00" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e4" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b6b66" }} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: "#6b6b66" }} tickLine={false} axisLine={false} allowDecimals={false} domain={domain} />
        <Tooltip
          contentStyle={{ background: "#000", border: "none", borderRadius: 10, color: "#fff", fontSize: 12 }}
          labelStyle={{ color: "#FFCC00", fontWeight: 700 }}
          formatter={(v) => [v, valueLabel]}
        />
        <Area type="monotone" dataKey="value" stroke="#000" strokeWidth={2} fill="url(#brandFill)" dot={false} activeDot={{ r: 4, fill: "#FFCC00", stroke: "#000" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
