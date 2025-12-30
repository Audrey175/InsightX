export type ScanType = "brain" | "heart";
export type ScanStatus = "queued" | "processing" | "done" | "failed";

export type ScanSession = {
  id: string;
  patientId: string;
  type: ScanType;
  createdAt: string;
  fileName?: string;
  modality?: "Xray" | "MRI" | "CT" | "Other";
  notes?: string;
  status: ScanStatus;
  progress: number; // 0-100
  data?: any; // dashboard-compatible fields once done
  error?: string;
};

const STORAGE_KEY = "insightx_scan_sessions";

const read = (): ScanSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScanSession[];
  } catch {
    return [];
  }
};

const write = (sessions: ScanSession[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // ignore write errors
  }
};

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `scan-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function listSessions(patientId: string, type?: ScanType): ScanSession[] {
  return read()
    .filter((session) => session.patientId === patientId && (!type || session.type === type))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getSession(sessionId: string): ScanSession | undefined {
  return read().find((session) => session.id === sessionId);
}

export function createSession(
  input: Omit<ScanSession, "id" | "createdAt" | "progress" | "status"> & {
    status?: ScanStatus;
  }
): ScanSession {
  const session: ScanSession = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    progress: 0,
    status: input.status ?? "queued",
    ...input,
  };
  const sessions = read();
  sessions.push(session);
  write(sessions);
  return session;
}

export function updateSession(
  sessionId: string,
  patch: Partial<ScanSession>
): ScanSession | undefined {
  const sessions = read();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return undefined;

  sessions[idx] = { ...sessions[idx], ...patch };
  write(sessions);
  return sessions[idx];
}

export function getLatestDoneSession(patientId: string, type: ScanType): ScanSession | undefined {
  return listSessions(patientId, type).find((s) => s.status === "done");
}
