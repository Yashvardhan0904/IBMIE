import { StatusKey } from "./tokens";
import { MedicalDocument } from "./types";

export type DocumentKind = "lab_report" | "prescription";

export type HealthProfile = {
  full_name: string;
  age: string;
  date_of_birth: string;
  biological_sex: string;
  height: string;
  weight: string;
  sleep_schedule: string;
  sleep_hours: string;
  daily_routine: string;
  eating_habits: string;
  water_intake: string;
  exercise_frequency: string;
  diseases: string;
  medications: string;
  allergies: string;
  goals: string;
  reminder_channels: string;
  preferred_medicine_times: string;
  wants_previous_reports_upload: string;
  google_fit_interest: string;
};

export type HealthChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type BackendPagination = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

type BackendReportListItem = {
  id: string;
  user_id: string | null;
  original_filename: string;
  storage_path: string;
  uploaded_at: string;
};

type BackendReportRead = BackendReportListItem & {
  report_json: {
    patient_demographics_found?: boolean;
    metrics?: Array<{
      biomarker_name?: string;
      extracted_abbreviation?: string | null;
      value?: string | number | null;
      unit?: string | null;
      status?: string | null;
    }>;
  };
};

type BackendPrescriptionListItem = {
  id: string;
  user_id: string | null;
  original_filename: string;
  uploaded_at: string;
};

type BackendPrescriptionRead = BackendPrescriptionListItem & {
  storage_path: string;
  doctor_name: string | null;
  clinic_name: string | null;
  date: string | null;
  follow_up_interval: string | null;
  medications: Array<{
    id: string;
    name: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
  }>;
};

type ReportListResponse = {
  items: BackendReportListItem[];
  pagination: BackendPagination;
};

type PrescriptionListResponse = {
  items: BackendPrescriptionListItem[];
  pagination: BackendPagination;
};

type ReportDetailResponse = {
  message: string;
  report: BackendReportRead;
};

type PrescriptionDetailResponse = {
  message: string;
  prescription: BackendPrescriptionRead;
};

type UploadResponse =
  | { message: string; report: BackendReportRead }
  | { message: string; prescription: BackendPrescriptionRead };

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

export function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    DEFAULT_API_BASE_URL
  ).replace(/\/$/, "");
}

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function titleFromFilename(filename: string) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Untitled document";
}

function normalizeStatus(status: string | null | undefined): StatusKey {
  const normalized = String(status || "NORMAL").toUpperCase();
  if (normalized === "LOW" || normalized === "HIGH" || normalized === "CRITICAL") {
    return normalized;
  }
  return "NORMAL";
}

function numericValue(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  const match = String(value ?? "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function uploadedDate(value: string) {
  return value ? value.slice(0, 10) : "";
}

function placeholderPatient() {
  return {
    name: "Patient",
    age: 0,
    gender: "Not specified",
    patientId: "Not specified",
    referringDoctor: "Not specified",
  };
}

function mapReportListItem(item: BackendReportListItem): MedicalDocument {
  return {
    id: item.id,
    type: "lab_report",
    title: titleFromFilename(item.original_filename),
    category: "Lab report",
    date: uploadedDate(item.uploaded_at),
    confidence: 1,
    ocrUsed: false,
    patient: placeholderPatient(),
    results: [],
    explanations: [],
    overallSummary: "Open this report to view extracted biomarkers from the backend.",
    urgent: null,
  };
}

function mapReportDetail(report: BackendReportRead): MedicalDocument {
  const metrics = report.report_json?.metrics || [];
  const results = metrics.map((metric) => {
    const status = normalizeStatus(metric.status);
    return {
      test_name: metric.biomarker_name || "Unnamed biomarker",
      category: "Extracted biomarkers",
      value: numericValue(metric.value),
      unit: metric.unit || "",
      reference_range: { low: null, high: null },
      status,
      flag: status === "NORMAL" ? "normal" : "abnormal",
      sample_type: "",
      remarks: metric.extracted_abbreviation
        ? `Shown as ${metric.extracted_abbreviation}`
        : "",
    };
  });
  const abnormalResults = results.filter((result) => result.status !== "NORMAL");

  return {
    ...mapReportListItem(report),
    results,
    explanations: results.map((result) => ({
      test_name: result.test_name,
      severity: result.status,
      simple_summary:
        result.status === "NORMAL"
          ? `${result.test_name} was extracted as ${result.value} ${result.unit}`.trim()
          : `${result.test_name} was flagged ${result.status.toLowerCase()} with a value of ${result.value} ${result.unit}`.trim(),
    })),
    overallSummary: abnormalResults.length
      ? `${abnormalResults.length} extracted value${abnormalResults.length > 1 ? "s were" : " was"} flagged outside normal status.`
      : `${results.length} value${results.length === 1 ? "" : "s"} extracted from this report.`,
  };
}

function mapPrescriptionListItem(item: BackendPrescriptionListItem): MedicalDocument {
  return {
    id: item.id,
    type: "prescription",
    title: titleFromFilename(item.original_filename),
    category: "Prescription",
    date: uploadedDate(item.uploaded_at),
    confidence: 1,
    ocrUsed: false,
    patient: placeholderPatient(),
    medicines: [],
    overallSummary: "Open this prescription to view extracted medications from the backend.",
    urgent: null,
  };
}

function splitDosage(dosage: string | null) {
  if (!dosage) {
    return { strength: "", dose: "" };
  }

  return { strength: dosage, dose: dosage };
}

function mapPrescriptionDetail(prescription: BackendPrescriptionRead): MedicalDocument {
  const medicines = prescription.medications.map((medication) => {
    const dosage = splitDosage(medication.dosage);
    return {
      medicine_name: medication.name,
      strength: dosage.strength,
      dose: dosage.dose || "As written",
      frequency: medication.frequency || "Not specified",
      duration: medication.duration || "Not specified",
      route: "Oral",
      instructions: medication.instructions || "",
    };
  });

  return {
    ...mapPrescriptionListItem(prescription),
    date: prescription.date || uploadedDate(prescription.uploaded_at),
    patient: {
      ...placeholderPatient(),
      referringDoctor: prescription.doctor_name || "Not specified",
    },
    medicines,
    overallSummary: `${medicines.length} medication${medicines.length === 1 ? "" : "s"} extracted from this prescription.`,
  };
}

export async function getMedicalDocuments(): Promise<MedicalDocument[]> {
  const [reports, prescriptions] = await Promise.all([
    apiFetch<ReportListResponse>("/api/v1/reports"),
    apiFetch<PrescriptionListResponse>("/api/v1/prescriptions"),
  ]);

  return [
    ...(reports?.items || []).map(mapReportListItem),
    ...(prescriptions?.items || []).map(mapPrescriptionListItem),
  ].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getMedicalDocument(id: string): Promise<MedicalDocument | null> {
  const report = await apiFetch<ReportDetailResponse>(`/api/v1/reports/${id}`);
  if (report?.report) {
    return mapReportDetail(report.report);
  }

  const prescription = await apiFetch<PrescriptionDetailResponse>(
    `/api/v1/prescriptions/${id}`,
  );
  if (prescription?.prescription) {
    return mapPrescriptionDetail(prescription.prescription);
  }

  return null;
}

export async function uploadMedicalDocument(file: File, kind: DocumentKind) {
  const formData = new FormData();
  formData.append("file", file);

  const path =
    kind === "prescription"
      ? "/api/v1/prescriptions/upload"
      : "/api/v1/reports/upload";

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Upload failed with status ${response.status}`);
  }

  const payload = (await response.json()) as UploadResponse;
  if ("report" in payload) {
    return { id: payload.report.id, type: "lab_report" as const };
  }

  return { id: payload.prescription.id, type: "prescription" as const };
}

export async function askHealthChat({
  message,
  profile,
  recentReportSummary,
  history,
}: {
  message: string;
  profile?: HealthProfile | null;
  recentReportSummary?: string;
  history: HealthChatMessage[];
}) {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      profile,
      recent_report_summary: recentReportSummary,
      history,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Chat failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { reply: string };
  return payload.reply;
}
