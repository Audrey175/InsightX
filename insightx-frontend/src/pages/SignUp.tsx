import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { Button } from "../components/ui/button";
import RoleSelector from "../components/RoleSelector";
import AccountInfoFields from "../components/forms/AccountInfoFields.tsx";
import ResearchInfoFields from "../components/forms/ResearchInfoFields";
import DoctorInfoFields from "../components/forms/DoctorInfoFields";
import PatientInfoFields from "../components/forms/PatientInfoFields";
import ConsentSection from "../components/forms/ConsentSection";
import { useAuth } from "../context/AuthContext";

type Role = "patient" | "researcher" | "doctor";

const isRole = (value: string | undefined): value is Role =>
  value === "patient" || value === "researcher" || value === "doctor";

type Values = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  institution: string;
  researchArea: string;
  intendedUse: string;
  hospital: string;
  department: string;
  professionalId: string;
  patientId: string;
  acceptedTerms: boolean;
  acceptedResearchConsent: boolean;
};

type Errors = Partial<Record<keyof Values, string>>;

const initialValues: Values = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  institution: "",
  researchArea: "",
  intendedUse: "",
  hospital: "",
  department: "",
  professionalId: "",
  patientId: "",
  acceptedTerms: false,
  acceptedResearchConsent: false,
};

const SignUp: React.FC = () => {
  const { role: roleParam } = useParams<{ role?: string }>();
  const role: Role = isRole(roleParam) ? roleParam : "patient";

  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const validate = (vals: Values, currentRole: Role): Errors => {
    const newErrors: Errors = {};

    if (!vals.fullName.trim()) newErrors.fullName = "Full Name is required.";
    if (!vals.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email))
      newErrors.email = "Enter a valid email address.";

    if (!vals.password) newErrors.password = "Password is required.";
    else if (vals.password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";

    if (!vals.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password.";
    else if (vals.confirmPassword !== vals.password)
      newErrors.confirmPassword = "Passwords do not match.";

    if (currentRole === "researcher") {
      if (!vals.institution.trim())
        newErrors.institution = "Institution is required.";
      if (!vals.researchArea.trim())
        newErrors.researchArea = "Research area is required.";
      if (!vals.intendedUse.trim())
        newErrors.intendedUse = "Intended use is required.";
    }

    if (currentRole === "doctor") {
      if (!vals.hospital.trim())
        newErrors.hospital = "Hospital/Clinic name is required.";
      if (!vals.department.trim())
        newErrors.department = "Department is required.";
      if (!vals.professionalId.trim())
        newErrors.professionalId = "Professional ID is required.";
    }

    if (currentRole === "patient") {
      if (!vals.professionalId.trim())
        newErrors.professionalId = "Professional ID is required.";
    }

    if (!vals.acceptedTerms)
      newErrors.acceptedTerms = "You must accept the Terms & Privacy Policy.";

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate(values, role);
    setErrors(validation);
    setSubmitError(null);

    if (Object.keys(validation).length === 0) {
      try {
        await signup({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          role,
        });
        setSubmitted(true);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setSubmitted(false);
        setSubmitError((err as Error).message);
      }
    } else {
      setSubmitted(false);
    }
  };

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl p-10"
        noValidate
      >
        <h1 className="text-2xl font-semibold mb-2">Create an Account</h1>
        <p className="text-sm text-slate-500 mb-6">
          Choose your role and enter your details to get started.
        </p>

        <RoleSelector current={role} />

        <AccountInfoFields
          values={{
            fullName: values.fullName,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
          }}
          errors={{
            fullName: errors.fullName,
            email: errors.email,
            password: errors.password,
            confirmPassword: errors.confirmPassword,
          }}
          onChange={handleChange}
        />

        {role === "researcher" && (
          <ResearchInfoFields
            values={{
              institution: values.institution,
              researchArea: values.researchArea,
              intendedUse: values.intendedUse,
            }}
            errors={{
              institution: errors.institution,
              researchArea: errors.researchArea,
              intendedUse: errors.intendedUse,
            }}
            onChange={handleChange}
          />
        )}

        {role === "doctor" && (
          <DoctorInfoFields
            values={{
              hospital: values.hospital,
              department: values.department,
              professionalId: values.professionalId,
            }}
            errors={{
              hospital: errors.hospital,
              department: errors.department,
              professionalId: errors.professionalId,
            }}
            onChange={handleChange}
          />
        )}

        {role === "patient" && (
          <PatientInfoFields
            values={{ patientId: values.patientId }}
            errors={{ patientId: errors.patientId }}
            onChange={handleChange}
          />
        )}

        <ConsentSection
          role={role}
          acceptedTerms={values.acceptedTerms}
          acceptedResearchConsent={values.acceptedResearchConsent}
          errors={{
            acceptedTerms: errors.acceptedTerms,
            acceptedResearchConsent: errors.acceptedResearchConsent,
          }}
          onChange={handleCheckboxChange}
        />

        {submitError && (
          <p className="text-sm text-red-500 mb-2">{submitError}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>

        {submitted && (
          <p className="mt-3 text-xs text-green-600">
            Form is valid. You are now signed up.
          </p>
        )}

        <p className="text-center mt-4 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignUp;
