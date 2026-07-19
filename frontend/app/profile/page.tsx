"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardPlus, Moon, Salad, Route, ShieldPlus, MessageCircleHeart } from "lucide-react";
import { TopBar, Card } from "@/components/UI";
import { T } from "@/lib/tokens";
import { HealthProfile } from "@/lib/api";

const EMPTY_PROFILE: HealthProfile = {
  diseases: "",
  sleep_schedule: "",
  daily_routine: "",
  eating_habits: "",
  goals: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<HealthProfile>(EMPTY_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("ibmie_health_profile");
    if (raw) setProfile({ ...EMPTY_PROFILE, ...JSON.parse(raw) });
  }, []);

  const update = (key: keyof HealthProfile, value: string) => {
    setSaved(false);
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    localStorage.setItem("ibmie_health_profile", JSON.stringify(profile));
    setSaved(true);
  };

  const fields = [
    { key: "diseases", label: "Known diseases or conditions", icon: ShieldPlus, placeholder: "Diabetes, thyroid, asthma, hypertension..." },
    { key: "sleep_schedule", label: "Sleeping schedule", icon: Moon, placeholder: "Sleep time, wake time, sleep quality, night shifts..." },
    { key: "daily_routine", label: "Daily routine", icon: Route, placeholder: "Work hours, activity level, commute, exercise..." },
    { key: "eating_habits", label: "Eating habits", icon: Salad, placeholder: "Meal timing, diet type, cravings, outside food..." },
    { key: "goals", label: "Health goals", icon: ClipboardPlus, placeholder: "Weight, cholesterol, sugar control, energy, sleep..." },
  ] as const;

  return (
    <div>
      <TopBar title="Health details" subtitle="Personal context IBMIE uses while explaining reports and routine suggestions" />
      <form onSubmit={submit} className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <Card className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <label key={field.key} className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: T.muted }}>
                  <field.icon size={14} /> {field.label.toUpperCase()}
                </span>
                <textarea
                  value={profile[field.key]}
                  onChange={(event) => update(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className="min-h-32 rounded-lg px-3.5 py-3 outline-none resize-none text-[13px]"
                  style={{ border: `1px solid ${T.border}`, color: T.ink, fontFamily: "var(--font-body)" }}
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="mt-5 rounded-lg px-5 py-3 text-[13px] font-semibold"
            style={{ background: T.primary, color: "#fff" }}
          >
            Save health details
          </button>
          {saved && <span className="ml-3 text-[12.5px]" style={{ color: T.primary }}>Saved locally.</span>}
        </Card>

        <Card className="p-5 h-fit">
          <h2 className="text-[15px] font-semibold mb-2" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>
            Next step
          </h2>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: T.inkSoft }}>
            Upload reports, then ask IBMIE how your routines and health details relate to the extracted values.
          </p>
          <div className="flex flex-col gap-2">
            <Link className="rounded-lg px-3.5 py-3 text-[13px] font-semibold flex items-center gap-2" style={{ background: T.primaryTint, color: T.primaryDeep }} href="/upload">
              <ClipboardPlus size={15} /> Upload reports
            </Link>
            <Link className="rounded-lg px-3.5 py-3 text-[13px] font-semibold flex items-center gap-2" style={{ background: T.canvasAlt, color: T.inkSoft }} href="/chat">
              <MessageCircleHeart size={15} /> Ask AI
            </Link>
          </div>
        </Card>
      </form>
    </div>
  );
}
