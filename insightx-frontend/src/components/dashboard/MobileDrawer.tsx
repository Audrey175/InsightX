import { Link } from "react-router-dom";
import type { SidebarLink } from "../../lib/nav";

export default function MobileDrawer({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: SidebarLink[];
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-lg p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">Menu</div>
          <button className="border rounded px-2 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="px-3 py-2 rounded hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
