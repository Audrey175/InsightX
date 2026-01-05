import { useLayoutEffect, useRef, useState } from "react";
import vtkGenericRenderWindow from "vtk.js/Sources/Rendering/Misc/GenericRenderWindow";
import vtkXMLImageDataReader from "vtk.js/Sources/IO/XML/XMLImageDataReader";
import vtkVolume from "vtk.js/Sources/Rendering/Core/Volume";
import vtkVolumeMapper from "vtk.js/Sources/Rendering/Core/VolumeMapper";
import "vtk.js/Sources/Rendering/OpenGL/RenderWindow";

export default function MRIViewer({ volumeUrl }: { volumeUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const grwRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    if (!volumeUrl) {
      console.error("No volume URL provided");
      return;
    }

    // Delay until DOM is painted
    const frameId = requestAnimationFrame(() => {
      if (!containerRef.current) {
        console.error("Container still null, cannot attach canvas");
        return;
      }

      if (grwRef.current) return; // prevent double init

      try {
        const grw = vtkGenericRenderWindow.newInstance();
        grw.setContainer(containerRef.current);

        const { width, height } = containerRef.current.getBoundingClientRect();
        const views = grw.getRenderWindow().getViews();
        if (views.length > 0) {
          views[0].setSize(width || 500, height || 500);
        }
        grw.resize();

        const renderer = grw.getRenderer();
        const renderWindow = grw.getRenderWindow();
        const reader = vtkXMLImageDataReader.newInstance();

        // Manual fetch debug
        fetch(volumeUrl)
          .then(res => res.text())
          .then(txt => {
            console.log("Manual fetch succeeded, first 200 chars:", txt.slice(0, 200));
          })
          .catch(err => console.error("Manual fetch failed:", err));

        reader.setUrl(volumeUrl).then(() => {
          const imageData = reader.getOutputData();
          if (!imageData) {
            console.error("No image data parsed from VTI");
            return;
          }

          const mapper = vtkVolumeMapper.newInstance();
          mapper.setInputData(imageData);

          const volume = vtkVolume.newInstance();
          volume.setMapper(mapper);

          renderer.addVolume(volume);
          renderer.resetCamera();
          renderWindow.render();

          setLoading(false);
        });

        grwRef.current = grw;
      } catch (err) {
        console.error("VTK initialization failed:", err);
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
      if (grwRef.current) {
        grwRef.current.delete();
        grwRef.current = null;
      }
    };
  }, [volumeUrl]);

  return (
    <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2" />
          <span className="ml-3">Loading 3D Volume...</span>
        </div>
      )}
    </div>
  );
}
