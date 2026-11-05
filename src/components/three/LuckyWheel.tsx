import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { GameShell } from "./GameShell";

const PRIZES = [
  { label: "100", color: "#f2c469" },
  { label: "50", color: "#5f6fd6" },
  { label: "500", color: "#e77f5a" },
  { label: "10", color: "#4fb59a" },
  { label: "1000", color: "#f2c469" },
  { label: "20", color: "#5f6fd6" },
  { label: "250", color: "#e77f5a" },
  { label: "5", color: "#4fb59a" },
];

function Segment({ index, color }: { index: number; color: string }) {
  const geo = useMemo(() => {
    const step = (Math.PI * 2) / PRIZES.length;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.absarc(0, 0, 3, index * step, (index + 1) * step, false);
    shape.lineTo(0, 0);
    return new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  }, [index]);

  return (
    <mesh geometry={geo} rotation-x={-Math.PI / 2} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
    </mesh>
  );
}

function Wheel({
  angle,
  spinning,
  onSettle,
}: {
  angle: number;
  spinning: boolean;
  onSettle: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const vel = useRef(0);
  const done = useRef(true);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const g = ref.current;
    if (!g) return;
    if (spinning) {
      done.current = false;
      vel.current = 14;
      g.rotation.y += vel.current * dt;
      return;
    }
    const diff = angle - g.rotation.y;
    if (Math.abs(diff) > 0.002) {
      g.rotation.y += diff * (1 - Math.exp(-3.2 * dt));
    } else if (!done.current) {
      done.current = true;
      onSettle();
    }
  });

  const step = (Math.PI * 2) / PRIZES.length;
  return (
    <group ref={ref} position={[0, 0.3, 0]}>
      {PRIZES.map((p, i) => (
        <group key={p.label + i}>
          <Segment index={i} color={p.color} />
          <Text
            position={[
              Math.cos(i * step + step / 2) * 2,
              0.42,
              -Math.sin(i * step + step / 2) * 2,
            ]}
            rotation={[-Math.PI / 2, 0, i * step + step / 2 - Math.PI / 2]}
            fontSize={0.42}
            color="#141a35"
            anchorX="center"
            anchorY="middle"
          >
            {p.label}
          </Text>
        </group>
      ))}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.3, 24]} />
        <meshStandardMaterial color="#d8a94a" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function LuckyWheel() {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const pendingIndex = useRef(0);

  const spin = () => {
    if (spinning) return;
    setPrize(null);
    setSpinning(true);
    const index = Math.floor(Math.random() * PRIZES.length);
    pendingIndex.current = index;
    const step = (Math.PI * 2) / PRIZES.length;
    // pointer sits at +Z (front); rotate so the chosen segment centre lands there
    const target = angle + Math.PI * 2 * 5 + (Math.PI * 2 - (index * step + step / 2));
    setTimeout(() => {
      setAngle(target);
      setSpinning(false);
    }, 1200);
  };

  const settle = () => {
    const won = PRIZES[pendingIndex.current]!;
    setPrize(won.label);
    setTotal((t) => t + Number(won.label));
  };

  return (
    <div className="space-y-3">
      <GameShell cameraPosition={[0, 7.5, 7]} fov={42}>
        <Wheel angle={angle} spinning={spinning} onSettle={settle} />
        {/* pointer */}
        <mesh position={[0, 0.9, 3.4]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.3, 0.8, 4]} />
          <meshStandardMaterial color="#f5f3ff" metalness={0.5} roughness={0.25} />
        </mesh>
      </GameShell>
      <div className="flex items-center gap-3 text-sm">
        <span className="font-semibold">Won: {total} coins</span>
        <Button className="ml-auto" onClick={spin} disabled={spinning}>
          {spinning ? "Spinning..." : "Spin the wheel"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {prize ? `The wheel stopped on ${prize} coins!` : "Spin to win a coin prize."}
      </p>
    </div>
  );
}
