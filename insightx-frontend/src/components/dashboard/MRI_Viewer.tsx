import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";

function Mesh({ url }: { url: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const loader = new PLYLoader();
    loader.load(
      url,
      (geom) => {
        geom.computeVertexNormals();
        setGeometry(geom);
      },
      undefined,
      (err) => console.error("PLY load error:", err)
    );
  }, [url]);

  if (!geometry) return null;

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshStandardMaterial color="lightblue" flatShading />
    </mesh>
  );
}

export default function MRIViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <Canvas camera={{ position: [0, 0, 150], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} />
      <Mesh url={modelUrl} />
      <OrbitControls />
    </Canvas>
  );
}
