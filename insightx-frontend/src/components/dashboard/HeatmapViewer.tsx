import React from "react";

interface HeatmapViewerProps {
  imageUrl: string;
}

const HeatmapViewer: React.FC<HeatmapViewerProps> = ({ imageUrl }) => {
  return (
    <div className="w-full h-[500px] bg-black rounded-xl flex items-center justify-center">
      <img
        src={imageUrl}
        alt="MRI Heatmap"
        className="max-h-full max-w-full object-contain"
        onError={(e) => {
          console.error("Failed to load heatmap:", imageUrl);
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
};

export default HeatmapViewer;
