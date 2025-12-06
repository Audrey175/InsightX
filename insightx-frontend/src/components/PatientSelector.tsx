import React from "react";
import { useNavigate } from "react-router-dom";
import { patients } from "../data/fakeDatabase";

type Props = {
  currentId: string;
  organ: "brain" | "heart";
};

const PatientSelector: React.FC<Props> = ({ currentId, organ }) => {
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    navigate(`/dashboard/doctor/${organ}/${newId}`);
  };

  return (
    <select
      value={currentId}
      onChange={handleChange}
      className="border rounded-lg px-2 py-1 text-xs bg-white"
    >
      {patients.map((p) => (
        <option key={p.id} value={p.id}>
          {p.id} — {p.name}
        </option>
      ))}
    </select>
  );
};

export default PatientSelector;
