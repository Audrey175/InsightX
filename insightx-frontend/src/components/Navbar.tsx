import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleHomePath } from "../lib/paths";

export default function Navbar() {
  const { user, logout } = useAuth();

  const dashboardHref = user ? getRoleHomePath(user.role) : "/login";

  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <Link to="/" className="font-semibold text-slate-900">
          InsightX
        </Link>

        <nav className="flex items-center gap-2 flex-wrap justify-end">
          {!user ? (
            <Link to="/login" className="px-3 py-2 rounded-md border">
              Login
            </Link>
          ) : (
            <>
              <Link
                to={dashboardHref}
                className="px-3 py-2 rounded-md border"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-md bg-slate-900 text-white"
              >
                Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
