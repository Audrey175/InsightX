import React from "react";
import { Navigate } from "react-router-dom";
import { getRoleHomePath } from "../../lib/paths";
import { useAuth } from "../../context/AuthContext";

export default function RequireGuest({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (user) return <Navigate to={getRoleHomePath(user.role)} replace />;
  return <>{children}</>;
}
