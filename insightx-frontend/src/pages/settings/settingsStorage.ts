export type AppSettings = {
  theme: "light" | "dark";
  language: "en" | "vi";
  notifications: { email: boolean; push: boolean };
};

export function loadSettings(key: string): AppSettings {
  try {
    const raw = localStorage.getItem(key);
    if (!raw)
      return {
        theme: "light",
        language: "en",
        notifications: { email: true, push: false },
      };
    return JSON.parse(raw);
  } catch {
    return {
      theme: "light",
      language: "en",
      notifications: { email: true, push: false },
    };
  }
}

export function saveSettings(key: string, settings: AppSettings) {
  localStorage.setItem(key, JSON.stringify(settings));
}
