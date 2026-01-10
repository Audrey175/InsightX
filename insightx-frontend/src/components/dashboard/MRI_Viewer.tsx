import { useLayoutEffect, useRef, useState } from "react";
import "@kitware/vtk.js/Rendering/Profiles/Volume";
import "@kitware/vtk.js/Rendering/Profiles/Geometry";
import vtkGenericRenderWindow from "@kitware/vtk.js/Rendering/Misc/GenericRenderWindow";
import vtkXMLImageDataReader from "@kitware/vtk.js/IO/XML/XMLImageDataReader";
import vtkVolume from "@kitware/vtk.js/Rendering/Core/Volume";
import vtkVolumeMapper from "@kitware/vtk.js/Rendering/Core/VolumeMapper";
import vtkColorTransferFunction from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction";
import vtkPiecewiseFunction from "@kitware/vtk.js/Common/DataModel/PiecewiseFunction";
import vtkColorMaps from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps";
import "@kitware/vtk.js/Rendering/OpenGL/RenderWindow";

export default function MRIViewer({ volumeUrl }: { volumeUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const grwRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    if (!volumeUrl) return;

    const frameId = requestAnimationFrame(() => {
      if (!containerRef.current || grwRef.current) return;

      try {
        const grw = vtkGenericRenderWindow.newInstance({
          listenWindowResize: true,
          background: [0, 0, 0],
        });

        grw.setContainer(containerRef.current);

        // --- FIX: PROPERLY SET PRESERVE DRAWING BUFFER ---
        const apiRW = grw.getApiSpecificRenderWindow();
        // We use 'set' on the internal OpenGL object to ensure the buffer isn't cleared
        if (apiRW && (apiRW as any).setPreserveDrawingBuffer) {
          (apiRW as any).setPreserveDrawingBuffer(true);
        }

        const renderWindow = grw.getRenderWindow();
        const renderer = grw.getRenderer();

        // Attach to window so the PDF exporter can force a render
        (window as any).vtkRenderWindow = renderWindow;

        // Adjust initial size
        const { width, height } = containerRef.current.getBoundingClientRect();
        renderWindow.getViews()[0].setSize(width || 500, height || 500);
        grw.resize();

        const reader = vtkXMLImageDataReader.newInstance();

        reader.setUrl(volumeUrl).then(() => {
          const imageData = reader.getOutputData();
          if (!imageData) return;

          const mapper = vtkVolumeMapper.newInstance();
          mapper.setInputData(imageData);
          mapper.setMaximumSamplesPerRay(2000);
          mapper.setSampleDistance(0.7);

          const volume = vtkVolume.newInstance();
          volume.setMapper(mapper);

          // --- 3D VISUALIZATION ENHANCEMENTS ---
          const property = volume.getProperty();

          const ctfun = vtkColorTransferFunction.newInstance();
          ctfun.applyColorMap(vtkColorMaps.getPresetByName("Grayscale"));
          property.setRGBTransferFunction(0, ctfun);

          const ofun = vtkPiecewiseFunction.newInstance();
          ofun.removeAllPoints();
          ofun.addPoint(0, 0.0);
          ofun.addPoint(0.15, 0.0);
          ofun.addPoint(0.25, 0.1);
          ofun.addPoint(0.4, 0.6);
          ofun.addPoint(1.0, 0.9);
          property.setScalarOpacity(0, ofun);

          property.setUseGradientOpacity(0, true);
          property.setGradientOpacityMinimumValue(0, 0.0);
          property.setGradientOpacityMaximumValue(0, 0.1);
          property.setGradientOpacityMinimumOpacity(0, 0.0);
          property.setGradientOpacityMaximumOpacity(0, 1.0);
          property.setShade(true);

          renderer.addVolume(volume);
          renderer.resetCamera();

          renderer.getActiveCamera().elevation(15);
          renderer.getActiveCamera().azimuth(20);

          renderWindow.render();
          setLoading(false);
          (window as any).getVTKSnapshot = () => {
            const apiRW = grw.getApiSpecificRenderWindow();
            // Force a fresh render to ensure buffer is full
            renderWindow.render();
            return apiRW.getCanvas().toDataURL("image/png");
          };
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
    <div className="relative w-full h-[600px] bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white text-[11px] font-bold uppercase tracking-widest">
            3D Visualization Engine
          </span>
        </div>
        <span className="text-slate-400 text-[9px] uppercase tracking-tighter ml-4">
          Render Mode: GPU Ray Casting (Volumetric)
        </span>
      </div>

      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mb-4" />
          <span className="text-sky-500 text-xs font-bold uppercase tracking-[0.2em]">
            Reconstructing 3D Space...
          </span>
        </div>
      )}

      <div className="absolute bottom-4 left-4 text-[9px] text-slate-500 bg-black/40 px-3 py-2 rounded-lg backdrop-blur-md">
        Orbit: Left Click | Zoom: Right Click/Scroll | Pan: Shift + Click
      </div>
    </div>
  );
}
