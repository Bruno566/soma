import React from 'react';

interface Dice3DProps {
  value: number;
  rotations: { x: number; y: number };
  rolling: boolean;
  diceId: string;
  label: string;
}

// 3x3 layout indices:
// [0, 1, 2]
// [3, 4, 5]
// [6, 7, 8]
const FACE_CONFIGS: Record<number, { pips: number[]; isRed?: boolean }> = {
  1: { pips: [4], isRed: true },
  2: { pips: [0, 8] },
  3: { pips: [0, 4, 8] },
  4: { pips: [0, 2, 6, 8] },
  5: { pips: [0, 2, 4, 6, 8] },
  6: { pips: [0, 2, 3, 5, 6, 8] },
};

const FaceGrid: React.FC<{ faceNumber: number; faceClass: string }> = ({ faceNumber, faceClass }) => {
  const config = FACE_CONFIGS[faceNumber] || { pips: [] };
  return (
    <div className={`cube-face ${faceClass}`}>
      {Array.from({ length: 9 }).map((_, i) => {
        const hasDot = config.pips.includes(i);
        return (
          <div key={i} className="flex items-center justify-center">
            {hasDot && <span className={`pip-dot ${config.isRed ? 'red' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
};

export const Dice3D: React.FC<Dice3DProps> = ({ value, rotations, rolling, diceId, label }) => {
  return (
    <div className="flex flex-col items-center select-none">
      {/* 3D Dice Container */}
      <div className="dice-stage p-1">
        <div
          id={diceId}
          className="cube-dice"
          style={{
            transform: `rotateX(${rotations.x}deg) rotateY(${rotations.y}deg)`,
          }}
        >
          {/* Face 1: Front (0deg, 0deg) */}
          <FaceGrid faceNumber={1} faceClass="face-front" />

          {/* Face 2: Right (0deg, 90deg) */}
          <FaceGrid faceNumber={2} faceClass="face-right" />

          {/* Face 3: Back (0deg, 180deg) */}
          <FaceGrid faceNumber={3} faceClass="face-back" />

          {/* Face 4: Left (0deg, -90deg) */}
          <FaceGrid faceNumber={4} faceClass="face-left" />

          {/* Face 5: Top (90deg, 0deg) */}
          <FaceGrid faceNumber={5} faceClass="face-top" />

          {/* Face 6: Bottom (-90deg, 0deg) */}
          <FaceGrid faceNumber={6} faceClass="face-bottom" />
        </div>
      </div>

      {/* Realistic Shadow */}
      <div
        className={`mt-4 h-2.5 rounded-full transition-all duration-500 pointer-events-none ${
          rolling
            ? 'w-14 bg-rose-500/30 blur-md scale-75'
            : 'w-20 bg-slate-950/90 blur-[3px] scale-100'
        }`}
      />

      {/* Badge with Dice Label and Value */}
      <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800">
        <span className="text-[11px] font-bold text-slate-400">{label}:</span>
        <span className="font-mono text-sm font-black text-amber-400">
          {rolling ? '...' : value}
        </span>
      </div>
    </div>
  );
};
