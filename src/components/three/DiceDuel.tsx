import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { GameShell } from "./GameShell";

const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-0.28, -0.28],
    [0.28, 0.28],
  ],
  3: [
    [-0.28, -0.28],
    [0, 0],
    [0.28, 0.28],
  ],
  4: [
    [-0.28, -0.28],
    [-0.28, 0.28],
    [0.28, -0.28],
    [0.28, 0.28],
  ],
  5: [
    [-0.28, -0.28],
    [-0.28, 0.28],
    [0, 0],
    [0.28, -0.28],
    [0.28, 0.28],
  ],
  6: [
    [-0.28, -0.3],
    [-0.28, 0],
    [-0.28, 0.3],
    [0.28, -0.3],
    [0.28, 0],
    [0.28, 0.3],
  ],
};

// face value -> euler that brings it to the top
const FACE_ROT: Record<number, [number, number, number]> = {
  1: [0, 0, 0],
  2: [-Math.PI / 2, 0, 0],
  3: [0, 0, Math.PI / 2],
  4: [0, 0, -Math.PI / 2],
  5: [Math.PI / 2, 0, 0],
  6: [Math.PI, 0, 0],
};

function Face({
  value,
  position,
  rotation,
}: {
  value: number;
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {PIPS[value]!.map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.01]}>
          <circleGeometry args={[0.075, 20]} />
          <meshStandardMaterial color="#1b2148" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Die({
  target,
  rolling,
  offsetX,
  color,
}: {
  target: number;
  rolling: boolean;
  offsetX: number;
  color: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const spin = useRef(0);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const g = ref.current;
    if (!g) return;
    if (rolling) {
      spin.current += dt;
      g.rotation.x += dt * 9;
      g.rotation.y += dt * 7;
      g.rotation.z += dt * 5;
      g.position.y = 0.6 + Math.abs(Math.sin(spin.current * 8)) * 0.8;
    } else {
      const [tx, ty, tz] = FACE_ROT[target] ?? [0, 0, 0];
      const k = 1 - Math.exp(-9 * dt);
      g.rotation.x += (tx - g.rotation.x) * k;
      g.rotation.y += (ty - g.rotation.y) * k;
      g.rotation.z += (tz - g.rotation.z) * k;
      g.position.y += (0.6 - g.position.y) * k;
    }
  });

  const s = 0.6;
  return (
    <group ref={ref} position={[offsetX, 0.6, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[s * 2, s * 2, s * 2]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.15} />
      </mesh>
      <Face value={1} position={[0, s + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <Face value={6} position={[0, -s - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <Face value={2} position={[0, 0, s + 0.001]} rotation={[0, 0, 0]} />
      <Face value={5} position={[0, 0, -s - 0.001]} rotation={[0, Math.PI, 0]} />
      <Face value={3} position={[s + 0.001, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Face value={4} position={[-s - 0.001, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}

export function DiceDuel() {
  const [you, setYou] = useState(5);
  const [rival, setRival] = useState(2);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<string | null>("Roll higher than the house to win.");
  const [score, setScore] = useState({ w: 0, l: 0 });

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setResult(null);
    const a = 1 + Math.floor(Math.random() * 6);
    const b = 1 + Math.floor(Math.random() * 6);
    setTimeout(() => {
      setYou(a);
      setRival(b);
      setRolling(false);
      if (a > b) {
        setScore((s) => ({ ...s, w: s.w + 1 }));
        setResult(`You rolled ${a} vs ${b} — you win!`);
      } else if (a < b) {
        setScore((s) => ({ ...s, l: s.l + 1 }));
        setResult(`You rolled ${a} vs ${b} — house wins.`);
      } else {
        setResult(`Both rolled ${a} — draw.`);
      }
    }, 1400);
  };

  return (
    <div className="space-y-3">
      <GameShell cameraPosition={[0, 5.5, 8]}>
        <Die target={you} rolling={rolling} offsetX={-1.6} color="#f2c469" />
        <Die target={rival} rolling={rolling} offsetX={1.6} color="#7f8ff5" />
      </GameShell>
      <div className="flex items-center gap-3 text-sm">
        <span className="font-semibold">You {score.w}</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-semibold">House {score.l}</span>
        <Button className="ml-auto" onClick={roll} disabled={rolling}>
          {rolling ? "Rolling..." : "Roll dice"}
        </Button>
      </div>
      {result ? <p className="text-sm text-muted-foreground">{result}</p> : null}
    </div>
  );
}
