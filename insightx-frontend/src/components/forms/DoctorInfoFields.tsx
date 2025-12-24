import React from "react";

type Props = {
  values: {
    hospital: string;
    department: string;
    professionalId: string;
  };
  errors: {
    hospital?: string;
    department?: string;
    professionalId?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const DoctorInfoFields: React.FC<Props> = ({ values, errors, onChange }) => {
  return (
    <>
      <h2 className="font-medium mb-2">Doctor Information</h2>

      <div className="grid gap-4 mb-6">
        <div>
          <input
            name="hospital"
            className="border p-2 rounded-lg w-full"
            placeholder="Hospital / Clinic Name"
            value={values.hospital}
            onChange={onChange}
          />
          {errors.hospital && (
            <p className="mt-1 text-xs text-red-500">{errors.hospital}</p>
          )}
        </div>

        <div>
          <input
            name="department"
            className="border p-2 rounded-lg w-full"
            placeholder="Department"
            value={values.department}
            onChange={onChange}
          />
          {errors.department && (
            <p className="mt-1 text-xs text-red-500">{errors.department}</p>
          )}
        </div>

        <div>
          <input
            name="professionalId"
            className="border p-2 rounded-lg w-full"
            placeholder="Professional ID"
            value={values.professionalId}
            onChange={onChange}
          />
          {errors.professionalId && (
            <p className="mt-1 text-xs text-red-500">
              {errors.professionalId}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default DoctorInfoFields;
