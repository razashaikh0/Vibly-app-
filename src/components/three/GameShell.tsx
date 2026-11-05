import { Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";

/** Shared 3D stage for all mini games: warm club-table look, indigo + gold. */
export function GameShell({
  children,
  cameraPosition = [0, 6, 9],
  fov = 45,
}: {
  children: ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
}) {
  return (
    <div className="relative h-[52vh] min-h-[320px] w-full overflow-hidden rounded-3xl ring-1 ring-primary/20">
      <Canvas shadows dpr={[1, 2]} camera={{ position: cameraPosition, fov }}>
        <color attach="background" args={["#141a35"]} />
        <fog attach="fog" args={["#141a35", 14, 34]} />
        <hemisphereLight args={["#8fa4ff", "#1b1f3a", 0.7]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[6, 10, 6]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
        />
        <pointLight position={[-5, 4, -4]} intensity={18} color="#ffc85c" distance={20} />
        <Suspense fallback={null}>
          <Environment>
            <Lightformer intensity={2} position={[0, 6, 0]} scale={[12, 12, 1]} />
            <Lightformer
              intensity={1.2}
              color="#8ea8ff"
              position={[-6, 2, -2]}
              rotation-y={Math.PI / 2}
              scale={[20, 2, 1]}
            />
            <Lightformer
              intensity={1}
              color="#ffcc7a"
              position={[6, 2, 2]}
              rotation-y={-Math.PI / 2}
              scale={[20, 2, 1]}
            />
          </Environment>
          {/* felt table */}
          <mesh rotation-x={-Math.PI / 2} position-y={-0.001} receiveShadow>
            <circleGeometry args={[9, 64]} />
            <meshStandardMaterial color="#1d2750" roughness={0.95} metalness={0.05} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
            <ringGeometry args={[6.4, 6.7, 64]} />
            <meshStandardMaterial color="#d8a94a" roughness={0.35} metalness={0.8} />
          </mesh>
          <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={18} blur={2.4} far={8} />
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
