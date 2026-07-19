"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BellRing,
  Cake,
  ClipboardPlus,
  Droplets,
  Dumbbell,
  FileUp,
  HeartPulse,
  MessageCircleHeart,
  Moon,
  Ruler,
  Salad,
  ShieldPlus,
  UserRound,
  VenusAndMars,
  Weight,
} from "lucide-react";
import { TopBar, Card } from "@/components/UI";
import { T } from "@/lib/tokens";
import { HealthProfile } from "@/lib/api";

const EMPTY_PROFILE: HealthProfile = {
  full_name: "",
  age: "",
  date_of_birth: "",
  biological_sex: "",
  height: "",
  weight: "",
  sleep_schedule: "",
  sleep_hours: "",
  daily_routine: "",
  eating_habits: "",
  water_intake: "",
  exercise_frequency: "",
  diseases: "",
  medications: "",
  allergies: "",
  goals: "",
  reminder_channels: "",
  preferred_medicine_times: "",
  wants_previous_reports_upload: "",
  google_fit_interest: "",
};

type Field = {
  key: keyof HealthProfile;
  question: string;
  purpose: string;
  icon: typeof UserRound;
  placeholder?: string;
  type?: "text" | "number" | "date" | "textarea";
  options?: string[];
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<HealthProfile>(EMPTY_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const rawProfile = localStorage.getItem("vitalis_health_profile");
    const rawUser = localStorage.getItem("vitalis_user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const stored = rawProfile ? JSON.parse(rawProfile) : {};
    setProfile({
      ...EMPTY_PROFILE,
      ...stored,
      full_name: stored.full_name || user?.name || "",
    });
  }, []);

  const update = (key: keyof HealthProfile, value: string) => {
    setSaved(false);
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    localStorage.setItem("vitalis_health_profile", JSON.stringify(profile));
    setSaved(true);
  };

  const bmi = useMemo(() => {
    const heightCm = Number(profile.height);
    const weightKg = Number(profile.weight);
    if (!heightCm || !weightKg) return null;
    return weightKg / (heightCm / 100) ** 2;
  }, [profile.height, profile.weight]);

  const fields: Field[] = [
    { key: "full_name", question: "What is your full name?", purpose: "Personalization", icon: UserRound, placeholder: "Full name" },
    { key: "age", question: "What is your age?", purpose: "Age-specific health recommendations", icon: Cake, type: "number", placeholder: "Age in years" },
    { key: "date_of_birth", question: "What is your date of birth?", purpose: "Age-specific health recommendations", icon: Cake, type: "date" },
    { key: "biological_sex", question: "What is your biological sex?", purpose: "Health analysis differs by sex", icon: VenusAndMars, options: ["Male", "Female", "Other"] },
    { key: "height", question: "What is your height?", purpose: "Calculate BMI and health risk", icon: Ruler, type: "number", placeholder: "Height in cm" },
    { key: "weight", question: "What is your weight?", purpose: "Calculate BMI and health risk", icon: Weight, type: "number", placeholder: "Weight in kg" },
    { key: "diseases", question: "Do you have any existing medical conditions?", purpose: "Personalized monitoring", icon: HeartPulse, placeholder: "Diabetes, Hypertension, Asthma, Heart Disease, Thyroid, None, Other", type: "textarea" },
    { key: "medications", question: "Are you currently taking any medications?", purpose: "Medicine reminder agent", icon: ClipboardPlus, placeholder: "Medicine name + frequency", type: "textarea" },
    { key: "allergies", question: "Do you have any allergies?", purpose: "Safety and recommendations", icon: ShieldPlus, placeholder: "Food, medicine, dust, pollen, etc.", type: "textarea" },
    { key: "goals", question: "What health goal would you like to achieve?", purpose: "Goal-based AI planning", icon: Activity, placeholder: "Lose Weight, Gain Weight, Manage Diabetes, Improve Fitness, Better Sleep, Reduce Stress", type: "textarea" },
    { key: "reminder_channels", question: "How would you like to receive reminders?", purpose: "Reminder agent configuration", icon: BellRing, options: ["App Notification", "Email", "SMS"] },
    { key: "wants_previous_reports_upload", question: "Would you like to upload your previous medical reports?", purpose: "AI report analysis and health history", icon: FileUp, options: ["Yes", "No", "Later"] },
    { key: "sleep_hours", question: "How many hours do you sleep daily?", purpose: "Routine health monitoring", icon: Moon, type: "number", placeholder: "Hours per night" },
    { key: "sleep_schedule", question: "What is your sleeping schedule?", purpose: "Sleep pattern understanding", icon: Moon, placeholder: "Sleep time, wake time, quality, night shifts", type: "textarea" },
    { key: "exercise_frequency", question: "How often do you exercise?", purpose: "Fitness and risk planning", icon: Dumbbell, placeholder: "Daily, 3x/week, rarely, activity type" },
    { key: "preferred_medicine_times", question: "Preferred medicine reminder times", purpose: "Medicine reminder scheduling", icon: BellRing, placeholder: "8 AM, 2 PM, 9 PM or after meals" },
    { key: "water_intake", question: "How much water do you drink daily?", purpose: "Hydration monitoring", icon: Droplets, placeholder: "Glasses or liters per day" },
    { key: "daily_routine", question: "What is your daily routine?", purpose: "Context-aware suggestions", icon: Activity, placeholder: "Work hours, commute, sitting time, activity level", type: "textarea" },
    { key: "eating_habits", question: "What are your eating habits?", purpose: "Nutrition-aware recommendations", icon: Salad, placeholder: "Meal timing, diet type, outside food, sugar intake", type: "textarea" },
    { key: "google_fit_interest", question: "Would you like Google Fit sync when available?", purpose: "Future activity and sleep import", icon: Activity, options: ["Yes", "No", "Maybe later"] },
  ];

  return (
    <div>
      <TopBar title="Health details" subtitle="Answer these once so Vitalis can personalize reports, routines, reminders, and AI chat" />
      <form onSubmit={submit} className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <Card className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <label key={field.key} className="flex flex-col gap-2">
                <span className="flex items-start gap-2 text-[12px] font-semibold" style={{ color: T.ink }}>
                  <field.icon size={14} className="mt-0.5 shrink-0" color={T.primary} />
                  <span>{field.question}</span>
                </span>
                <span className="text-[11px]" style={{ color: T.muted }}>{field.purpose}</span>

                {field.options ? (
                  <select
                    value={profile[field.key]}
                    onChange={(event) => update(field.key, event.target.value)}
                    className="rounded-lg px-3.5 py-3 outline-none text-[13px]"
                    style={{ border: `1px solid ${T.border}`, color: T.ink, background: T.card }}
                  >
                    <option value="">Select</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={profile[field.key]}
                    onChange={(event) => update(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="min-h-28 rounded-lg px-3.5 py-3 outline-none resize-none text-[13px]"
                    style={{ border: `1px solid ${T.border}`, color: T.ink, fontFamily: "var(--font-body)" }}
                  />
                ) : (
                  <input
                    value={profile[field.key]}
                    onChange={(event) => update(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    type={field.type || "text"}
                    className="rounded-lg px-3.5 py-3 outline-none text-[13px]"
                    style={{ border: `1px solid ${T.border}`, color: T.ink }}
                  />
                )}
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
            Profile summary
          </h2>
          <div className="rounded-lg p-3 mb-4" style={{ background: T.canvasAlt }}>
            <div className="text-[11px] font-semibold mb-1" style={{ color: T.muted }}>BMI</div>
            <div className="text-[22px] font-semibold" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>
              {bmi ? bmi.toFixed(1) : "--"}
            </div>
          </div>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: T.inkSoft }}>
            Google sign-in can provide name and email. Google Fit needs separate OAuth scopes and Fitness API consent, so it is marked as a future sync option here.
          </p>
          <div className="flex flex-col gap-2">
            <Link className="rounded-lg px-3.5 py-3 text-[13px] font-semibold flex items-center gap-2" style={{ background: T.primaryTint, color: T.primaryDeep }} href="/upload">
              <FileUp size={15} /> Upload previous reports
            </Link>
            <Link className="rounded-lg px-3.5 py-3 text-[13px] font-semibold flex items-center gap-2" style={{ background: T.canvasAlt, color: T.inkSoft }} href="/chat">
              <MessageCircleHeart size={15} /> Ask Vitalis
            </Link>
          </div>
        </Card>
      </form>
    </div>
  );
}
