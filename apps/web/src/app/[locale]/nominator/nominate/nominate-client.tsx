"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CircleAlert, CircleCheck, FileSpreadsheet, Send, Upload } from "lucide-react";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert, Table, Td, Th } from "@/components/ui/misc";

type Report = { total: number; created: number; newAccounts: number; errors: { row: number; phone?: string; message: string }[]; ms: number };

export function NominateClient({ programmes, initial }: { programmes: { id: string; label: string; sub: string; seats: string }[]; initial?: string }) {
  const t = useTranslations("nominate");
  const [pid, setPid] = useState(initial && programmes.some((p) => p.id === initial) ? initial : programmes[0]?.id ?? "");
  const [phone, setPhone] = useState("");
  const [one, setOne] = useState<{ ok: boolean; text: string }>();
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const p = programmes.find((x) => x.id === pid);

  return (
    <div className="space-y-4">
      <Field label={t("programme")} htmlFor="prog" hint={p ? `${p.sub} · ${t("seats", { s: p.seats })}` : undefined}>
        <Select id="prog" value={pid} onChange={(e) => setPid(e.target.value)} data-testid="programme-select">
          {programmes.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <Upload aria-hidden />
              {t("csvTitle")}
            </CardTitle>
            <CardDescription>{t("csvHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <code className="block rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">{"name,phone,category,district,cooperativeName"}</code>
            <a href="/samples/nominations.csv" download className="inline-flex min-h-touch items-center gap-2 text-sm font-semibold text-brand-700 underline dark:text-brand-300">
              <FileSpreadsheet className="size-4" aria-hidden />
              {t("sample")}
            </a>
            <label className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-sm dark:border-gray-700">
              <FileSpreadsheet className="size-5 text-brand-600" aria-hidden />
              {file ? file.name : t("chooseCsv")}
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} data-testid="csv-input" />
            </label>
            <Button
              className="w-full"
              disabled={!file || !pid || busy}
              data-testid="csv-upload"
              onClick={async () => {
                setBusy(true);
                setErr(undefined);
                setReport(null);
                const fd = new FormData();
                fd.append("programmeId", pid);
                fd.append("file", file!);
                const r = await api<Report>("/api/v1/nominations/import", { method: "POST", body: fd });
                setBusy(false);
                if (r.error) setErr(r.error.message);
                else setReport(r.data!);
              }}
            >
              <Upload aria-hidden />
              {busy ? t("importing") : t("import")}
            </Button>
            {err ? <Alert tone="red">{err}</Alert> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <Send aria-hidden />
              {t("oneTitle")}
            </CardTitle>
            <CardDescription>{t("oneHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const r = await api(`/api/v1/programmes/${pid}/nominations`, { method: "POST", json: { phone } });
                setOne(r.error ? { ok: false, text: r.error.message } : { ok: true, text: t("oneDone") });
                if (!r.error) setPhone("");
              }}
            >
              <Field label={t("phone")} htmlFor="n-phone">
                <Input id="n-phone" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} required />
              </Field>
              <Button type="submit" disabled={phone.length !== 10}>
                <Send aria-hidden />
                {t("nominate")}
              </Button>
              {one ? <Alert tone={one.ok ? "green" : "red"}>{one.text}</Alert> : null}
            </form>
          </CardContent>
        </Card>
      </div>
      {report ? (
        <Card data-testid="import-report">
          <CardHeader>
            <CardTitle>
              {report.errors.length ? <CircleAlert className="!text-saffron-600" aria-hidden /> : <CircleCheck aria-hidden />}
              {t("report")}
            </CardTitle>
            <CardDescription>{t("reportSummary", { created: report.created, total: report.total, accounts: report.newAccounts, errors: report.errors.length, ms: report.ms })}</CardDescription>
          </CardHeader>
          {report.errors.length ? (
            <CardContent>
              <Table>
                <thead>
                  <tr>
                    <Th>{t("row")}</Th>
                    <Th>{t("phone")}</Th>
                    <Th>{t("problem")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {report.errors.map((e) => (
                    <tr key={e.row}>
                      <Td className="tabular-nums">{e.row}</Td>
                      <Td className="font-mono text-xs">{e.phone ?? "—"}</Td>
                      <Td className="text-red-700 dark:text-red-400">{e.message}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
