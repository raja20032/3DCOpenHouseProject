import { useState, useEffect } from 'react';
import { Hand, MousePointer2, Camera } from 'lucide-react';
import { GestureButton } from './GestureButton';

interface MenuScreenProps {
  onStart: () => void;
  highScore: number;
  isLoading: boolean;
  permissionDenied: boolean;
  useMouseFallback: boolean;
  onEnableMouseFallback: () => void;
  onRequestCamera: () => void;
  handDetected?: boolean;
  handPosition: { x: number; y: number; isTracking: boolean };
  cameraAttempted?: boolean;
  initError?: string | null;
}

export function MenuScreen({
  onStart,
  highScore,
  isLoading,
  permissionDenied,
  useMouseFallback,
  onEnableMouseFallback,
  onRequestCamera,
  handDetected = false,
  handPosition,
  cameraAttempted = false,
  initError = null,
}: MenuScreenProps) {
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setShowInstructions((prev) => !prev);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const canPlay = !isLoading && (useMouseFallback || handDetected);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50 backdrop-blur-sm">
      {/* Colorful Fruit Ninja Title */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-baseline gap-1 mb-2">
          <span
            className="text-6xl sm:text-8xl font-bold"
            style={{
              fontFamily: 'Bangers, cursive',
              color: '#9b59b6',
              textShadow: '3px 3px 0 #2c3e50, -1px -1px 0 rgba(255,255,255,0.3)',
              WebkitTextStroke: '2px #6c3483',
            }}
          >
            F
          </span>
          <span
            className="text-6xl sm:text-8xl font-bold"
            style={{
              fontFamily: 'Bangers, cursive',
              color: '#e74c3c',
              textShadow: '3px 3px 0 #2c3e50, -1px -1px 0 rgba(255,255,255,0.3)',
              WebkitTextStroke: '2px #922b21',
            }}
          >
            R
          </span>
          <span
            className="text-6xl sm:text-8xl font-bold"
            style={{
              fontFamily: 'Bangers, cursive',
              color: '#f1c40f',
              textShadow: '3px 3px 0 #2c3e50, -1px -1px 0 rgba(255,255,255,0.3)',
              WebkitTextStroke: '2px #b7950b',
            }}
          >
            U
          </span>
          <span
            className="text-6xl sm:text-8xl font-bold"
            style={{
              fontFamily: 'Bangers, cursive',
              color: '#e67e22',
              textShadow: '3px 3px 0 #2c3e50, -1px -1px 0 rgba(255,255,255,0.3)',
              WebkitTextStroke: '2px #a04000',
            }}
          >
            I
          </span>
          <span
            className="text-6xl sm:text-8xl font-bold"
            style={{
              fontFamily: 'Bangers, cursive',
              color: '#27ae60',
              textShadow: '3px 3px 0 #2c3e50, -1px -1px 0 rgba(255,255,255,0.3)',
              WebkitTextStroke: '2px #1e8449',
            }}
          >
            T
          </span>
        </div>
        <h2
          className="text-4xl sm:text-5xl"
          style={{
            fontFamily: 'Bangers, cursive',
            background: 'linear-gradient(180deg, #ecf0f1 0%, #bdc3c7 50%, #95a5a6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            letterSpacing: '0.1em',
          }}
        >
          Ninja
        </h2>
        <p className="text-lg mt-2 text-yellow-400 font-bold tracking-widest">CV EDITION</p>
      </div>

      {/* High Score */}
      {highScore > 0 && (
        <div className="mb-8 text-center">
          <p className="text-muted-foreground text-lg font-game">BEST SCORE</p>
          <p className="score-text text-4xl text-primary">{highScore}</p>
        </div>
      )}

      {/* Status/Instructions */}
      <div className="mb-8 text-center min-h-[120px]">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-foreground font-bold text-lg">Initializing camera...</p>
            <p className="text-muted-foreground text-sm">Please allow camera access when prompted</p>
          </div>
        ) : cameraAttempted && (permissionDenied || initError) && !useMouseFallback ? (
          // Camera was attempted but failed - show failure message with retry option
          <div className="bg-card/80 p-4 rounded-lg max-w-md backdrop-blur-sm">
            <p className="text-destructive font-bold text-lg mb-2">
              {permissionDenied ? 'Camera Permission Denied' : 'Camera Setup Failed'}
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              {initError || 'An error occurred while setting up the camera.'}
            </p>
            <div className="flex flex-col gap-3">
              {!permissionDenied && (
                <GestureButton
                  onActivate={onRequestCamera}
                  handPosition={handPosition}
                  disabled={isLoading}
                  className="wood-button px-6 py-3 text-base font-game flex items-center gap-2 mx-auto"
                >
                  <Camera size={18} />
                  Try Again
                </GestureButton>
              )}
              <GestureButton
                onActivate={onEnableMouseFallback}
                handPosition={handPosition}
                className="wood-button px-6 py-3 text-base font-game flex items-center gap-2 mx-auto"
              >
                <MousePointer2 size={18} />
                Use Mouse/Touch
              </GestureButton>
            </div>
          </div>
        ) : permissionDenied && !useMouseFallback ? (
          // Initial state - show enable camera option
          <div className="bg-card/80 p-4 rounded-lg max-w-md backdrop-blur-sm">
            <p className="text-destructive font-bold text-lg mb-2">Camera Access Required</p>
            <p className="text-muted-foreground text-sm mb-4">
              Click "Enable Camera" to allow hand tracking, or use mouse/touch instead.
            </p>
            <div className="flex flex-col gap-3">
              <GestureButton
                onActivate={onRequestCamera}
                handPosition={handPosition}
                disabled={isLoading}
                className="wood-button px-6 py-3 text-base font-game flex items-center gap-2 mx-auto"
              >
                <Camera size={18} />
                Enable Camera
              </GestureButton>
              <GestureButton
                onActivate={onEnableMouseFallback}
                handPosition={handPosition}
                disabled={isLoading}
                className="wood-button px-6 py-3 text-base font-game flex items-center gap-2 mx-auto opacity-80"
              >
                <MousePointer2 size={18} />
                Use Mouse/Touch
              </GestureButton>
            </div>
          </div>
        ) : useMouseFallback ? (
          <div className={`transition-opacity duration-500 ${showInstructions ? 'opacity-100' : 'opacity-60'}`}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <MousePointer2 size={32} className="text-primary animate-pulse" />
              <p className="text-foreground font-bold text-lg">Click & drag to slice!</p>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Hold mouse/touch and swipe across fruits to slice them. Avoid the bombs!
            </p>
          </div>
        ) : !handDetected ? (
          <div className="flex flex-col items-center gap-4">
            <Hand size={48} className="text-yellow-400 animate-pulse" />
            <p className="text-yellow-400 font-bold text-lg animate-pulse">Show your hand to the camera...</p>
            <p className="text-muted-foreground text-sm max-w-xs">Point your index finger at the camera to start</p>
            <button
              onClick={onEnableMouseFallback}
              className="text-sm text-muted-foreground underline hover:text-foreground mt-2"
            >
              Or use mouse/touch instead
            </button>
          </div>
        ) : (
          <div className={`transition-opacity duration-500 ${showInstructions ? 'opacity-100' : 'opacity-60'}`}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Hand size={32} className="text-green-400" />
              <p className="text-green-400 font-bold text-lg">Hand detected! Ready to play</p>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Swipe your finger to slice fruits. Avoid the bombs!
            </p>
            <p className="text-yellow-400/80 text-xs mt-2">
              Hold your finger over a button to activate it
            </p>
          </div>
        )}
      </div>

      {/* Start Button - only show when ready */}
      {canPlay && (
        <GestureButton
          onActivate={onStart}
          handPosition={handPosition}
          className="wood-button px-10 py-5 text-2xl font-game tracking-wide animate-pulse-glow"
        >
          START GAME
        </GestureButton>
      )}

      {/* Mode indicator */}
      {!isLoading && canPlay && (
        <p className="text-muted-foreground text-xs mt-8 opacity-60">
          {useMouseFallback
            ? 'Playing with mouse/touch controls'
            : 'Hand tracking active • Hold finger over buttons to click'}
        </p>
      )}
    </div>
  );
}
