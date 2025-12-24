import React from "react";

type Props = {
  values: {
    institution: string;
    researchArea: string;
    intendedUse: string;
  };
  errors: {
    institution?: string;
    researchArea?: string;
    intendedUse?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const ResearchInfoFields: React.FC<Props> = ({ values, errors, onChange }) => {
  return (
    <>
      <h2 className="font-medium mb-2">Research Information</h2>

      <div className="grid gap-4 mb-6">
        <div>
          <input
            name="institution"
            className="border p-2 rounded-lg w-full"
            placeholder="University / Institution"
            value={values.institution}
            onChange={onChange}
          />
          {errors.institution && (
            <p className="mt-1 text-xs text-red-500">
              {errors.institution}
            </p>
          )}
        </div>

        <div>
          <input
            name="researchArea"
            className="border p-2 rounded-lg w-full"
            placeholder="Research Area"
            value={values.researchArea}
            onChange={onChange}
          />
          {errors.researchArea && (
            <p className="mt-1 text-xs text-red-500">
              {errors.researchArea}
            </p>
          )}
        </div>

        <div>
          <input
            name="intendedUse"
            className="border p-2 rounded-lg w-full"
            placeholder="Intended Use"
            value={values.intendedUse}
            onChange={onChange}
          />
          {errors.intendedUse && (
            <p className="mt-1 text-xs text-red-500">
              {errors.intendedUse}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default ResearchInfoFields;
