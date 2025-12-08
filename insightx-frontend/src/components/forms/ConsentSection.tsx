import React from "react";

type Props = {
  role: "patient" | "researcher" | "doctor";
  acceptedTerms: boolean;
  acceptedResearchConsent: boolean;
  errors: {
    acceptedTerms?: string;
    acceptedResearchConsent?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const ConsentSection: React.FC<Props> = ({
  role,
  acceptedTerms,
  acceptedResearchConsent,
  errors,
  onChange,
}) => {
  return (
    <div className="space-y-2 mb-6">
      <div>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            name="acceptedTerms"
            checked={acceptedTerms}
            onChange={onChange}
          />{" "}
          I agree to the Terms of Use and Privacy Policy.
        </label>
        {errors.acceptedTerms && (
          <p className="mt-1 text-xs text-red-500">
            {errors.acceptedTerms}
          </p>
        )}
      </div>

      {/* You can decide which roles see this */}
      <div>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            name="acceptedResearchConsent"
            checked={acceptedResearchConsent}
            onChange={onChange}
          />{" "}
          I consent to anonymized data being used for research.
          {role === "patient" && " (optional)"}
        </label>
        {errors.acceptedResearchConsent && (
          <p className="mt-1 text-xs text-red-500">
            {errors.acceptedResearchConsent}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConsentSection;
