import { Navigate } from "react-router-dom";
import { getRoleHomePath } from "../../lib/paths";
import { useAuth } from "../../context/AuthContext";

export default function RoleHomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={getRoleHomePath(user.role)} replace />;
}
