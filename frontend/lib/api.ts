import { StatusKey } from "./tokens";
import {
  DocumentConfidences,
  LabResult,
  MedicalDocument,
  Patient,
} from "./types";

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

type BackendRangeBounds = {
  low?: number | null;
  high?: number | null;
};

type BackendMetric = {
  biomarker_name?: string;
  extracted_abbreviation?: string | null;
  value?: string | number | null;
  value_raw?: string | null;
  value_normalized?: string | null;
  numeric_value?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  systolic_status?: string | null;
  diastolic_status?: string | null;
  unit?: string | null;
  unit_raw?: string | null;
  comparator?: string | null;
  reference_range?: {
    low?: number | null;
    high?: number | null;
    unit?: string | null;
    source?: string | null;
    systolic?: BackendRangeBounds | null;
    diastolic?: BackendRangeBounds | null;
  } | null;
  status?: string | null;
  status_source?: string | null;
  confidence?: number | null;
  canonical_key?: string | null;
};

type BackendPatient = {
  name?: string | null;
  age?: number | null;
  gender?: string | null;
  patient_id?: string | null;
  referring_physician?: string | null;
};

type BackendConfidence = {
  ocr?: number | null;
  extraction?: number | null;
  completeness?: number | null;
};

type BackendReportRead = BackendReportListItem & {
  report_json: {
    patient?: BackendPatient | null;
    patient_demographics_found?: boolean;
    metrics?: BackendMetric[];
    confidence?: BackendConfidence | null;
    source?: {
      used_ocr?: boolean;
      ocr_confidence?: number | null;
      page_count?: number;
    } | null;
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


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is not defined. Please configure it in your environment variables."
  );
}

export function getApiBaseUrl() {
  return API_BASE_URL!.replace(/\/$/, "");
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
  const normalized = String(status || "UNSPECIFIED").toUpperCase();
  if (normalized === "LOW" || normalized === "HIGH" || normalized === "CRITICAL") {
    return normalized;
  }
  if (normalized === "NORMAL") {
    return "NORMAL";
  }
  return "UNSPECIFIED";
}

function numberOrNull(value: number | string | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (value === null || value === undefined) {
    return null;
  }
  const cleaned = String(value).replace(/,/g, "");
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  return match && Number.isFinite(Number(match[0])) ? Number(match[0]) : null;
}

function numericValue(value: string | number | null | undefined): number | null {
  return numberOrNull(value);
}

function displayValue(metric: BackendMetric): string {
  const systolic = numberOrNull(metric.systolic);
  const diastolic = numberOrNull(metric.diastolic);
  if (systolic !== null && diastolic !== null) {
    return `${systolic}/${diastolic}`;
  }
  if (metric.value_normalized) {
    return String(metric.value_normalized);
  }
  if (metric.value_raw) {
    return String(metric.value_raw);
  }
  if (metric.value !== null && metric.value !== undefined) {
    return String(metric.value);
  }
  return "—";
}

function uploadedDate(value: string) {
  return value ? value.slice(0, 10) : "";
}

function emptyPatient(): Patient {
  return {
    name: null,
    age: null,
    gender: null,
    patientId: null,
    referringDoctor: null,
  };
}

function mapPatient(raw: BackendPatient | null | undefined): Patient {
  if (!raw) {
    return emptyPatient();
  }
  return {
    name: raw.name ?? null,
    age: typeof raw.age === "number" ? raw.age : null,
    gender: raw.gender ?? null,
    patientId: raw.patient_id ?? null,
    referringDoctor: raw.referring_physician ?? null,
  };
}

function emptyConfidences(): DocumentConfidences {
  return { ocr: null, extraction: null, completeness: null };
}

function mapConfidences(
  raw: BackendConfidence | null | undefined,
): DocumentConfidences {
  return {
    ocr: numberOrNull(raw?.ocr),
    extraction: numberOrNull(raw?.extraction),
    completeness: numberOrNull(raw?.completeness),
  };
}

function mapReportListItem(item: BackendReportListItem): MedicalDocument {
  return {
    id: item.id,
    type: "lab_report",
    title: titleFromFilename(item.original_filename),
    category: "Lab report",
    date: uploadedDate(item.uploaded_at),
    confidence: null,
    confidences: emptyConfidences(),
    ocrUsed: false,
    patient: emptyPatient(),
    results: [],
    explanations: [],
    overallSummary: "Open this report to view extracted biomarkers from the backend.",
    urgent: null,
  };
}

function mapReportDetail(report: BackendReportRead): MedicalDocument {
  const reportJson = report.report_json || {};
  const metrics = reportJson.metrics || [];
  const confidences = mapConfidences(reportJson.confidence);

  const results: LabResult[] = metrics.map((metric) => {
    const status = normalizeStatus(metric.status);
    const referenceRange = metric.reference_range || {};
    const systolic = numberOrNull(metric.systolic);
    const diastolic = numberOrNull(metric.diastolic);
    const numeric =
      numberOrNull(metric.numeric_value) ??
      numericValue(metric.value) ??
      systolic;

    return {
      test_name: metric.biomarker_name || "Unnamed biomarker",
      category: "Extracted biomarkers",
      value: numeric,
      value_display: displayValue(metric),
      systolic,
      diastolic,
      unit: metric.unit || metric.unit_raw || "",
      reference_range: {
        low: numberOrNull(referenceRange.low),
        high: numberOrNull(referenceRange.high),
        unit: referenceRange.unit ?? null,
        source: referenceRange.source ?? null,
        systolic: referenceRange.systolic
          ? {
              low: numberOrNull(referenceRange.systolic.low),
              high: numberOrNull(referenceRange.systolic.high),
            }
          : null,
        diastolic: referenceRange.diastolic
          ? {
              low: numberOrNull(referenceRange.diastolic.low),
              high: numberOrNull(referenceRange.diastolic.high),
            }
          : null,
      },
      status,
      flag:
        status === "NORMAL"
          ? "normal"
          : status === "UNSPECIFIED"
            ? "unvalidated"
            : "abnormal",
      sample_type: "",
      remarks: metric.extracted_abbreviation
        ? `Shown as ${metric.extracted_abbreviation}`
        : "",
      confidence: numberOrNull(metric.confidence),
    };
  });

  const abnormalResults = results.filter(
    (result) => result.status === "HIGH" || result.status === "LOW" || result.status === "CRITICAL",
  );
  const unvalidatedResults = results.filter(
    (result) => result.status === "UNSPECIFIED",
  );

  return {
    ...mapReportListItem(report),
    patient: mapPatient(reportJson.patient),
    confidence: confidences.extraction,
    confidences,
    ocrUsed: Boolean(reportJson.source?.used_ocr),
    results,
    explanations: results.map((result) => {
      const measured = `${result.value_display} ${result.unit}`.trim();
      if (result.status === "UNSPECIFIED") {
        return {
          test_name: result.test_name,
          severity: result.status,
          simple_summary: `${result.test_name} was extracted as ${measured}, but it could not be validated against a configured reference range.`,
        };
      }
      if (result.status === "NORMAL") {
        return {
          test_name: result.test_name,
          severity: result.status,
          simple_summary: `${result.test_name} was extracted as ${measured}, within the configured reference range.`,
        };
      }
      return {
        test_name: result.test_name,
        severity: result.status,
        simple_summary: `${result.test_name} was flagged ${result.status.toLowerCase()} with a value of ${measured}.`,
      };
    }),
    overallSummary: abnormalResults.length
      ? `${abnormalResults.length} extracted value${abnormalResults.length > 1 ? "s were" : " was"} outside the reference range${unvalidatedResults.length ? `, and ${unvalidatedResults.length} could not be validated` : ""}.`
      : unvalidatedResults.length
        ? `${results.length} value${results.length === 1 ? "" : "s"} extracted; ${unvalidatedResults.length} could not be validated against a reference range.`
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
    confidence: null,
    confidences: emptyConfidences(),
    ocrUsed: false,
    patient: emptyPatient(),
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
      ...emptyPatient(),
      referringDoctor: prescription.doctor_name || null,
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
