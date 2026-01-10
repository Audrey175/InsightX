import { USE_MOCK, apiClient } from "./api";
import {
  createSession,
  deleteSession,
  getSession,
  listSessions,
  updateSession,
  type ScanSession,
} from "./localScanStore";
import type { ApiScan } from "../types/scan";

type ListParams = {
  patient_id?: string | number;
  doctor_id?: string | number;
  modality?: string;
};

const toMockScan = (session: ScanSession): ApiScan => ({
  id: session.id,
  patient_id: session.patientId,
  modality: session.modality?.toLowerCase?.() ?? session.type,
  file_path: session.fileName ?? null,
  original_filename: session.fileName ?? null,
  status: session.status,
  risk_level: session.riskLevel ?? null,
  review_status: session.reviewStatus ?? null,
  clinician_note: session.clinicianNote ?? null,
  created_at: session.createdAt,
  updated_at: session.updatedAt ?? session.createdAt,
  summary: (session.data as any)?.summary ?? null,
  ai_result: (session.data as any)?.ai_result ?? null,
});

export async function listScans(params: ListParams = {}): Promise<ApiScan[]> {
  if (USE_MOCK) {
    const patientId = params.patient_id ? String(params.patient_id) : undefined;
    if (!patientId) return [];
    return listSessions(patientId).map(toMockScan);
  }

  const response = await apiClient.get<ApiScan[]>("/api/scans", { params });
  return response.data ?? [];
}

export async function getScan(scanId: string | number): Promise<ApiScan> {
  if (USE_MOCK) {
    const session = getSession(String(scanId));
    if (!session) {
      throw new Error("Scan not found.");
    }
    return toMockScan(session);
  }
  const response = await apiClient.get<ApiScan>(`/api/scans/${scanId}`);
  return response.data;
}

export async function uploadScan(
  formData: FormData,
  metadata?: { patientId: string; modality: string; doctorId?: string | null }
): Promise<ApiScan> {
  if (USE_MOCK) {
    const patientId = metadata?.patientId ?? "mock";
    const modality = metadata?.modality ?? "mri";
    const session = createSession({
      patientId,
      type: modality === "xray" ? "heart" : "brain",
      fileName: (formData.get("file") as File | null)?.name ?? "scan",
      modality: modality === "xray" ? "Xray" : "MRI",
      notes: "",
      status: "done",
    });
    updateSession(session.id, {
      status: "done",
      progress: 100,
      reviewStatus: "draft",
    });
    return toMockScan(session);
  }

  const response = await apiClient.post<ApiScan>(
    "/api/scans/upload-and-predict",
    formData
  );
  return response.data;
}

export async function updateScan(
  scanId: string | number,
  payload: Partial<Pick<ApiScan, "review_status" | "clinician_note" | "risk_level">>
): Promise<ApiScan> {
  if (USE_MOCK) {
    updateSession(String(scanId), {
      reviewStatus: payload.review_status ?? undefined,
      clinicianNote: payload.clinician_note ?? undefined,
      riskLevel: payload.risk_level ?? undefined,
      updatedAt: new Date().toISOString(),
    });
    return getScan(scanId);
  }

  const response = await apiClient.patch<ApiScan>(
    `/api/scans/${scanId}`,
    payload
  );
  return response.data;
}

export async function deleteScan(
  scanId: string | number
): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    deleteSession(String(scanId));
    return { success: true };
  }
  const response = await apiClient.delete<{ success: boolean }>(
    `/api/scans/${scanId}`
  );
  return response.data;
}
