"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Table2, ChartColumn } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toCsv } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Frame({ title, description, csvName, rows, table, children }: { title: string; description?: string; csvName: string; rows: Record<string, unknown>[]; table: React.ReactNode; children: React.ReactNode }) {
  const t = useTranslations("charts");
  const [asTable, setAsTable] = useState(false);
  return (
    <Card className="viz-root">
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={() => setAsTable(!asTable)} className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" aria-label={asTable ? t("showChart") : t("showTable")} title={asTable ? t("showChart") : t("showTable")}>
            {asTable ? <ChartColumn className="size-4" aria-hidden /> : <Table2 className="size-4" aria-hidden />}
          </button>
          <button type="button" onClick={() => downloadCsv(csvName, rows)} className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" aria-label={t("csv")} title={t("csv")}>
            <Download className="size-4" aria-hidden />
          </button>
        </div>
      </CardHeader>
      <CardContent>{asTable ? <div className="max-h-72 overflow-y-auto">{table}</div> : children}</CardContent>
    </Card>
  );
}

const axis = { stroke: "var(--viz-axis)", fontSize: 12, tickLine: false, axisLine: false } as const;

function SimpleTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} className="border-b border-gray-200 py-1.5 text-left font-semibold dark:border-gray-800">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className={`border-b border-gray-100 py-1.5 dark:border-gray-800 ${j ? "tabular-nums" : ""}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Tip({ active, payload, label, percent }: { active?: boolean; payload?: { name: string; value: number; color: string; payload: { detail?: string } }[]; label?: string; percent?: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md dark:border-gray-700 dark:bg-gray-900">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{label}</p>
      {payload[0].payload.detail ? <p className="mb-1 text-gray-600 dark:text-gray-400">{payload[0].payload.detail}</p> : null}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: p.color }} aria-hidden />
          {p.name}: <strong className="tabular-nums">{p.value.toLocaleString("en-IN")}{percent ? "%" : ""}</strong>
        </p>
      ))}
    </div>
  );
}

/** Single-series bar (magnitude). Horizontal when labels are long. */
export function BarChartCard({ title, description, data, valueLabel, csvName, percent, horizontal }: { title: string; description?: string; data: { label: string; value: number; detail?: string }[]; valueLabel: string; csvName: string; percent?: boolean; horizontal?: boolean }) {
  const height = horizontal ? Math.max(180, data.length * 34) : 260;
  return (
    <Frame title={title} description={description} csvName={csvName} rows={data.map((d) => ({ label: d.label, [valueLabel]: d.value, ...(d.detail ? { detail: d.detail } : {}) }))} table={<SimpleTable head={["", valueLabel]} rows={data.map((d) => [d.detail ? `${d.label} — ${d.detail}` : d.label, d.value])} />}>
      <div style={{ height }} role="img" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 16, left: horizontal ? 8 : -12, bottom: 0 }} barCategoryGap={2}>
            <CartesianGrid stroke="var(--viz-grid)" vertical={!!horizontal} horizontal={!horizontal} />
            {horizontal ? (
              <>
                <XAxis type="number" {...axis} domain={percent ? [0, 100] : undefined} />
                <YAxis type="category" dataKey="label" {...axis} width={140} />
              </>
            ) : (
              <>
                <XAxis dataKey="label" {...axis} interval={0} />
                <YAxis {...axis} domain={percent ? [0, 100] : undefined} />
              </>
            )}
            <Tooltip content={<Tip percent={percent} />} cursor={{ fill: "var(--viz-grid)", opacity: 0.4 }} />
            <Bar dataKey="value" name={valueLabel} fill="var(--viz-single)" radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Frame>
  );
}

/** Two series over time; one axis, legend + blue/orange validated pair. */
export function TrendChartCard({ title, description, data, series, csvName }: { title: string; description?: string; data: Record<string, string | number>[]; series: { key: string; label: string }[]; csvName: string }) {
  const colors = ["var(--viz-s1)", "var(--viz-s2)"];
  return (
    <Frame title={title} description={description} csvName={csvName} rows={data} table={<SimpleTable head={["", ...series.map((s) => s.label)]} rows={data.map((d) => [String(d.month), ...series.map((s) => Number(d[s.key]))])} />}>
      <div className="h-64" role="img" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
            <XAxis dataKey="month" {...axis} />
            <YAxis {...axis} />
            <Tooltip content={<Tip />} cursor={{ stroke: "var(--viz-axis)", strokeDasharray: "3 3" }} />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
            {series.map((s, i) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={colors[i]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "var(--viz-surface)" }} activeDot={{ r: 5 }} strokeDasharray={i ? "6 3" : undefined} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Frame>
  );
}

/** State heat map as a tile grid (sequential green, one hue light→dark), with a value label on every tile. */
export function StateHeatmapCard({ title, description, data, tiles, csvName, valueLabel }: { title: string; description?: string; data: { state: string; value: number }[]; tiles: Record<string, [number, number]>; csvName: string; valueLabel: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const byState = new Map(data.map((d) => [d.state, d.value]));
  const step = (v: number) => Math.min(4, Math.floor((v / max) * 4.999));
  const cols = Math.max(...Object.values(tiles).map((p) => p[0])) + 1;
  const rows = Math.max(...Object.values(tiles).map((p) => p[1])) + 1;
  return (
    <Frame title={title} description={description} csvName={csvName} rows={data.map((d) => ({ state: d.state, [valueLabel]: d.value }))} table={<SimpleTable head={["", valueLabel]} rows={data.map((d) => [d.state, d.value])} />}>
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }} role="img" aria-label={title}>
        {Object.entries(tiles).map(([state, [x, y]]) => {
          const v = byState.get(state) ?? 0;
          const s = step(v);
          return (
            <div key={state} title={`${state}: ${v.toLocaleString("en-IN")}`} className={`flex aspect-square flex-col items-center justify-center rounded p-0.5 text-center leading-tight ${s < 3 ? "text-gray-900 dark:text-white" : s === 3 ? "text-white" : "text-white dark:text-gray-900"}`} style={{ gridColumn: x + 1, gridRow: y + 1, background: `var(--viz-seq-${s})` }}>
              <span className="line-clamp-2 text-[9px] sm:text-[10px]">{state}</span>
              <span className="text-[10px] font-bold tabular-nums sm:text-xs">{v.toLocaleString("en-IN")}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400" aria-hidden>
        <span>{0}</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="h-3 w-6 rounded-sm" style={{ background: `var(--viz-seq-${i})` }} />
        ))}
        <span>{max.toLocaleString("en-IN")}</span>
      </div>
    </Frame>
  );
}
