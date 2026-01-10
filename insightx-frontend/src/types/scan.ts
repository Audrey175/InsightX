export type ScanSummary = {
  severity?: string;
  recommendation?: string;
  key_findings?: Record<string, any>;
  error?: string;
};

export type ApiScan = {
  id: number | string;
  patient_id?: number | string | null;
  doctor_id?: number | string | null;
  modality?: string | null;
  file_path?: string | null;
  original_filename?: string | null;
  status?: string | null;
  risk_level?: string | null;
  review_status?: string | null;
  clinician_note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  summary?: ScanSummary | null;
  ai_result?: Record<string, any> | null;
};
