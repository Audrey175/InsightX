import axios, { AxiosHeaders, type RawAxiosRequestHeaders } from "axios";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Generic helper to simulate a network request
export function simulateRequest<T>(
  fn: () => T,
  delayMs = 300
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (error) {
        reject(error);
      }
    }, delayMs);
  });
}

// Real HTTP client for LIVE mode
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem("insightx_auth");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { token?: string };
      if (parsed.token) {
        if (config.headers instanceof AxiosHeaders) {
          config.headers.set("Authorization", `Bearer ${parsed.token}`);
        } else if (config.headers) {
          (config.headers as RawAxiosRequestHeaders).Authorization =
            `Bearer ${parsed.token}`;
        } else {
          config.headers = new AxiosHeaders({
            Authorization: `Bearer ${parsed.token}`,
          });
        }
      }
    } catch {
      // ignore parse errors
    }
  }
  return config;
});
