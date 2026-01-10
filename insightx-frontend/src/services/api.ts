import axios, { AxiosHeaders, type RawAxiosRequestHeaders } from "axios";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const envBase = import.meta.env.VITE_API_BASE_URL;
const origin = typeof window !== "undefined" ? window.location.origin : "";
const isLocalDev =
  origin.includes("localhost:5173") || origin.includes("127.0.0.1:5173");
const fallbackBase = isLocalDev ? "http://127.0.0.1:8000" : origin;
export const API_BASE_URL = (envBase || fallbackBase).replace(/\/$/, "");

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
  timeout: 300000, // 5 minutes
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
