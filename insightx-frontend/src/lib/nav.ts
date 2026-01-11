export type Role = "doctor" | "patient";

export type SidebarLink = {
  label: string;
  to: string;
};

export type SidebarSection = {
  title: string;
  items: SidebarLink[];
};

export type SidebarNav = {
  sections: SidebarSection[];
  bottomItems: SidebarLink[];
};

export function getSidebarNav(role: Role): SidebarNav {
  const overview: SidebarSection = {
    title: "Overview",
    items: [
      {
        label: "Home",
        // safer than "/dashboard" if you restrict /dashboard/general to doctors
        to: role === "doctor" ? "/dashboard/general" : "/dashboard/patient/brain",
      },
    ],
  };

  const doctorWorkspace: SidebarSection = {
    title: "Doctor Workspace",
    items: [
      { label: "Patients", to: "/dashboard/doctor/patients" },
      { label: "Brain Scans", to: "/dashboard/doctor/brain" },
      { label: "Heart Scans", to: "/dashboard/doctor/heart" },
    ],
  };

  const patientWorkspace: SidebarSection = {
    title: "My Workspace",
    items: [
      { label: "History", to: "/dashboard/patient/history" },
      { label: "Brain Scans", to: "/dashboard/patient/brain" },
      { label: "Heart Scans", to: "/dashboard/patient/heart" },
    ],
  };

  const settings: SidebarSection = {
    title: "Settings",
    items: [{ label: "Account Settings", to: "/settings/account" }],
  };

  const account: SidebarSection = {
    title: "Account",
    items: [
      {
        label: "My Profile",
        to: role === "doctor" ? "/profile/doctor" : "/profile/patient",
      },
    ],
  };

  const assistant: SidebarSection = {
    title: "Assistant",
    items: [{ label: "AI Assistant", to: "/assistant" }],
  };

  const sections: SidebarSection[] = [
    overview,
    role === "doctor" ? doctorWorkspace : patientWorkspace,
    settings,
    account,
    assistant,
  ];

  // no bottom items anymore
  const bottomItems: SidebarLink[] = [];

  return { sections, bottomItems };
}
