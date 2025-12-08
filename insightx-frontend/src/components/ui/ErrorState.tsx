import React from "react";
import { Button } from "./button";

type ErrorStateProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="space-y-3 py-8">
      <p className="text-sm text-red-500">{message}</p>
      {actionLabel && onAction && (
        <Button
          className="bg-sky-600 hover:bg-sky-700 text-white"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
