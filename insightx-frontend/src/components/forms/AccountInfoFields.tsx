import React from "react";

type Props = {
  values: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  errors: {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const AccountInfoFields: React.FC<Props> = ({ values, errors, onChange }) => {
  return (
    <>
      <h2 className="font-medium mb-2">Account Information</h2>

      <div className="grid gap-4 mb-6">
        <div>
          <input
            name="fullName"
            className="border p-2 rounded-lg w-full"
            placeholder="Full Name"
            value={values.fullName}
            onChange={onChange}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
          )}
        </div>

        <div>
          <input
            name="email"
            className="border p-2 rounded-lg w-full"
            placeholder="Email"
            value={values.email}
            onChange={onChange}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              name="password"
              type="password"
              className="border p-2 rounded-lg w-full"
              placeholder="Password"
              value={values.password}
              onChange={onChange}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          <div>
            <input
              name="confirmPassword"
              type="password"
              className="border p-2 rounded-lg w-full"
              placeholder="Confirm Password"
              value={values.confirmPassword}
              onChange={onChange}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountInfoFields;
