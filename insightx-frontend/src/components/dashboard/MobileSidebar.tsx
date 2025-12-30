import { useEffect } from "react";
import { Link } from "react-router-dom";

type NavLinkItem = { label: string; to: string };
type NavSection = { title: string; items: NavLinkItem[] };

export default function MobileSidebar({
  open,
  onClose,
  sections,
  bottomItems,
}: {
  open: boolean;
  onClose: () => void;
  sections: NavSection[];
  bottomItems: NavLinkItem[];
}) {
  // ESC to close + lock body scroll while open
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold text-slate-900">Menu</div>
          <button className="border rounded px-2 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Main sections (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold text-slate-500 mb-2">
                {section.title}
              </p>

              <nav className="flex flex-col gap-1">
                {section.items.map((it) => (
                  <Link
                    key={it.to}
                    to={it.to}
                    onClick={onClose}
                    className="px-3 py-2 rounded hover:bg-slate-100 text-slate-700"
                  >
                    {it.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Pinned bottom items (assistant) */}
        <div className="border-t p-4">
          <nav className="flex flex-col gap-1">
            {bottomItems.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                onClick={onClose}
                className="px-3 py-2 rounded hover:bg-slate-100 text-slate-700 font-medium"
              >
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
