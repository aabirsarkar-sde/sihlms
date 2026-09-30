"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Award, CircleCheck, CircleX } from "lucide-react";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Alert, Badge, Table, Td, Th } from "@/components/ui/misc";

type Row = { traineeId: string; name: string; eligible: boolean; attendancePct: number; bestScorePct: number | null; reasons: string[]; certNo: string | null };
type Result = { issued: { traineeId: string; certNo: string }[]; alreadyIssued: number; ineligible: { name: string; reasons: string[] }[]; ms: number };

export function IssueCertificates({ programmeId, canIssue }: { programmeId: string; canIssue: boolean }) {
  const t = useTranslations("issue");
  const te = useTranslations("enums");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const load = () => api<{ items: Row[] }>(`/api/v1/programmes/${programmeId}/certificates/issue`).then((r) => r.data && setRows(r.data.items));
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programmeId]);
  const eligible = rows?.filter((r) => r.eligible && !r.certNo).length ?? 0;
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">{rows ? t("summary", { eligible, issued: rows.filter((r) => r.certNo).length, ineligible: rows.filter((r) => !r.eligible).length }) : t("loading")}</p>
        {canIssue ? (
          <Button
            variant="accent"
            disabled={busy || eligible === 0}
            data-testid="issue-certificates"
            onClick={async () => {
              setBusy(true);
              setErr(undefined);
              const r = await api<Result>(`/api/v1/programmes/${programmeId}/certificates/issue`, { method: "POST", json: {} });
              setBusy(false);
              if (r.error) return setErr(r.error.message);
              setRes(r.data!);
              void load();
            }}
          >
            <Award aria-hidden />
            {busy ? t("issuing") : t("issue", { n: eligible })}
          </Button>
        ) : null}
      </div>
      {err ? <Alert tone="red">{err}</Alert> : null}
      {res ? (
        <Alert tone="green" data-testid="issue-result">
          <CircleCheck aria-hidden />
          {t("issued", { n: res.issued.length, s: (res.ms / 1000).toFixed(1) })}
        </Alert>
      ) : null}
      <Table>
        <thead>
          <tr>
            <Th>{t("trainee")}</Th>
            <Th className="text-right">{t("attendance")}</Th>
            <Th className="text-right">{t("score")}</Th>
            <Th>{t("result")}</Th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((r) => (
            <tr key={r.traineeId}>
              <Td>{r.name}</Td>
              <Td className="text-right tabular-nums">{r.attendancePct}%</Td>
              <Td className="text-right tabular-nums">{r.bestScorePct != null ? `${Math.round(r.bestScorePct)}%` : "—"}</Td>
              <Td>
                {r.certNo ? (
                  <span className="font-mono text-xs">{r.certNo}</span>
                ) : r.eligible ? (
                  <Badge tone="green">
                    <CircleCheck aria-hidden />
                    {t("eligible")}
                  </Badge>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {r.reasons.map((x) => (
                      <Badge key={x} tone="red">
                        <CircleX aria-hidden />
                        {te(`reason.${x}`)}
                      </Badge>
                    ))}
                  </span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
