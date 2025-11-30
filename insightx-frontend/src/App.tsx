import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import ChooseRole from "./pages/ChooseRole";
import SignUp from "./pages/SignUp";   // ← EXACT match to your filename

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/choose-role" element={<ChooseRole />} />

      {/* unified signup page */}
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signup/:role" element={<SignUp />} />
    </Routes>
  );
}
