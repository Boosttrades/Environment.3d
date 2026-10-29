import type { MutableRefObject } from 'react';

export interface PlayerInput {
  moveX: number;
  moveY: number;
  jumpRequested: boolean;
  lookX: number;
  lookY: number;
}

export interface CityTelemetry {
  fps: number;
  triangles: number;
  drawCalls: number;
  zone: string;
  positionX: number;
  positionZ: number;
  visibleBuildings: number;
}

export interface GameSceneProps {
  active: boolean;
  inputRef: MutableRefObject<PlayerInput>;
  onTelemetry: (telemetry: CityTelemetry) => void;
}

export function GameScene({ active, inputRef, onTelemetry }: GameSceneProps) {
  void active;
  void inputRef;
  void onTelemetry;

  return (
    <div
      className="game-canvas-host"
      aria-label="Three-dimensional city game viewport"
    />
  );
}
