export type Role = "patient" | "doctor" | "researcher";

export type AuthUser = {
  id: string;
  role: Role;
  email: string;
  fullName: string;
  patientId?: string;
  doctorId?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};
