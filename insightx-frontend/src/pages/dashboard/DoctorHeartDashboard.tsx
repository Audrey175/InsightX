<<<<<<< HEAD
import React, { useState} from "react";
import { predictXRay } from "../../api/xray_predict";
import type { XRayPredictionResult } from "../../api/xray_predict";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
// import HeartHero from "../../assets/researchers.png";
import {
  findPatientById,
  getDoctorHeartFor,
  patients,
} from "../../data/fakeDatabase";
=======
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import DashboardLayout from "../../layouts/DashboardLayout";
import HeartHero from "../../assets/researchers.png";
>>>>>>> main
import PatientSelector from "../../components/PatientSelector";
import { fetchDoctorHeartScan } from "../../services/doctorService";
import type { DoctorHeartScanRecord } from "../../data/doctorHeartData";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { getLatestDoneSession, getSession } from "../../services/localScanStore";
import { findPatientById } from "../../data/fakeDatabase";
import { Button } from "../../components/ui/button";
import {
  predictXRay,
  type XRayPredictionResult,
} from "../../services/predictionService";

const DoctorHeartDashboard: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

<<<<<<< HEAD
  const patient = findPatientById(patientId) ?? patients[0];
  const data = getDoctorHeartFor(patient.id)!;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<XRayPredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleXrayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setSelectedImage(URL.createObjectURL(file));
  setLoading(true);
  setError(null);

  try {
    const result = await predictXRay(file);
    console.log("X-RAY RESULT:", result);
    setPrediction(result);
  } catch {
    setError("Failed to analyze X-ray.");
  } finally {
    setLoading(false);
  }
};
=======
  const [scan, setScan] = useState<DoctorHeartScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xrayPreview, setXrayPreview] = useState<string | null>(null);
  const [xrayPrediction, setXrayPrediction] =
    useState<XRayPredictionResult | null>(null);
  const [xrayLoading, setXrayLoading] = useState(false);
  const [xrayError, setXrayError] = useState<string | null>(null);

  const sessionId = searchParams.get("sessionId");
  const patientInfo = findPatientById(patientId ?? "");

  const mapSession = () => {
    if (!patientId) return null;
    const session = sessionId
      ? getSession(sessionId)
      : getLatestDoneSession(patientId, "heart");
    if (
      !session ||
      session.status !== "done" ||
      session.type !== "heart" ||
      session.patientId !== patientId ||
      !session.data?.doctor
    ) {
      return null;
    }
    const sData = session.data.doctor as Partial<DoctorHeartScanRecord>;
    return {
      patientId,
      patientName: sData.patientName ?? patientInfo?.name ?? "Unknown patient",
      avatar: sData.avatar ?? patientInfo?.avatar ?? "NA",
      lastScanDate: sData.lastScanDate ?? session.createdAt,
      scanId: sData.scanId ?? `H-SESSION-${session.id}`,
      heartRate: sData.heartRate ?? 0,
      oxygen: sData.oxygen ?? 0,
      pressure: sData.pressure ?? "N/A",
      condition: sData.condition ?? "N/A",
      injury:
        sData.injury ?? {
          region: "N/A",
          type: "N/A",
          severity: "Low",
          size: "N/A",
          imaging: [],
        },
      risks: sData.risks ?? [],
      relatedCases: sData.relatedCases ?? [],
    } as DoctorHeartScanRecord;
  };

  useEffect(() => {
    const load = async () => {
      if (!patientId) {
        setError("Patient not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const fromSession = mapSession();
        if (fromSession) {
          setScan(fromSession);
          return;
        }
        const record = await fetchDoctorHeartScan(patientId);
        if (!record) {
          setError("No heart scan available for this patient.");
        }
        setScan(record);
      } catch (err: any) {
        setError(err?.message ?? "Unable to load scan.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [patientId, sessionId]);

  useEffect(() => {
    return () => {
      if (xrayPreview) {
        URL.revokeObjectURL(xrayPreview);
      }
    };
  }, [xrayPreview]);

  const handleNavigate = (target: "brain" | "heart") => {
    const targetId = patientId ?? scan?.patientId ?? "";
    if (targetId) {
      navigate(`/dashboard/doctor/${target}/${targetId}`);
    }
  };

  const exportPdf = () => {
    if (!scan) return;
    const doc = new jsPDF();
    doc.text("InsightX Diagnostic Report", 10, 20);
    doc.text(`Patient: ${scan.patientName} (${scan.patientId})`, 10, 30);
    doc.text("Scan type: Heart", 10, 38);
    doc.text(`Date: ${scan.lastScanDate ?? new Date().toISOString()}`, 10, 46);
    doc.text("Key metrics:", 10, 58);
    doc.text(`- BPM: ${scan.heartRate}`, 14, 66);
    doc.text(`- Oxygenation: ${scan.oxygen}%`, 14, 74);
    doc.text(`- Pressure: ${scan.pressure}`, 14, 82);
    doc.text(`- Condition: ${scan.condition}`, 14, 90);
    doc.text(`Injury: ${scan.injury.region} / ${scan.injury.type}`, 10, 104);
    doc.text(`Notes: ${scan.risks?.[0] ?? "N/A"}`, 10, 114);
    doc.text("Generated by InsightX (mock)", 10, 130);
    doc.save(`InsightX_Heart_Report_${scan.patientId}.pdf`);
  };

  const handleXrayUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setXrayError("X-ray predictor expects an image file.");
      return;
    }

    if (xrayPreview) {
      URL.revokeObjectURL(xrayPreview);
    }

    setXrayPreview(URL.createObjectURL(file));
    setXrayPrediction(null);
    setXrayError(null);
    setXrayLoading(true);

    try {
      const result = await predictXRay(file);
      setXrayPrediction(result);
    } catch {
      setXrayError("Failed to analyze X-ray.");
    } finally {
      setXrayLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading heart scan..." />
      </DashboardLayout>
    );
  }

  if (error || !scan) {
    return (
      <DashboardLayout>
        <ErrorState
          message={error ?? "No scan data."}
          actionLabel="Go to patient list"
          onAction={() => navigate("/dashboard/doctor/patients")}
        />
      </DashboardLayout>
    );
  }
>>>>>>> main

  return (
    <DashboardLayout>
      <div className="space-y-4 min-w-0">
        {/* HEADER */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-slate-500">
              Home &gt; Personal Dashboard &gt; {scan.scanId}
            </p>
            <h1 className="text-lg font-semibold mt-1">{scan.patientName}</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Link
              to={`/dashboard/doctor/history/${scan.patientId}`}
              className="px-3 py-1 rounded-full border text-slate-700"
            >
              View Scan History
            </Link>
            <Button
              onClick={exportPdf}
              className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs"
            >
              Export PDF Report
            </Button>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded-full bg-sky-600 text-white">
                Heart
              </button>
              <button
                onClick={() => handleNavigate("brain")}
                className="px-3 py-1 rounded-full border text-slate-600"
              >
                Brain
              </button>
            </div>

            <PatientSelector currentId={scan.patientId} organ="heart" />

            <div className="h-8 w-8 rounded-full bg-amber-300 flex items-center justify-center text-xs font-bold">
              {scan.avatar}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)] gap-4">
          {/* LEFT */}
<<<<<<< HEAD
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <div className="flex justify-between text-xs text-slate-500">
              <h2 className="font-semibold mb-2">Upload Chest X-ray</h2>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleXrayUpload}
              className="text-xs"
            />

            {selectedImage && ( 
              <img src={selectedImage} 
              alt="Uploaded Xray" 
              className="mt-2 h-32 object-contain rounded" 
              /> 
            )}

             {loading && (
              <p className="text-xs text-slate-500 mt-2">
                Analyzing X-ray...
              </p>
            )}

            {error && (
              <p className="text-xs text-red-500 mt-2">
                {error}
              </p>
            )}
            
          </div>

          {/* RIGHT */}
          {prediction && (
            <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-2 text-xs">
              <h2 className="font-semibold text-sm">X-ray AI Analysis</h2>

              <p>
                <strong>File:</strong> {prediction.filename}
              </p>

              <p>
                <strong>Modality:</strong> {prediction.modality.toUpperCase()}
              </p>

              <p>
                <strong>Prediction:</strong>{" "}
                <span
                  className={
                    prediction.prediction.label === "PNEUMONIA"
                      ? "text-red-600 font-semibold"
                      : "text-green-600 font-semibold"
                  }
                >
                  {prediction.prediction.label}
                </span>
              </p>

              <p>
                <strong>Confidence:</strong>{" "}
                {(prediction.prediction.confidence * 100).toFixed(1)}%
              </p>

              <p>
                <strong>Risk Level:</strong>{" "}
                <span className="capitalize">
                  {prediction.prediction.risk_level}
                </span>
              </p>

              <div className="mt-2">
                <p className="font-semibold">Probabilities</p>
                <ul className="ml-3 list-disc">
                  <li>
                    NORMAL: {(prediction.prediction.probabilities.NORMAL * 100).toFixed(1)}%
                  </li>
                  <li>
                    PNEUMONIA:{" "}
                    {(prediction.prediction.probabilities.PNEUMONIA * 100).toFixed(1)}%
                  </li>
                </ul>
=======
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Cardiac Function</span>
                <span>3D | Heat map | Raw</span>
              </div>

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 flex items-center justify-center">
                  <img
                    src={HeartHero}
                    alt="Heart visualization"
                    className="max-h-56 object-contain"
                  />
                </div>

                <div className="w-full lg:w-60 space-y-3 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="font-semibold mb-1">Heart Metrics</p>
                    <div className="grid grid-cols-2 text-[11px] text-slate-700 gap-1">
                      <span>BPM</span>
                      <span className="text-right">{scan.heartRate}</span>
                      <span>Oxygenation</span>
                      <span className="text-right">{scan.oxygen}%</span>
                      <span>Blood Pressure</span>
                      <span className="text-right">{scan.pressure}</span>
                      <span>Condition</span>
                      <span className="text-right">{scan.condition}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <button className="px-4 py-1.5 rounded-full bg-sky-700 text-white font-medium">
                  3D
                </button>
                <button className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700">
                  Heat map
                </button>
                <button className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700">
                  Raw
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
              <div className="flex justify-between text-xs text-slate-500">
                <span>AI X-ray Analysis</span>
                <span>Chest X-ray</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleXrayUpload}
                className="text-xs"
              />

              {xrayPreview && (
                <img
                  src={xrayPreview}
                  alt="Uploaded X-ray"
                  className="mt-1 h-32 object-contain rounded border"
                />
              )}

              {xrayLoading && (
                <p className="text-xs text-slate-500">Analyzing X-ray...</p>
              )}

              {xrayError && <p className="text-xs text-red-600">{xrayError}</p>}

              {xrayPrediction && (
                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                  <p className="font-semibold text-slate-800">
                    X-ray AI Analysis
                  </p>
                  <p>
                    <span className="font-medium">File:</span>{" "}
                    {xrayPrediction.filename}
                  </p>
                  <p>
                    <span className="font-medium">Prediction:</span>{" "}
                    <span
                      className={
                        xrayPrediction.prediction.label === "PNEUMONIA"
                          ? "text-red-600 font-semibold"
                          : "text-green-600 font-semibold"
                      }
                    >
                      {xrayPrediction.prediction.label}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Confidence:</span>{" "}
                    {(xrayPrediction.prediction.confidence * 100).toFixed(1)}%
                  </p>
                  <p>
                    <span className="font-medium">Risk level:</span>{" "}
                    <span className="capitalize">
                      {xrayPrediction.prediction.risk_level}
                    </span>
                  </p>
                  <div>
                    <p className="font-medium">Probabilities</p>
                    <ul className="ml-4 list-disc text-[11px]">
                      <li>
                        NORMAL:{" "}
                        {(
                          xrayPrediction.prediction.probabilities.NORMAL * 100
                        ).toFixed(1)}
                        %
                      </li>
                      <li>
                        PNEUMONIA:{" "}
                        {(
                          xrayPrediction.prediction.probabilities.PNEUMONIA *
                          100
                        ).toFixed(1)}
                        %
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Model</p>
                    <p>Architecture: {xrayPrediction.model_info.architecture}</p>
                    <p>Version: {xrayPrediction.model_info.version}</p>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {xrayPrediction.disclaimer}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4 text-xs">
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold mb-2">Injury details</h2>
              <div className="space-y-1 text-[11px]">
                <p>Region: {scan.injury.region}</p>
                <p>Type: {scan.injury.type}</p>
                <p>Severity: {scan.injury.severity}</p>
                <p>Size: {scan.injury.size}</p>
                <p>Imaging Used: {scan.injury.imaging.join(", ")}</p>
>>>>>>> main
              </div>

<<<<<<< HEAD
              <div className="mt-2">
                <p className="font-semibold">Model Information</p>
                <p>Architecture: {prediction.model_info.architecture}</p>
                <p>Version: {prediction.model_info.version}</p>
              </div>

              <p className="text-[10px] text-slate-400 mt-3">
                {prediction.disclaimer}
              </p>
=======
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold mb-2">Potential Risks</h2>
              <ul className="list-disc list-inside text-[11px] space-y-1">
                {scan.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold mb-2">Related Cases</h2>
              <ul className="list-disc list-inside text-[11px] space-y-1">
                {scan.relatedCases.map((relatedCase) => (
                  <li key={relatedCase}>{relatedCase}</li>
                ))}
              </ul>
>>>>>>> main
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorHeartDashboard;