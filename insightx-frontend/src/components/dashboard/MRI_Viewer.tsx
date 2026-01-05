import { useEffect, useRef } from "react";
import vtkGenericRenderWindow from "vtk.js/Sources/Rendering/Misc/GenericRenderWindow";
import vtkXMLImageDataReader from "vtk.js/Sources/IO/XML/XMLImageDataReader";
import vtkVolume from "vtk.js/Sources/Rendering/Core/Volume";
import vtkVolumeMapper from "vtk.js/Sources/Rendering/Core/VolumeMapper";
import vtkColorTransferFunction from "vtk.js/Sources/Rendering/Core/ColorTransferFunction";
import vtkPiecewiseFunction from "vtk.js/Sources/Common/DataModel/PiecewiseFunction";

interface Statistics {
  mean_intensity: number;
  max_intensity: number;
}

export default function MRIViewer({
  volumeUrl,
  stats,
}: {
  volumeUrl: string;
  stats?: Statistics;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const grwRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !volumeUrl) return;

    const reader = vtkXMLImageDataReader.newInstance();

    reader.setUrl(volumeUrl).then(() => {
      const imageData = reader.getOutputData(0);

      console.log("SCALARS:", imageData.getPointData().getScalars());
      console.log("RANGE:", imageData.getPointData().getScalars().getRange());
      const [min, max] = imageData.getPointData().getScalars().getRange();

      const grw = vtkGenericRenderWindow.newInstance();
      grw.setContainer(containerRef.current);

      const renderer = grw.getRenderer();
      const renderWindow = grw.getRenderWindow();

      renderer.removeAllViewProps();

      const mapper = vtkVolumeMapper.newInstance();
      mapper.setInputData(imageData);
      mapper.setSampleDistance(0.7);
      mapper.setBlendModeToComposite();

      const volume = vtkVolume.newInstance();
      volume.setMapper(mapper);

      const span = max - min;

      // Color
      const ctfun = vtkColorTransferFunction.newInstance();
      ctfun.removeAllPoints();
      ctfun.addRGBPoint(min, 0, 0, 0);
      ctfun.addRGBPoint(max, 1, 1, 1);

      // Opacity 
      const ofun = vtkPiecewiseFunction.newInstance();
      ofun.removeAllPoints();
      ofun.addPoint(min, 1.0);
      ofun.addPoint(max, 1.0);

      const property = volume.getProperty();
      property.setIndependentComponents(true);
      property.setRGBTransferFunction(0, ctfun);
      property.setScalarOpacity(0, ofun);
      property.setInterpolationTypeToLinear();
      property.setShade(true);
      property.setAmbient(0.3);
      property.setDiffuse(0.6);
      property.setSpecular(0.2);

      renderer.addVolume(volume);
      renderer.resetCamera();

      requestAnimationFrame(() => {
        grw.resize();
        renderer.resetCameraClippingRange();
        renderWindow.render();
      });

      grwRef.current = grw;
    });

    return () => {
      grwRef.current?.delete();
    };
  }, [volumeUrl, stats]);

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
