import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleHomePath } from "../lib/paths";

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="w-full border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-slate-600">
        <span>© {new Date().getFullYear()} InsightX</span>
        <div className="flex items-center gap-4 flex-wrap">
          {user && <Link to={getRoleHomePath(user.role)}>Dashboard</Link>}
          <Link to="/">Home</Link>
        </div>
      </div>
    </footer>
  );
}
