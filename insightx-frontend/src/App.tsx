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
import DoctorPatientScanHistory from "./pages/dashboard/DoctorPatientScanHistory";
import PatientScanHistory from "./pages/dashboard/PatientScanHistory";
import ScanDetailPage from "./pages/dashboard/ScanDetailPage";

import ProtectedRoute from "./components/routing/ProtectedRoute";
import RequireGuest from "./components/routing/RequireGuest";
import RoleHomeRedirect from "./components/routing/RoleHomeRedirect";
import { useAuth } from "./context/AuthContext";

import DoctorProfilePage from "./pages/profile/DoctorProfilePage";
import PatientProfilePage from "./pages/profile/PatientProfilePage";
import AssistantChatPage from "./pages/assistant/AssistantChatPage";

import SettingsLayout from "./pages/settings/SettingsLayout";
import AccountSettings from "./pages/settings/AccountSettings";

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

      {/* Dashboard redirect -> role home */}
      <Route path="/dashboard" element={<RoleHomeRedirect />} />

      {/* Authenticated shared routes (any logged-in role) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/assistant" element={<AssistantChatPage />} />

        <Route
          path="/settings"
          element={<Navigate to="/settings/account" replace />}
        />
        <Route path="/settings" element={<SettingsLayout />}>
          <Route path="account" element={<AccountSettings />} />
        </Route>

        <Route path="/dashboard/scans/:scanId" element={<ScanDetailPage />} />
      </Route>

      {/* Doctor-only routes */}
      <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
        <Route path="/dashboard/general" element={<GeneralDashboard />} />

        <Route path="/dashboard/doctor/brain" element={<DoctorBrainDashboard />} />
        <Route path="/dashboard/doctor/heart" element={<DoctorHeartDashboard />} />

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
        <Route
          path="/dashboard/doctor/history/:patientId"
          element={<DoctorPatientScanHistory />}
        />
        <Route path="/profile/doctor" element={<DoctorProfilePage />} />
      </Route>

      {/* Patient-only routes */}
      <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
        {/* removed: /dashboard/patient/scans */}
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
                  : "/dashboard"
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
