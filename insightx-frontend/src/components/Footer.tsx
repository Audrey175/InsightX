import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import Logo from "../assets/logo/Logo.png";

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto w-full bg-slate-900 text-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">

        {/* ⭐ Balanced grid: 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">

          {/* LEFT — LOGO */}
          <div className="flex justify-center md:justify-start">
            <Link to="/">
              <img
                src={Logo}
                alt="Logo"
                className="cursor-pointer h-12 w-auto"
              />
            </Link>
          </div>

          {/* CENTER — LINKS */}
          <div className="grid grid-cols-3 gap-8 text-xs">

            {/* Company */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-100">Company</h4>
              <ul className="space-y-1">
                <li>About Us</li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-100">Legal</h4>
              <ul className="space-y-1">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Disclaimer</li>
                <li>Accessibility</li>
              </ul>
            </div>

            {/* Connect */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-100">Connect</h4>
              <div className="space-y-2">
                <Link to="/login">
                  <Button className="h-8 rounded-full bg-slate-100 px-4 text-xs font-semibold text-slate-900 hover:bg-white">
                    Login
                  </Button>
                </Link>

                <div className="flex items-center gap-3 text-lg">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm">in</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm">f</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT — (EMPTY / future use) */}
          <div className="hidden md:flex justify-end">
            {/* You can add social media, newsletter signup, or leave empty */}
          </div>

        </div>

        {/* COPYRIGHT */}
        <p className="mt-8 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} InsightX. All rights reserved.
        </p>

      </div>
    </footer>
  );
};

export default Footer;
