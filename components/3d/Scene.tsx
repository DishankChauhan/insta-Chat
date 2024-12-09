'use client';

import dynamic from 'next/dynamic';
import { RefObject } from 'react';

const DynamicCanvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);

const DynamicOrbitControls = dynamic(
  () => import('@react-three/drei').then((mod) => mod.OrbitControls),
  { ssr: false }
);

const DynamicBoxes = dynamic(() => import('./Boxes').then((mod) => mod.Boxes), {
  ssr: false,
});

interface SceneProps {
  scrollContainer: RefObject<HTMLDivElement>;
}

export function Scene({ scrollContainer }: SceneProps) {
  return (
    <DynamicCanvas camera={{ position: [0, 0, 10], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <DynamicBoxes scrollContainer={scrollContainer} />
      <DynamicOrbitControls enableZoom={false} enablePan={false} />
    </DynamicCanvas>
  );
}