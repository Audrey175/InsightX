import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import AuthLayout from "../components/AuthLayout";

const Login = () => {
  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-6">
          Login to your account
        </h1>

        <form className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Enter your email"
              type="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              className="w-full mt-1 rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Enter your password"
              type="password"
            />
          </div>

          <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
            Login
          </Button>
        </form>

        <p className="text-center mt-4 text-sm">
          Don’t have an account?{" "}
          <Link to="/choose-role" className="text-blue-600 font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
export default Login;
