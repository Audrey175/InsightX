import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import ChooseRole from "./pages/ChooseRole";
import SignUp from "./pages/SignUp";

// dashboards
import GeneralDashboard from "./pages/dashboard/GeneralDashboard";
import DoctorBrainDashboard from "./pages/dashboard/DoctorBrainDashboard";
import DoctorHeartDashboard from "./pages/dashboard/DoctorHeartDashboard";
import PatientBrainDashboard from "./pages/dashboard/PatientBrainDashboard";
import PatientHeartDashboard from "./pages/dashboard/PatientHeartDashboard";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/choose-role" element={<ChooseRole />} />
      <Route path="/signup/:role" element={<SignUp />} />

      {/* ---- DASHBOARDS ---- */}

      {/* General dashboard */}
      <Route path="/dashboard" element={<GeneralDashboard />} />

      {/* Doctor dashboards */}
      <Route
        path="/dashboard/doctor/brain"
        element={<Navigate to="/dashboard/doctor/brain/P-0001" replace />}
      />
      <Route
        path="/dashboard/doctor/heart"
        element={<Navigate to="/dashboard/doctor/heart/P-0001" replace />}
      />

      <Route
        path="/dashboard/doctor/brain/:patientId"
        element={<DoctorBrainDashboard />}
      />
      <Route
        path="/dashboard/doctor/heart/:patientId"
        element={<DoctorHeartDashboard />}
      />

      {/* Patient dashboards (until login exists, use P-0001 internally) */}
      <Route path="/dashboard/patient/brain" element={<PatientBrainDashboard />} />
      <Route path="/dashboard/patient/heart" element={<PatientHeartDashboard />} />

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
