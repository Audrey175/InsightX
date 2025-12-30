import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { loadSettings, saveSettings } from "./settingsStorage";
import type { AppSettings } from "./settingsStorage";

export default function NotificationSettings() {
  const { user } = useAuth();
  const storageKey = useMemo(
    () => `insightx_settings_${user?.id || user?.email || "default"}`,
    [user]
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadSettings(storageKey)
  );

  useEffect(() => saveSettings(storageKey, settings), [storageKey, settings]);

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <h1 className="text-lg font-semibold">Notifications</h1>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.notifications.email}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              notifications: { ...s.notifications, email: e.target.checked },
            }))
          }
        />
        <span>Email notifications</span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.notifications.push}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              notifications: { ...s.notifications, push: e.target.checked },
            }))
          }
        />
        <span>Push notifications</span>
      </label>
    </div>
  );
}
