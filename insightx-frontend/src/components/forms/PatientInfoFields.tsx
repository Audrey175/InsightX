import React from "react";

type Props = {
  values: {
    patientId: string;
  };
  errors: {
    patientId?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};


const PatientInfoFields: React.FC<Props> = ({ values, errors, onChange }) => {
  return (
    <div className="grid mb-6">
      <h2 className="font-medium mb-2">Patient Information</h2>
      <div>
        <input
          name="patientID"
          className="border p-2 rounded-lg w-full"
          placeholder="Patient ID"
          value={values.patientId}
          onChange={onChange}
        />
        {errors.patientId && (
          <p className="mt-1 text-xs text-red-500">{errors.patientId}</p>
        )}
      </div>
    </div>
  );
};

export default PatientInfoFields;
