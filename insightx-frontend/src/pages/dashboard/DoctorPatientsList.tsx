import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button } from "../../components/ui/button";
import {
  claimPatient,
  fetchDoctorPatients,
  fetchUnassignedPatients,
  type DoctorPatientListItem,
  unassignPatient,
} from "../../services/doctorService";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const DoctorPatientsList: React.FC = () => {
  const [patients, setPatients] = useState<DoctorPatientListItem[]>([]);
  const [unassigned, setUnassigned] = useState<DoctorPatientListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignedRows, unassignedRows] = await Promise.all([
        fetchDoctorPatients(),
        fetchUnassignedPatients(),
      ]);
      setPatients(assignedRows);
      setUnassigned(unassignedRows);
    } catch (err: any) {
      setError(err?.message ?? "Unable to load patients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = useMemo(() => {
    const query = search.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(query) ||
        patient.id.toLowerCase().includes(query)
    );
  }, [patients, search]);

  const filteredUnassigned = useMemo(() => {
    const query = search.toLowerCase();
    return unassigned.filter(
      (patient) =>
        patient.name.toLowerCase().includes(query) ||
        patient.id.toLowerCase().includes(query)
    );
  }, [unassigned, search]);

  const handleClaim = async (patientId: string) => {
    setActionId(patientId);
    setActionMessage(null);
    setActionError(null);
    try {
      await claimPatient(patientId);
      setActionMessage("Patient claimed.");
      await loadPatients();
    } catch (err: any) {
      setActionError(err?.message ?? "Unable to claim patient.");
    } finally {
      setActionId(null);
    }
  };

  const handleUnassign = async (patientId: string) => {
    setActionId(patientId);
    setActionMessage(null);
    setActionError(null);
    try {
      await unassignPatient(patientId);
      setActionMessage("Patient unassigned.");
      await loadPatients();
    } catch (err: any) {
      setActionError(err?.message ?? "Unable to unassign patient.");
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading patients..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState message={`Unable to load patients: ${error}`} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-slate-500">Home &gt; Patients</p>
            <h1 className="text-lg font-semibold text-slate-900">
              Patients List
            </h1>
            <p className="text-xs text-slate-500">
              Select a patient to open their dashboards.
            </p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or name"
            className="w-full md:w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm"
          />
        </div>

        {(actionMessage || actionError) && (
          <div
            className={`text-xs ${
              actionError ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {actionError ?? actionMessage}
          </div>
        )}

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Patient ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Brain Stress</th>
                <th className="px-4 py-3">Heart Severity</th>
                <th className="px-4 py-3">Last Scan</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No patients match your search.
                  </td>
                </tr>
              )}

              {filteredPatients.map((patient) => {
                const hasBrain = patient.hasBrain ?? !!patient.brainScanId;
                const hasHeart = patient.hasHeart ?? !!patient.heartScanId;
                const lastScan =
                  patient.lastBrainScan ?? patient.lastHeartScan ?? "N/A";
                return (
                  <tr
                    key={patient.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {patient.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                          {patient.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {patient.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {patient.age ?? "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      {hasBrain ? (
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                          {patient.brainStress}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          No data
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {hasHeart ? (
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                          {patient.heartSeverity}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          No data
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{lastScan}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <Link to={`/dashboard/doctor/history/${patient.id}`}>
                          <Button variant="secondary" className="border border-slate-200 text-xs">
                            History
                          </Button>
                        </Link>
                        <Link to={`/dashboard/doctor/brain?patientId=${patient.id}`}>
                          <Button
                            variant="secondary"
                            className="border border-slate-200 text-xs"
                          >
                            {hasBrain ? "Brain dashboard" : "Start brain scan"}
                          </Button>
                        </Link>
                        <Link to={`/dashboard/doctor/heart?patientId=${patient.id}`}>
                          <Button className="bg-sky-600 hover:bg-sky-700 text-xs">
                            {hasHeart ? "Heart dashboard" : "Start heart scan"}
                          </Button>
                        </Link>
                        <Button
                          variant="secondary"
                          className="border border-slate-200 text-xs"
                          onClick={() => handleUnassign(patient.id)}
                          disabled={actionId === patient.id}
                        >
                          {actionId === patient.id ? "Updating..." : "Unassign"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              Unassigned Patients
            </h2>
            <p className="text-xs text-slate-500">
              Claim a patient to add them to your workspace.
            </p>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Patient ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnassigned.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No unassigned patients.
                  </td>
                </tr>
              )}

              {filteredUnassigned.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {patient.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                        {patient.avatar}
                      </div>
                      <span className="font-medium text-slate-900">
                        {patient.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {patient.age ?? "N/A"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      className="bg-sky-600 hover:bg-sky-700 text-xs"
                      onClick={() => handleClaim(patient.id)}
                      disabled={actionId === patient.id}
                    >
                      {actionId === patient.id ? "Claiming..." : "Claim"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorPatientsList;
