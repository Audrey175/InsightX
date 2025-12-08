import { USE_MOCK, simulateRequest, apiClient } from "./api";
import { mockUsers } from "../data/mockUsers";
import type {
  AuthResponse,
  AuthUser,
  LoginCredentials,
  Role,
} from "../types/auth";
import type { MockUserRecord } from "../data/mockUsers";

const STORAGE_KEY = "insightx_auth";
const MOCK_USERS_KEY = "insightx_mock_users";

export type SignupData = {
  fullName: string;
  email: string;
  password: string;
  role: Role;
};

const saveSession = (data: AuthResponse) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  if (USE_MOCK) {
    return simulateRequest<AuthResponse>(() => {
      const email = credentials.email.trim().toLowerCase();
      const storedRaw = localStorage.getItem(MOCK_USERS_KEY);
      const storedUsers: MockUserRecord[] = storedRaw
        ? JSON.parse(storedRaw)
        : [];
      const candidates = [...mockUsers, ...storedUsers];
      const matched = candidates.find(
        (user) =>
          user.email.toLowerCase() === email &&
          user.password === credentials.password
      );
      if (!matched) {
        throw new Error("Invalid email or password");
      }
      const { password, ...user } = matched;
      const response: AuthResponse = {
        user,
        token: `mock-token-${user.id}`,
      };
      saveSession(response);
      return response;
    });
  }

  const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
  const authData = response.data;
  saveSession(authData);
  return authData;
}

export async function logout(): Promise<void> {
  if (USE_MOCK) {
    return simulateRequest<void>(() => {
      clearSession();
    });
  }

  // Optionally call backend logout when available
  // await apiClient.post("/auth/logout");
  clearSession();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (USE_MOCK) {
    return simulateRequest<AuthUser | null>(() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as AuthResponse;
        return parsed.user;
      } catch {
        clearSession();
        return null;
      }
    });
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthResponse;
    return parsed.user;
  } catch {
    clearSession();
    return null;
  }
}

export async function signup(data: SignupData): Promise<AuthResponse> {
  if (USE_MOCK) {
    return simulateRequest<AuthResponse>(() => {
      const storedRaw = localStorage.getItem(MOCK_USERS_KEY);
      const storedUsers: MockUserRecord[] = storedRaw
        ? JSON.parse(storedRaw)
        : [];

      const newUser: MockUserRecord = {
        id: `u-${storedUsers.length + mockUsers.length + 1}`,
        role: data.role,
        email: data.email,
        fullName: data.fullName,
        password: data.password,
        patientId:
          data.role === "patient"
            ? `P-${String(storedUsers.length + 1).padStart(4, "0")}`
            : undefined,
        doctorId:
          data.role === "doctor"
            ? `D-${String(storedUsers.length + 1).padStart(4, "0")}`
            : undefined,
      };

      const updated = [...storedUsers, newUser];
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(updated));

      const { password, ...safeUser } = newUser;
      const token = `mock-token-${safeUser.id}`;
      const authData: AuthResponse = { user: safeUser, token };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
      return authData;
    });
  }

  throw new Error("Signup not implemented for LIVE mode yet");
}

export const authService = { login, logout, getCurrentUser, signup };
