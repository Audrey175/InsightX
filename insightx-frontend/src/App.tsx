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
import DoctorPatientsList from "./pages/dashboard/DoctorPatientsList";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import DoctorProfilePage from "./pages/profile/DoctorProfilePage";
import PatientProfilePage from "./pages/profile/PatientProfilePage";
import AccountSettings from "./pages/settings/AccountSettings";
import SystemSettings from "./pages/settings/SystemSettings";
import OtherSettings from "./pages/settings/OtherSettings";
import AssistantChatPage from "./pages/assistant/AssistantChatPage";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/choose-role" element={<ChooseRole />} />
      <Route path="/signup/:role" element={<SignUp />} />

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<GeneralDashboard />} />
        <Route path="/assistant" element={<AssistantChatPage />} />
        <Route path="/settings/account" element={<AccountSettings />} />
        <Route path="/settings/system" element={<SystemSettings />} />
        <Route path="/settings/other" element={<OtherSettings />} />
      </Route>

      {/* Doctor-only routes */}
      <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
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
        <Route
          path="/dashboard/doctor/patients"
          element={<DoctorPatientsList />}
        />
        <Route path="/profile/doctor" element={<DoctorProfilePage />} />
      </Route>

      {/* Patient-only routes */}
      <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
        <Route
          path="/dashboard/patient/brain"
          element={<PatientBrainDashboard />}
        />
        <Route
          path="/dashboard/patient/heart"
          element={<PatientHeartDashboard />}
        />
        <Route path="/profile/patient" element={<PatientProfilePage />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
