import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import Logo from "../assets/logo/Logo.png";

const Navbar: React.FC = () => {
  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 md:px-6 md:py-4">

        {/* ⭐ 3-column grid */}
        <div className="grid grid-cols-3 items-center">

          {/* LEFT — LOGO */}
          <div className="flex items-center">
            <Link to="/">
              <img
                src={Logo}
                alt="Logo"
                className="cursor-pointer w-15"
              />
            </Link>
          </div>

          {/* CENTER — NAV LINKS */}
          <nav className="hidden md:flex justify-center items-center gap-8 text-l font-medium text-slate-600">
            <a href="#home" className="hover:text-cyan-600">Home</a>
            <a href="#about" className="hover:text-cyan-600">About Us</a>
            <a href="#dataset" className="hover:text-cyan-600">Dataset</a>
          </nav>

          {/* RIGHT — LOGIN BUTTON */}
          <div className="flex justify-end">
            <Link to="/login">
              <Button className="rounded-full px-6 text-sm font-semibold tracking-tight">
                Login
              </Button>
            </Link>
          </div>

        </div>

      </div>
    </header>
  );
};

export default Navbar;
