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
    items: [{ label: "General", to: "/dashboard" }],
  };

  const doctorWorkspace: SidebarSection = {
    title: "Doctor Workspace",
    items: [
      { label: "Patients", to: "/dashboard/doctor/patients" },
      { label: "Upload Scan", to: "/dashboard/doctor/upload" },
      { label: "Brain Scans", to: "/dashboard/doctor/brain" },
      { label: "Heart Scans", to: "/dashboard/doctor/heart" },
    ],
  };

  const patientWorkspace: SidebarSection = {
    title: "My Workspace",
    items: [
      { label: "My Scans", to: "/dashboard/patient/scans" },
      { label: "History", to: "/dashboard/patient/history" },
      { label: "Brain Scan", to: "/dashboard/patient/brain" },
      { label: "Heart Scan", to: "/dashboard/patient/heart" },
    ],
  };

  const settings: SidebarSection = {
    title: "Settings",
    items: [
      { label: "Account Settings", to: "/settings/account" },
      { label: "System Settings", to: "/settings/system" },
      { label: "Other Settings", to: "/settings/other" },
    ],
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

  const sections: SidebarSection[] = [
    overview,
    role === "doctor" ? doctorWorkspace : patientWorkspace,
    settings,
    account,
  ];

  const bottomItems: SidebarLink[] = [{ label: "AI Assistant", to: "/assistant" }];

  return { sections, bottomItems };
}
