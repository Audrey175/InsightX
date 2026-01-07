import React, { useState } from "react";

interface HeatmapViewerProps {
  imageUrl: string;
}

const HeatmapViewer: React.FC<HeatmapViewerProps> = ({ imageUrl }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-full h-[500px] bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden border border-slate-800 shadow-2xl">
      {/* 1. Header Label for the University Project */}
      <div className="absolute top-4 left-4 z-10">
        <span className="bg-red-600/80 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-widest">
          Grad-CAM Explainability
        </span>
      </div>

      {/* 2. The Heatmap Image */}
      {!hasError ? (
        <img
          src={imageUrl}
          alt="MRI Grad-CAM Heatmap"
          className="max-h-full max-w-full object-contain transition-opacity duration-700 ease-in-out"
          onError={(e) => {
            console.error("Failed to load heatmap:", imageUrl);
            setHasError(true);
          }}
        />
      ) : (
        <div className="text-slate-500 text-xs">Heatmap data unavailable</div>
      )}

      {/* 3. Grad-CAM Intensity Legend (Jet Colormap) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        <span className="text-[9px] text-slate-400 font-bold uppercase">High</span>
        <div className="w-3 h-32 rounded-full bg-gradient-to-t from-blue-600 via-green-400 via-yellow-400 to-red-600 border border-white/20 shadow-lg" />
        <span className="text-[9px] text-slate-400 font-bold uppercase">Low</span>
      </div>

      {/* 4. Attribution Footer */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <p className="text-[10px] text-slate-500 italic">
          AI Attention Mapping (Axial View)
        </p>
      </div>
    </div>
  );
};

export default HeatmapViewer;