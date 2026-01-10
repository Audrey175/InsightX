import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { Button } from "../../components/ui/button";

const ChooseRole: React.FC = () => {
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (role) navigate(`/signup/${role}`);
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-xl p-10">
        <h1 className="text-2xl font-semibold mb-2">Create an Account</h1>
        <p className="text-sm text-slate-500 mb-6">
          Choose your role and enter your details to get started.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setRole("patient")}
            className={`border rounded-xl p-4 ${
              role === "patient" ? "border-blue-600 shadow-md" : "border-slate-300"
            }`}
          >
            <h3 className="font-semibold">Patient</h3>
            <p className="text-xs text-slate-500">View personal results</p>
          </button>

          <button
            onClick={() => setRole("doctor")}
            className={`border rounded-xl p-4 ${
              role === "doctor" ? "border-blue-600 shadow-md" : "border-slate-300"
            }`}
          >
            <h3 className="font-semibold">Doctor</h3>
            <p className="text-xs text-slate-500">Clinical tools</p>
          </button>
        </div>

        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </AuthLayout>
  );
};

export default ChooseRole;
