"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ProgressBar from "@/components/onboarding/ProgressBar";
import AboutStep from "@/components/onboarding/AboutStep";
import HealthStep from "@/components/onboarding/HealthStep";
import LifestyleStep from "@/components/onboarding/LifestyleStep";
import CareStep from "@/components/onboarding/CareStep";
import ReportsStep from "@/components/onboarding/ReportsStep";
import StepNavigation from "@/components/onboarding/StepNavigation";

const TOTAL_STEPS = 5;

export interface OnboardingData {
  fullName: string;
  dateOfBirth: string;
  age: number | "";
  sex: string;

  height: number | "";
  weight: number | "";
  conditions: string[];

  sleepHours: number;
  exerciseFrequency: string;
  waterIntake: number;

  medications: {
    name: string;
    frequency: string;
    reminderTimes: string[];
  }[];

  allergies: string[];

  healthGoal: string;

  reminderMethods: string[];

  reports: File[];
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<OnboardingData>({
    fullName: "",
    dateOfBirth: "",
    age: "",
    sex: "",

    height: "",
    weight: "",
    conditions: [],

    sleepHours: 8,
    exerciseFrequency: "",
    waterIntake: 2,

    medications: [],

    allergies: [],

    healthGoal: "",

    reminderMethods: ["App Notification"],

    reports: [],
  });

  const nextStep = () => {
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
    } else {
      // TODO:
      // Upload reports
      // Save onboarding to Firestore
      // Mark onboardingCompleted = true
      // Redirect

      router.replace("/dashboard");
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  return (
    <main className="min-h-screen bg-[#050808] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">

        <ProgressBar
          currentStep={step}
          totalSteps={TOTAL_STEPS}
        />

        <div className="mt-10 flex-1">
          {step === 1 && (
            <AboutStep
              data={formData}
              setData={setFormData}
            />
          )}

          {step === 2 && (
            <HealthStep
              data={formData}
              setData={setFormData}
            />
          )}

          {step === 3 && (
            <LifestyleStep
              data={formData}
              setData={setFormData}
            />
          )}

          {step === 4 && (
            <CareStep
              data={formData}
              setData={setFormData}
            />
          )}

          {step === 5 && (
            <ReportsStep
              data={formData}
              setData={setFormData}
            />
          )}
        </div>

        <StepNavigation
          step={step}
          totalSteps={TOTAL_STEPS}
          onBack={previousStep}
          onNext={nextStep}
        />
      </div>
    </main>
  );
}