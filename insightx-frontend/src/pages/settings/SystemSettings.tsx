import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { loadSettings, saveSettings } from "./settingsStorage";
import type { AppSettings } from "./settingsStorage";

export default function SystemSettings() {
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
      <h1 className="text-lg font-semibold">System</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Theme</label>
        <select
          value={settings.theme}
          onChange={(e) =>
            setSettings((s) => ({ ...s, theme: e.target.value as any }))
          }
          className="border rounded px-3 py-2 w-full"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Language</label>
        <select
          value={settings.language}
          onChange={(e) =>
            setSettings((s) => ({ ...s, language: e.target.value as any }))
          }
          className="border rounded px-3 py-2 w-full"
        >
          <option value="en">English</option>
          <option value="vi">Vietnamese</option>
        </select>
      </div>
    </div>
  );
}
