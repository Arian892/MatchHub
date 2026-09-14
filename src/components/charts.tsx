"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimelinePoint } from "@/lib/stats";
import { formatDate } from "@/lib/utils";

const GRID = "#2D3350";
const AXIS = "#707996";
const SURFACE = "#181B2E";

const axisProps = {
  stroke: AXIS,
  tick: { fill: AXIS, fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

interface Props {
  data: TimelinePoint[];
  theirName: string;
  myColor: string;
  theirColor: string;
}

function Box({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; color?: string }[];
}) {
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs"
      style={{ background: SURFACE, borderColor: GRID, color: "#ECEFF9" }}
    >
      <p className="mb-1 font-medium">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2">
          {r.color ? (
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: r.color }}
            />
          ) : null}
          <span className="opacity-70">{r.label}</span>
          <span className="ml-auto tabular font-medium">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Goals scored and conceded in each meeting. */
export function GoalsChart({ data, theirName, myColor, theirColor }: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }} barGap={2}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis allowDecimals={false} width={30} {...axisProps} />
        <Tooltip
          cursor={{ fill: GRID, opacity: 0.25 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as TimelinePoint;
            return (
              <Box
                title={formatDate(p.date)}
                rows={[
                  { label: "You", value: String(p.scored), color: myColor },
                  { label: theirName, value: String(p.conceded), color: theirColor },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="scored" fill={myColor} radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="conceded" fill={theirColor} radius={[3, 3, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** How the win count pulled apart over the rivalry. */
export function WinsChart({ data, theirName, myColor, theirColor }: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis allowDecimals={false} width={30} {...axisProps} />
        <Tooltip
          cursor={{ stroke: GRID }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as TimelinePoint;
            return (
              <Box
                title={formatDate(p.date)}
                rows={[
                  { label: "Your wins", value: String(p.myWins), color: myColor },
                  { label: `${theirName} wins`, value: String(p.theirWins), color: theirColor },
                ]}
              />
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="myWins"
          stroke={myColor}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="theirWins"
          stroke={theirColor}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
