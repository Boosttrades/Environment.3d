import { useCallback, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent } from 'react';
import { Activity, Maximize2, Pause, Play } from 'lucide-react';
import type { CityTelemetry, PlayerInput } from '../game/GameScene';

export interface GameHUDProps {
  active: boolean;
  inputRef: MutableRefObject<PlayerInput>;
  telemetry: CityTelemetry;
  showMetrics: boolean;
  onStart: () => void;
  onPause: () => void;
  onToggleMetrics: () => void;
}

const resetLook = (input: PlayerInput) => {
  input.lookX = 0;
  input.lookY = 0;
};

export function GameHUD({
  active,
  inputRef,
  telemetry,
  showMetrics,
  onStart,
  onPause,
  onToggleMetrics,
}: GameHUDProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const joystickPointer = useRef<number | null>(null);
  const lookPointer = useRef<number | null>(null);
  const previousLook = useRef({ x: 0, y: 0 });

  const updateJoystick = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const radius = Math.min(bounds.width, bounds.height) * 0.33;
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    const magnitude = Math.hypot(dx, dy);
    const scale = magnitude > radius ? radius / magnitude : 1;
    const x = dx * scale;
    const y = dy * scale;
    inputRef.current.moveX = Math.max(-1, Math.min(1, x / radius));
    inputRef.current.moveY = Math.max(-1, Math.min(1, -y / radius));
    const knob = joystickRef.current?.querySelector<HTMLElement>('.joystick-knob');
    if (knob) knob.style.transform = `translate(${x}px, ${y}px)`;
  }, [inputRef]);

  const releaseJoystick = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointer.current !== event.pointerId) return;
    joystickPointer.current = null;
    inputRef.current.moveX = 0;
    inputRef.current.moveY = 0;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const knob = joystickRef.current?.querySelector<HTMLElement>('.joystick-knob');
    if (knob) knob.style.transform = 'translate(0, 0)';
  }, [inputRef]);

  const onLookStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch' || lookPointer.current !== null) return;
    lookPointer.current = event.pointerId;
    previousLook.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onLookMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointer.current !== event.pointerId) return;
    const dx = event.clientX - previousLook.current.x;
    const dy = event.clientY - previousLook.current.y;
    previousLook.current = { x: event.clientX, y: event.clientY };
    inputRef.current.lookX = Math.max(-1, Math.min(1, dx * 0.012));
    inputRef.current.lookY = Math.max(-1, Math.min(1, dy * 0.012));
    requestAnimationFrame(() => resetLook(inputRef.current));
  };

  const onLookEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointer.current !== event.pointerId) return;
    lookPointer.current = null;
    resetLook(inputRef.current);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const requestJump = () => {
    inputRef.current.jumpRequested = true;
    window.setTimeout(() => { inputRef.current.jumpRequested = false; }, 100);
  };

  return (
    <div className="game-hud" aria-label="Pacific Divide game interface">
      {active ? (
        <>
          <header className="hud-topline">
            <div className="brand-lockup" aria-label="Pacific Divide">
              <div className="brand-mark" aria-hidden="true"><span>PD</span></div>
              <div>
                <p className="brand-title">PACIFIC DIVIDE</p>
                <p className="brand-caption">A quiet city, after the rain</p>
              </div>
            </div>
            <div className="header-actions">
              <button className="hud-icon-button" type="button" onClick={onToggleMetrics} aria-pressed={showMetrics} aria-label={showMetrics ? 'Hide performance metrics' : 'Show performance metrics'} data-testid="button-toggle-metrics">
                <Activity aria-hidden="true" /><span>PERFORMANCE</span>
              </button>
              <button className="hud-icon-button" type="button" onClick={onPause} aria-label="Pause exploration" data-testid="button-pause">
                <Pause aria-hidden="true" /><span>PAUSE</span>
              </button>
            </div>
          </header>

          <div className="crosshair" aria-hidden="true"><span className="crosshair-dot" /></div>

          <div className="hud-bottomline">
            <div className="location-readout" data-testid="text-zone">
              <span className="location-rule" aria-hidden="true" />
              <div>
                <div className="location-label">CURRENT DISTRICT</div>
                <div className="location-value">{telemetry.zone}</div>
              </div>
            </div>
            <div className="coordinate-readout" data-testid="text-position">
              <div><strong>X</strong> {telemetry.positionX.toFixed(1)}</div>
              <div><strong>Z</strong> {telemetry.positionZ.toFixed(1)}</div>
            </div>
          </div>

          {showMetrics && (
            <section className="metrics-panel" aria-label="Performance telemetry" data-testid="panel-performance">
              <div className="metrics-heading"><span>Scene telemetry</span><span>LIVE</span></div>
              <div className="metrics-grid">
                <div><span className="metric-label">Frame rate</span><span className="metric-value">{telemetry.fps} FPS</span></div>
                <div><span className="metric-label">Visible buildings</span><span className="metric-value">{telemetry.visibleBuildings}</span></div>
                <div><span className="metric-label">Triangles</span><span className="metric-value">{telemetry.triangles.toLocaleString()}</span></div>
                <div><span className="metric-label">Draw calls</span><span className="metric-value">{telemetry.drawCalls}</span></div>
                <div><span className="metric-label">Zone</span><span className="metric-value">{telemetry.zone}</span></div>
              </div>
            </section>
          )}

          <div
            className="joystick-zone"
            ref={joystickRef}
            aria-label="Virtual movement joystick"
            onPointerDown={(event) => {
              if (joystickPointer.current !== null) return;
              joystickPointer.current = event.pointerId;
              event.currentTarget.setPointerCapture(event.pointerId);
              updateJoystick(event);
            }}
            onPointerMove={(event) => { if (joystickPointer.current === event.pointerId) updateJoystick(event); }}
            onPointerUp={releaseJoystick}
            onPointerCancel={releaseJoystick}
            data-testid="control-joystick"
          >
            <div className="joystick-base" aria-hidden="true" />
            <div className="joystick-knob" aria-hidden="true" />
          </div>
          <div
            className="touch-look-zone"
            onPointerDown={onLookStart}
            onPointerMove={onLookMove}
            onPointerUp={onLookEnd}
            onPointerCancel={onLookEnd}
            aria-label="Touch and drag to look around"
          />
          <span className="touch-look-hint" aria-hidden="true">Drag to look</span>
          <button className="jump-button" type="button" onPointerDown={(event) => event.preventDefault()} onClick={requestJump} aria-label="Jump" data-testid="button-jump">JUMP</button>
        </>
      ) : (
        <div className="game-overlay">
          <section className="title-card" aria-labelledby="game-title">
            <div className="eyebrow">COASTAL CITY / FREE ROAM</div>
            <h1 id="game-title">{hasStarted ? 'Take a' : 'Pacific'} <span>{hasStarted ? 'breath.' : 'Divide'}</span></h1>
            <p className="title-copy">{hasStarted ? 'Your walk is paused. The waterfront will be here when you are ready.' : 'The fog is lifting over Marrow Bay. Take the long way through the waterfront, follow the hills, and see where the morning leads.'}</p>
            <div className="title-divider" />
            <div className="control-guide desktop-guide" aria-label="Desktop controls">
              <div className="guide-item"><span className="keycap">W A S D</span><span>Walk the city</span></div>
              <div className="guide-item"><span className="keycap">MOUSE</span><span>Look around</span></div>
              <div className="guide-item"><span className="keycap">↑ ↓ ← →</span><span>Alternate movement</span></div>
              <div className="guide-item"><span className="keycap">SPACE</span><span>Jump</span></div>
            </div>
            <div className="control-guide touch-guide" aria-label="Touch controls">
              <div className="guide-item"><span className="keycap">STICK</span><span>Move</span></div>
              <div className="guide-item"><span className="keycap">DRAG</span><span>Look around</span></div>
              <div className="guide-item"><span className="keycap">JUMP</span><span>Hop over low edges</span></div>
            </div>
            <button className="game-button" type="button" onClick={() => { setHasStarted(true); onStart(); }} data-testid={hasStarted ? 'button-resume' : 'button-start'}>
              <Play aria-hidden="true" /> {hasStarted ? 'Resume walk' : 'Begin exploring'}
            </button>
            <p className="title-footnote"><Maximize2 aria-hidden="true" size={11} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />Best experienced in a wide window</p>
          </section>
        </div>
      )}
      {active && <span className="sr-only" aria-live="polite">{`Current area: ${telemetry.zone}`}</span>}
    </div>
  );
}

export default GameHUD;
