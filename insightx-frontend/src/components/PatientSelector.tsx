import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchDoctorPatients,
  type DoctorPatientListItem,
} from "../services/doctorService";

type Props = {
  currentId: string;
  organ: "brain" | "heart";
};

const PatientSelector: React.FC<Props> = ({ currentId, organ }) => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<DoctorPatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDoctorPatients()
      .then(setPatients)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!currentId && patients.length) {
      navigate(`/dashboard/doctor/${organ}?patientId=${patients[0].id}`, {
        replace: true,
      });
    }
  }, [currentId, patients, organ, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    navigate(`/dashboard/doctor/${organ}?patientId=${newId}`);
  };

  if (loading) {
    return <span className="text-xs text-slate-500">Loading patients...</span>;
  }

  if (error) {
    return (
      <span className="text-xs text-red-500">Unable to load patients.</span>
    );
  }

  return (
    <select
      value={currentId || patients[0]?.id || ""}
      onChange={handleChange}
      className="border rounded-lg px-2 py-1 text-xs bg-white"
    >
      {patients.map((p) => (
        <option key={p.id} value={p.id}>
          {p.id} - {p.name}
        </option>
      ))}
    </select>
  );
};

export default PatientSelector;
