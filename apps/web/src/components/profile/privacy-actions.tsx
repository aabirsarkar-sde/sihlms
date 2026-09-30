"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/form";

export function PrivacyActions() {
  const t = useTranslations("privacy");
  const locale = useLocale();
  const [confirm, setConfirm] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <a href="/api/v1/me/export" className={buttonVariants({ variant: "outline" })}>
        <Download aria-hidden />
        {t("export")}
      </a>
      {!open ? (
        <Button variant="ghost" className="text-red-700" onClick={() => setOpen(true)}>
          <Trash2 aria-hidden />
          {t("delete")}
        </Button>
      ) : (
        <div className="space-y-2 rounded-lg border border-red-300 p-3">
          <p className="text-sm">{t("deleteWarning")}</p>
          <label htmlFor="confirm-delete" className="text-sm font-medium">
            {t("typeDelete")}
          </label>
          <Input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button
            variant="destructive"
            disabled={confirm !== "DELETE"}
            onClick={async () => {
              await fetch("/api/v1/me", { method: "DELETE" });
              window.location.href = `/${locale}`;
            }}
          >
            {t("confirmDelete")}
          </Button>
        </div>
      )}
    </div>
  );
}
