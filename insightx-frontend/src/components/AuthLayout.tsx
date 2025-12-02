import React from "react";
import Logo from "../assets/logo/Logo.png";
import { Link } from "react-router-dom";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left gradient panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-sky-900 to-sky-600 p-10">
        <div className="flex flex-col items-start">
          <Link to="/">
            <img
              src={Logo}
              alt="Logo"
              className="cursor-pointer mb-8 w-32"
            />
          </Link>

          <h2 className="text-white text-4xl font-light leading-snug max-w-md">
            AI-Powered 3D Visualization Platform for Enhanced Medical Insight.
          </h2>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gradient-to-b from-gray-100 to-gray-200">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
