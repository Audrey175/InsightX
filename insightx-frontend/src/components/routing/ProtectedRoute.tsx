import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types/auth";

type ProtectedRouteProps = {
  allowedRoles?: Role[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">
        Checking access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-3">
          <h1 className="text-lg font-semibold text-slate-900">
            Access restricted
          </h1>
          <p className="text-sm text-slate-600">
            Your account does not have permission to view this page.
          </p>
          <a
            href="/"
            className="text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
