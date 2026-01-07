import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/authentication/Login";
import ChooseRole from "./pages/authentication/ChooseRole";
import SignUp from "./pages/authentication/SignUp";

// dashboards
import GeneralDashboard from "./pages/dashboard/GeneralDashboard";
import DoctorBrainDashboard from "./pages/dashboard/DoctorBrainDashboard";
import DoctorHeartDashboard from "./pages/dashboard/DoctorHeartDashboard";
import PatientBrainDashboard from "./pages/dashboard/PatientBrainDashboard";
import PatientHeartDashboard from "./pages/dashboard/PatientHeartDashboard";
import DoctorPatientsList from "./pages/dashboard/DoctorPatientsList";
import PatientScansOverview from "./pages/dashboard/PatientScansOverview";
import DoctorUploadScanPage from "./pages/dashboard/DoctorUploadScanPage";
import DoctorUploadHubPage from "./pages/dashboard/DoctorUploadHubPage";
import DoctorPatientScanHistory from "./pages/dashboard/DoctorPatientScanHistory";
import PatientScanHistory from "./pages/dashboard/PatientScanHistory";

import ProtectedRoute from "./components/routing/ProtectedRoute";
import RequireGuest from "./components/routing/RequireGuest";
import RoleHomeRedirect from "./components/routing/RoleHomeRedirect";
import { useAuth } from "./context/AuthContext";

import DoctorProfilePage from "./pages/profile/DoctorProfilePage";
import PatientProfilePage from "./pages/profile/PatientProfilePage";
import AssistantChatPage from "./pages/assistant/AssistantChatPage";

import SettingsLayout from "./pages/settings/SettingsLayout";
import AccountSettings from "./pages/settings/AccountSettings";
import SystemSettings from "./pages/settings/SystemSettings";
import NotificationSettings from "./pages/settings/NotificationSettings";
import OtherSettings from "./pages/settings/OtherSettings";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Auth pages */}
      <Route
        path="/login"
        element={
          <RequireGuest>
            <Login />
          </RequireGuest>
        }
      />
      <Route
        path="/choose-role"
        element={
          <RequireGuest>
            <ChooseRole />
          </RequireGuest>
        }
      />
      <Route
        path="/signup/:role"
        element={
          <RequireGuest>
            <SignUp />
          </RequireGuest>
        }
      />

      {/* Dashboard redirect -> General Dashboard */}
      <Route path="/dashboard" element={<Navigate to="/dashboard/general" replace />} />

      {/* Authenticated shared routes (any logged-in role) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard/general" element={<GeneralDashboard />} />
        <Route path="/assistant" element={<AssistantChatPage />} />

        <Route path="/settings" element={<Navigate to="/settings/account" replace />} />
        <Route path="/settings" element={<SettingsLayout />}>
          <Route path="account" element={<AccountSettings />} />
          <Route path="system" element={<SystemSettings />} />
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="other" element={<OtherSettings />} />
        </Route>
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
        <Route path="/dashboard/doctor/upload" element={<DoctorUploadHubPage />} />
        <Route path="/dashboard/doctor/upload/:patientId" element={<DoctorUploadScanPage />} />
        <Route path="/dashboard/doctor/history/:patientId" element={<DoctorPatientScanHistory />} />
        <Route path="/profile/doctor" element={<DoctorProfilePage />} />
      </Route>

      {/* Patient-only routes */}
      <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
        <Route path="/dashboard/patient/scans" element={<PatientScansOverview />} />
        <Route path="/dashboard/patient/history" element={<PatientScanHistory />} />
        <Route path="/dashboard/patient/brain" element={<PatientBrainDashboard />} />
        <Route path="/dashboard/patient/heart" element={<PatientHeartDashboard />} />
        <Route path="/profile/patient" element={<PatientProfilePage />} />
      </Route>

      <Route
        path="/profile"
        element={
          user ? (
            <Navigate
              to={
                user.role === "doctor"
                  ? "/profile/doctor"
                  : user.role === "patient"
                  ? "/profile/patient"
                  : "/dashboard/general"
              }
              replace
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={user ? <RoleHomeRedirect /> : <Navigate to="/" replace />}
      />
    </Routes>
  );
}
