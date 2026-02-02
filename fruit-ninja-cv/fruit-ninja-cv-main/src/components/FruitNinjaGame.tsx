/**
 * FruitNinjaGame - Main game component
 * Orchestrates hand tracking, game engine, audio, and rendering
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useHandTracking } from '@/hooks/useHandTracking';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useAudio } from '@/hooks/useAudio';
import { GameCanvas } from './GameCanvas';
import { GameHUD } from './GameHUD';
import { MenuScreen } from './MenuScreen';
import { GameOverScreen } from './GameOverScreen';
import { CameraFeed } from './CameraFeed';
import { AudioToggle } from './AudioToggle';

// Wave colors (green -> yellow -> orange -> red as difficulty increases)
const WAVE_COLORS = ['#4ade80', '#facc15', '#fb923c', '#ef4444', '#dc2626'];

export function FruitNinjaGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const prevLivesRef = useRef(3);
  const prevScoreRef = useRef(0);
  const [screenShake, setScreenShake] = useState(false);

  // Get container dimensions
  const getCanvasDimensions = () => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return { width: 800, height: 600 };
  };

  const dimensions = getCanvasDimensions();

  // Initialize audio system
  const { playSlice, playBomb, playMiss, playCombo, playGameOver, initAudio, isAudioEnabled, toggleAudio } = useAudio();

  const {
    handPosition,
    isSwiping,
    showCamera,
    toggleCamera,
    getTrail,
    isLoading,
    permissionDenied,
    useMouseFallback,
    enableMouseFallback,
    requestCamera,
    videoRef,
    streamRef,
    cameraReady,
    handDetected,
    cameraAttempted,
    initError,
  } = useHandTracking(dimensions.width, dimensions.height);

  const {
    gameState,
    stats,
    fruits,
    bombs,
    specialFruits,
    slicedFruits,
    particles,
    scorePopups,
    bombFlash,
    activeEffect,
    currentWave,
    showWaveAnnouncement,
    criticalFlash,
    startGame,
    returnToMenu,
    checkCollisions,
    updatePhysics,
  } = useGameEngine(dimensions.width, dimensions.height);

  // Play sounds based on game state changes
  useEffect(() => {
    // Slice sound when score increases
    if (stats.score > prevScoreRef.current) {
      playSlice();
      // Combo sound for combos >= 3
      if (stats.combo >= 3) {
        setTimeout(playCombo, 50);
      }
    }
    prevScoreRef.current = stats.score;
  }, [stats.score, stats.combo, playSlice, playCombo]);

  // Miss sound + screen shake when life lost
  useEffect(() => {
    if (stats.lives < prevLivesRef.current && stats.lives > 0) {
      playMiss();
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 200);
    }
    prevLivesRef.current = stats.lives;
  }, [stats.lives, playMiss]);

  // Bomb and game over sounds
  useEffect(() => {
    if (bombFlash) {
      playBomb();
    }
  }, [bombFlash, playBomb]);

  useEffect(() => {
    if (gameState === 'gameover') {
      setTimeout(playGameOver, 300);
    }
  }, [gameState, playGameOver]);

  // Handle game start - init audio on user interaction
  const handleStartGame = useCallback(() => {
    initAudio();
    startGame();
  }, [initAudio, startGame]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState === 'playing') {
      const trail = getTrail();
      checkCollisions(trail, isSwiping);
      updatePhysics();
    }
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, getTrail, isSwiping, checkCollisions, updatePhysics]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  return (
    <div
      ref={containerRef}
      className={`relative w-screen h-screen overflow-hidden select-none ${useMouseFallback ? 'cursor-crosshair' : 'cursor-none'} ${screenShake ? 'animate-shake' : ''}`}
    >
      {/* Game Canvas */}
      <GameCanvas
        width={dimensions.width}
        height={dimensions.height}
        fruits={fruits}
        bombs={bombs}
        specialFruits={specialFruits}
        slicedFruits={slicedFruits}
        particles={particles}
        scorePopups={scorePopups}
        trail={getTrail()}
        fingerPosition={handPosition}
        isSwiping={isSwiping}
        useMouseFallback={useMouseFallback}
        activeEffect={activeEffect}
      />

      {/* Wave Announcement Overlay */}
      {showWaveAnnouncement && gameState === 'playing' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div 
            className="animate-wave-announce font-game text-7xl sm:text-8xl"
            style={{
              color: WAVE_COLORS[Math.min(currentWave - 1, WAVE_COLORS.length - 1)],
              textShadow: `0 0 30px ${WAVE_COLORS[Math.min(currentWave - 1, WAVE_COLORS.length - 1)]}, 0 4px 0 rgba(0,0,0,0.5)`,
            }}
          >
            WAVE {currentWave}
          </div>
        </div>
      )}

      {/* Critical Throw Flash */}
      {criticalFlash && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div 
            className="font-game text-5xl sm:text-6xl text-yellow-400 animate-pulse"
            style={{
              textShadow: '0 0 20px #facc15, 0 4px 0 rgba(0,0,0,0.5)',
            }}
          >
            CRITICAL!
          </div>
        </div>
      )}

      {/* Bomb Flash Overlay */}
      {bombFlash && (
        <div className="bomb-flash absolute inset-0 pointer-events-none z-30" />
      )}

      {/* HUD */}
      {gameState === 'playing' && <GameHUD stats={stats} />}

      {/* Menu Screen */}
      {gameState === 'menu' && (
        <MenuScreen
          onStart={handleStartGame}
          highScore={stats.highScore}
          isLoading={isLoading}
          permissionDenied={permissionDenied}
          useMouseFallback={useMouseFallback}
          onEnableMouseFallback={enableMouseFallback}
          onRequestCamera={requestCamera}
          handDetected={handDetected}
          handPosition={handPosition}
          cameraAttempted={cameraAttempted}
          initError={initError}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <GameOverScreen
          stats={stats}
          onRestart={startGame}
          onMenu={returnToMenu}
          handPosition={handPosition}
        />
      )}

      {/* Camera Feed - only show if camera is ready and not using mouse fallback */}
      {!useMouseFallback && cameraReady && (
        <CameraFeed
          showCamera={showCamera}
          toggleCamera={toggleCamera}
          videoRef={videoRef}
          streamRef={streamRef}
          cameraReady={cameraReady}
          handPosition={handPosition}
        />
      )}

      {/* Audio Toggle - Bottom Right (next to camera toggle) */}
      <AudioToggle isEnabled={isAudioEnabled} onToggle={toggleAudio} handPosition={handPosition} />
    </div>
  );
}
