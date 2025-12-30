import React from "react";

type LoadingStateProps = {
  message?: string;
};

export const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-slate-600">
      {message ?? "Loading..."}
    </div>
  );
};
