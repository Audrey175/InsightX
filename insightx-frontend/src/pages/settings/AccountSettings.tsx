import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";

const AccountSettings: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-slate-900">
          Account Settings
        </h1>
        <p className="text-sm text-slate-600">
          Settings will be available in a future release.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default AccountSettings;
