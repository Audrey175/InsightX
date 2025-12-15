import React from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ShieldCheck, ScanLine, Globe2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import BrainHero from "../assets/brainhome.png";
import Researchers from "../assets/researchers.png";
import { useAuth } from "../context/AuthContext";
import { getRoleHomePath } from "../lib/paths";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const dashTo = user ? getRoleHomePath(user.role) : "/login";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">

      {/* NAVBAR */}
      <Navbar />

      {/* HERO SECTION */}
      <section
        id="home"
        className="w-full bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6 md:py-16">

          {/* LEFT SIDE TEXT */}
          <div className="flex flex-col justify-center space-y-6">
            <h1 className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
              AI-Powered 3D Visualization
              <br />
              for Enhanced Medical Insight.
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-slate-200 md:text-base">
              Transform X-rays and MRI slices into interactive 3D models.
              Enhance diagnostics and accessibility without the cost of complex
              hardware—supporting clinicians in resource-limited environments.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {user ? (
                <Link to={dashTo}>
                  <Button className="w-full sm:w-auto rounded-md bg-cyan-500 px-7 py-2.5 text-sm font-semibold hover:bg-cyan-400">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button className="w-full sm:w-auto rounded-md bg-cyan-500 px-7 py-2.5 text-sm font-semibold hover:bg-cyan-400">
                      Login
                    </Button>
                  </Link>
                  <Link to="/choose-role">
                    <Button
                      variant="secondary"
                      className="w-full sm:w-auto rounded-md px-7 py-2.5 text-sm font-semibold"
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
              {user && (
                <span className="text-xs text-cyan-50">
                  Signed in as {user.role}
                </span>
              )}
            </div>
          </div>

          {/* RIGHT SIDE HERO IMAGE */}
          <div className="flex items-center justify-center">
            <div className="
             relative h-72 w-full max-w-md
             rounded-3xl border border-cyan-500/40
             bg-slate-900/60 p-4
             shadow-[0_0_40px_rgba(34,211,238,0.45)]
            "
           >
           <div className="
             flex h-full items-center justify-center
              rounded-2xl border border-cyan-400/70 bg-slate-950/70
            "
            >
               <img
        src={BrainHero}
        alt="3D Brain MRI"
        className="object-contain max-h-full opacity-95 drop-shadow-[0_0_25px_rgba(34,211,238,0.45)] rounded-3xl"
          />
         </div>

       {/* Center glowing divider line */}
         <div className="pointer-events-none absolute inset-y-6 left-1/2 w-px bg-cyan-500/70"></div>
       </div>
      </div>


        </div>
      </section>

      {/* MISSION SECTION */}
      <section
        id="about"
        className="w-full border-b border-slate-200 bg-slate-100"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-[1.3fr_minmax(0,1fr)] md:px-6 md:py-14">

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Our Mission: Bridging Healthcare Gaps with AI.
            </h2>

            <p className="max-w-xl text-sm leading-relaxed text-slate-700 md:text-base">
              InsightX leverages cutting-edge AI to reconstruct 3D medical
              visualizations from standard 2D scans. Our goal is to democratize
              advanced diagnostic insight—so clinicians everywhere can see more,
              decide faster, and treat better.
            </p>

            <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                Accuracy
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                Accessibility
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                Security
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="h-56 w-full max-w-sm overflow-hidden rounded-3xl bg-slate-900 shadow-lg">
              <img
        src={Researchers}
        alt="Researchers"
        className="rounded-3xl"
          />
         </div>
          </div>

        </div>
      </section>

      {/* WHY TRUST SECTION */}
      <section id="dataset" className="w-full bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Why Clinicians Trust InsightX
          </h2>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">

            {/* Feature Cards */}
            <div className="grid gap-5 md:grid-cols-2">

              <Card className="border-0 bg-white shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50">
                    <ScanLine className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Enhanced Diagnostic Precision
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Convert 2D scans into interactive 3D models for deeper
                    anatomical understanding and more confident decisions.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50">
                    <Eye className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Explainable AI Insights
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Grad-CAM heatmaps show where the model focuses, helping
                    clinicians interpret results and build trust in AI.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Secure &amp; Compliant Platform
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Role-based access and privacy-by-design workflows help
                    protect sensitive patient data.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Accessible Anywhere
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Cloud-first design delivers secure access on desktop,
                    tablet, or mobile—bridging resource gaps globally.
                  </p>
                </CardContent>
              </Card>

            </div>

            {/* Dataset CTA */}
            <div className="flex flex-col justify-center rounded-3xl bg-cyan-500 px-6 py-8 text-white shadow-xl md:px-8">
              <h3 className="text-xl font-semibold md:text-2xl">
                Explore Our Anonymized Datasets.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-cyan-50">
                Access a curated repository of de-identified 2D scans and
                reconstructed 3D models to power research, benchmarking, and
                model validation.
              </p>

              <Button
                variant="secondary"
                className="mt-6 w-fit rounded-md px-7 py-2 text-sm font-semibold"
              >
                View Datasets
              </Button>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <Footer />

    </div>
  );
};

export default LandingPage;
