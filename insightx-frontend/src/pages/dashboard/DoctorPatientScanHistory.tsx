import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { listSessions, type ScanType } from "../../services/localScanStore";
import { findPatientById } from "../../data/fakeDatabase";

type Tab = "all" | ScanType;

export default function DoctorPatientScanHistory() {
  const { patientId = "" } = useParams<{ patientId: string }>();
  const [tab, setTab] = useState<Tab>("all");

  const patient = findPatientById(patientId);
  const sessions = useMemo(() => listSessions(patientId), [patientId]);

  const filtered = sessions.filter((s) => (tab === "all" ? true : s.type === tab));

  return (
    <DashboardLayout>
      <div className="space-y-4 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">History</p>
            <h1 className="text-lg font-semibold">
              Scan History - {patient?.name ?? patientId}
            </h1>
          </div>
          <Link
            to={`/dashboard/doctor/patients`}
            className="text-xs text-sky-600 hover:underline"
          >
            Back to Patients
          </Link>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "brain", "heart"] as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1 rounded-full border text-xs ${
                tab === key ? "bg-slate-900 text-white" : "bg-white text-slate-700"
              }`}
            >
              {key === "all" ? "All" : key === "brain" ? "Brain" : "Heart"}
            </button>
          ))}
        </div>

        <div className="bg-white border rounded-2xl shadow-sm">
          {filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">No scan sessions yet.</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((session) => (
                <li key={session.id} className="p-4 flex flex-col gap-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {session.type.toUpperCase()} • {session.fileName ?? "Uploaded scan"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(session.createdAt).toLocaleString()} • {session.modality ?? "Unknown"}
                      </span>
                      {session.notes && (
                        <span className="text-xs text-slate-600 line-clamp-2">
                          Notes: {session.notes}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          session.status === "done"
                            ? "bg-emerald-50 text-emerald-700"
                            : session.status === "failed"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {session.status} • {session.progress}%
                      </span>
                      {session.status === "done" ? (
                        <Link
                          to={`/dashboard/doctor/${session.type}/${session.patientId}?sessionId=${session.id}`}
                          className="px-3 py-1 rounded-full border text-slate-700"
                        >
                          Open
                        </Link>
                      ) : session.status === "processing" || session.status === "queued" ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-slate-100 rounded overflow-hidden">
                            <div
                              className="h-full bg-sky-500"
                              style={{ width: `${session.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        session.error && (
                          <span className="text-rose-600">{session.error}</span>
                        )
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
