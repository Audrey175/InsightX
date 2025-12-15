export type AppRole = "doctor" | "patient" | "researcher" | "general" | string;

export function getRoleHomePath(role: AppRole): string {
  switch (role) {
    case "doctor":
      return "/dashboard/doctor/patients";
    case "patient":
      return "/dashboard/patient/brain";
    case "researcher":
    case "general":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}
