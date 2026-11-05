import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { GameShell } from "./GameShell";

const DARES = [
  "Sing 8 seconds of any song",
  "Say your crush's first letter",
  "Do your best filmy dialogue",
  "Give a compliment to the host",
  "Speak in a funny accent for 30s",
  "Tell one embarrassing story",
];

function Bottle({
  angle,
  spinning,
  onSettle,
}: {
  angle: number;
  spinning: boolean;
  onSettle: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const done = useRef(true);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const g = ref.current;
    if (!g) return;
    if (spinning) {
      done.current = false;
      g.rotation.y += 16 * dt;
      return;
    }
    const diff = angle - g.rotation.y;
    if (Math.abs(diff) > 0.002) {
      g.rotation.y += diff * (1 - Math.exp(-3 * dt));
    } else if (!done.current) {
      done.current = true;
      onSettle();
    }
  });

  return (
    <group ref={ref} position={[0, 0.05, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.42, 1, 20]} />
        <meshStandardMaterial color="#2f9e6f" roughness={0.15} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <coneGeometry args={[0.35, 0.5, 20]} />
        <meshStandardMaterial color="#2f9e6f" roughness={0.15} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.45, 16]} />
        <meshStandardMaterial color="#2f9e6f" roughness={0.15} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.82, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.14, 16]} />
        <meshStandardMaterial color="#d8a94a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* neck points along +Z so the tip marks the chosen player */}
      <mesh position={[0, 0.5, 0.9]} rotation-x={Math.PI / 2} castShadow>
        <coneGeometry args={[0.16, 0.5, 12]} />
        <meshStandardMaterial color="#f2c469" metalness={0.6} roughness={0.25} />
      </mesh>
    </group>
  );
}

export function SpinBottle({ players }: { players: string[] }) {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [dare, setDare] = useState<string | null>(null);
  const pending = useRef(0);

  const step = (Math.PI * 2) / players.length;

  const spin = () => {
    if (spinning) return;
    setPicked(null);
    setDare(null);
    setSpinning(true);
    const index = Math.floor(Math.random() * players.length);
    pending.current = index;
    const target = angle + Math.PI * 2 * 4 + (index * step - (angle % (Math.PI * 2)));
    setTimeout(() => {
      setAngle(target);
      setSpinning(false);
    }, 1100);
  };

  const settle = () => {
    setPicked(players[pending.current] ?? null);
    setDare(DARES[Math.floor(Math.random() * DARES.length)]!);
  };

  return (
    <div className="space-y-3">
      <GameShell cameraPosition={[0, 6.5, 7]} fov={45}>
        <Bottle angle={angle} spinning={spinning} onSettle={settle} />
        {players.map((name, i) => {
          const a = i * step;
          const x = Math.sin(a) * 3.6;
          const z = Math.cos(a) * 3.6;
          return (
            <group key={name + i} position={[x, 0, z]}>
              <mesh position={[0, 0.45, 0]} castShadow>
                <capsuleGeometry args={[0.28, 0.45, 6, 14]} />
                <meshStandardMaterial
                  color={picked === name ? "#f2c469" : "#6b79e0"}
                  roughness={0.35}
                  metalness={0.15}
                />
              </mesh>
              <Text
                position={[0, 1.25, 0]}
                fontSize={0.3}
                color="#f3f5ff"
                anchorX="center"
                anchorY="middle"
                rotation={[-0.35, 0, 0]}
              >
                {name}
              </Text>
            </group>
          );
        })}
      </GameShell>
      <div className="flex items-center gap-3 text-sm">
        <span className="font-semibold">{picked ? `${picked} is up!` : "Spin the bottle"}</span>
        <Button className="ml-auto" onClick={spin} disabled={spinning}>
          {spinning ? "Spinning..." : "Spin"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{dare ?? "Whoever the bottle points at gets a dare."}</p>
    </div>
  );
}
