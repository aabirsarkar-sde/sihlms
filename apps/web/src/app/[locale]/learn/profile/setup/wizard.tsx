"use client";
import { useLocale } from "next-intl";
import { TraineeProfileForm } from "@/components/profile/trainee-profile-form";

export function SetupWizard({ name, districts }: { name: string; districts: Record<string, string[]> }) {
  const locale = useLocale();
  return (
    <TraineeProfileForm
      wizard
      districts={districts}
      initial={{ name, category: "", gender: "", dob: "", state: "", district: "", village: "", cooperativeName: "", education: "", languages: "", skills: "", aadhaarLast4: "", diet: "VEG", openToWork: false }}
      onDone={() => {
        window.location.href = `/${locale}/learn`;
      }}
    />
  );
}
