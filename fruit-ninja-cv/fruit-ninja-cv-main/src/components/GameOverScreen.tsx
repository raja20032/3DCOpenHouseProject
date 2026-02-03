/**
 * GameOverScreen - End of game summary with stats and star rating
 * Styled to match authentic Fruit Ninja aesthetic
 */

import { GameStats } from '@/types/game';
import { Trophy, RotateCcw, Home, Star } from 'lucide-react';
import { GestureButton } from './GestureButton';

interface GameOverScreenProps {
  stats: GameStats;
  onRestart: () => void;
  onMenu: () => void;
  handPosition: { x: number; y: number; isTracking: boolean };
}

// Calculate star rating based on score
function getStarRating(score: number): number {
  if (score >= 100) return 3;
  if (score >= 50) return 2;
  if (score >= 20) return 1;
  return 0;
}

export function GameOverScreen({ stats, onRestart, onMenu, handPosition }: GameOverScreenProps) {
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;
  const stars = getStarRating(stats.score);

  return (
    <div className="game-over-overlay absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/70">
      {/* Game Over Title */}
      <div className="text-center mb-4">
        <h1 className="game-title text-5xl sm:text-7xl text-destructive mb-2">GAME OVER</h1>
        {isNewHighScore && (
          <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
            <Trophy size={28} className="text-yellow-400" />
            <span className="font-game text-2xl text-yellow-400">NEW HIGH SCORE!</span>
            <Trophy size={28} className="text-yellow-400" />
          </div>
        )}
      </div>

      {/* Star Rating */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Star
            key={i}
            size={48}
            className={`transition-all duration-300 ${
              i < stars ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg' : 'text-gray-600'
            }`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animation: i < stars ? 'combo-pop 0.5s ease-out forwards' : 'none',
            }}
          />
        ))}
      </div>

      {/* Stats Card */}
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-6 mb-8 min-w-[300px] border border-border shadow-2xl">
        <div className="space-y-4">
          {/* Main Score */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-game text-lg">SCORE</span>
            <span className="score-text text-5xl text-primary">{stats.score}</span>
          </div>

          <div className="h-px bg-border" />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-muted-foreground font-game text-xs uppercase">Fruits</p>
              <p className="font-game text-foreground text-2xl">{stats.fruitsSliced}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground font-game text-xs uppercase">Best Combo</p>
              <p className="font-game text-2xl" style={{ color: 'hsl(var(--game-combo))' }}>
                {stats.maxCombo}x
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* High Score */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-game text-sm">HIGH SCORE</span>
            <span className="font-game text-primary text-xl">{stats.highScore}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <GestureButton
          onActivate={onRestart}
          handPosition={handPosition}
          className="wood-button px-8 py-4 flex items-center gap-2 text-xl font-game"
        >
          <RotateCcw size={22} />
          PLAY AGAIN
        </GestureButton>

        <GestureButton
          onActivate={onMenu}
          handPosition={handPosition}
          className="px-8 py-4 flex items-center gap-2 text-xl font-game rounded-xl"
          style={{
            background: 'linear-gradient(180deg, #6b7280 0%, #4b5563 50%, #374151 100%)',
            border: '3px solid #1f2937',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), 0 4px 0 #111827, 0 6px 12px rgba(0,0,0,0.4)',
            color: '#f3f4f6',
            textShadow: '1px 2px 0 #111827',
          }}
        >
          <Home size={22} />
          MENU
        </GestureButton>
      </div>

      {/* Hint for hand tracking users */}
      <p className="text-muted-foreground text-xs mt-6 opacity-60">
        Hold your finger over a button to activate it
      </p>
    </div>
  );
}
