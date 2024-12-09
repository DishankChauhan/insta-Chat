'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, RefObject } from 'react';
import { Group } from 'three';
import { useScroll } from '@/hooks/useScroll';

interface BoxesProps {
  scrollContainer: RefObject<HTMLDivElement>;
}

export function Boxes({ scrollContainer }: BoxesProps) {
  const groupRef = useRef<Group>(null);
  const scrollProgress = useScroll(scrollContainer);

  useFrame(() => {
    if (!groupRef.current) return;
    
    groupRef.current.rotation.y = scrollProgress * Math.PI * 2;
    groupRef.current.position.y = Math.sin(scrollProgress * Math.PI * 2) * 2;
  });

  return (
    <group ref={groupRef}>
      {[...Array(50)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.random() * 20 - 10,
            Math.random() * 20 - 10,
            Math.random() * 20 - 10
          ]}
          scale={Math.random() * 0.3 + 0.1}
        >
          <boxGeometry />
          <meshStandardMaterial 
            color={`hsl(${Math.random() * 360}, 50%, 50%)`} 
            roughness={0.5}
            metalness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

export default Boxes;