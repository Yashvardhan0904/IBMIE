import { StatusKey } from "./tokens";

export interface RangeBounds {
  low: number | null;
  high: number | null;
}

export interface ReferenceRange {
  low: number | null;
  high: number | null;
  unit?: string | null;
  source?: string | null;
  systolic?: RangeBounds | null;
  diastolic?: RangeBounds | null;
}

export interface LabResult {
  test_name: string;
  category: string;
  value: number | null;
  value_display?: string;
  systolic?: number | null;
  diastolic?: number | null;
  unit: string;
  reference_range: ReferenceRange;
  status: StatusKey;
  flag: string;
  sample_type: string;
  remarks: string;
  confidence?: number | null;
}

export interface Medicine {
  medicine_name: string;
  strength: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

export interface Patient {
  name: string | null;
  age: number | null;
  gender: string | null;
  patientId: string | null;
  referringDoctor: string | null;
}

export interface DocumentConfidences {
  ocr: number | null;
  extraction: number | null;
  completeness: number | null;
}

export interface PlainExplanation {
  test_name: string;
  simple_summary: string;
  severity: StatusKey;
}

export interface MedicalDocument {
  id: string;
  type: "lab_report" | "prescription";
  title: string;
  category: string;
  date: string;
  confidence: number | null;
  confidences?: DocumentConfidences;
  ocrUsed: boolean;
  patient: Patient;
  results?: LabResult[];
  medicines?: Medicine[];
  explanations?: PlainExplanation[];
  overallSummary?: string;
  urgent?: { message: string; test_name: string } | null;
}

export interface Reminder {
  id: string;
  medicine_name: string;
  dose: string;
  time: string;
  frequency: string;
  active: boolean;
  nextDose: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface WeeklySummary {
  weekRange: string;
  headline: string;
  highlights: string[];
  trend: { label: string; points: number[]; unit: string }[];
  lifestyleTips: string[];
}
