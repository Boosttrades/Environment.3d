import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { GameScene, type CityTelemetry, type PlayerInput } from '@/game/GameScene';
import { GameHUD } from '@/components/GameHUD';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [active, setActive] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const inputRef = useRef<PlayerInput>({
    moveX: 0,
    moveY: 0,
    jumpRequested: false,
    lookX: 0,
    lookY: 0,
  });
  const [telemetry, setTelemetry] = useState<CityTelemetry>({
    fps: 0,
    triangles: 0,
    drawCalls: 0,
    zone: 'Marrow Bay',
    positionX: 0,
    positionZ: 0,
    visibleBuildings: 0,
  });

  useEffect(() => {
    const handlePointerLockChange = () => {
      if (active && !document.pointerLockElement && !window.matchMedia('(pointer: coarse)').matches) {
        setActive(false);
        inputRef.current.moveX = 0;
        inputRef.current.moveY = 0;
        inputRef.current.jumpRequested = false;
        inputRef.current.lookX = 0;
        inputRef.current.lookY = 0;
      }
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
  }, [active]);

  const start = useCallback(() => {
    setActive(true);
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const canvas = document.querySelector<HTMLCanvasElement>('.game-canvas-host canvas');
    if (canvas?.requestPointerLock) {
      try {
        const lockRequest = canvas.requestPointerLock();
        if (lockRequest instanceof Promise) void lockRequest.catch(() => undefined);
      } catch {
        // Browsers may deny pointer lock; the game remains playable.
      }
    }
  }, []);

  const pause = useCallback(() => {
    setActive(false);
    if (document.pointerLockElement) document.exitPointerLock();
    inputRef.current.moveX = 0;
    inputRef.current.moveY = 0;
    inputRef.current.jumpRequested = false;
    inputRef.current.lookX = 0;
    inputRef.current.lookY = 0;
  }, []);

  return (
    <main className="game-shell" aria-label="Pacific Divide">
      <GameScene active={active} inputRef={inputRef} onTelemetry={setTelemetry} />
      <GameHUD
        active={active}
        inputRef={inputRef}
        telemetry={telemetry}
        showMetrics={showMetrics}
        onStart={start}
        onPause={pause}
        onToggleMetrics={() => setShowMetrics((visible) => !visible)}
      />
    </main>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
