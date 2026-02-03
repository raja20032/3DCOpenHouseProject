/**
 * GameHUD - Heads-up display showing score, combo, and lives
 * Styled to match authentic Fruit Ninja arcade aesthetic
 */

import { GameStats } from '@/types/game';
import { X } from 'lucide-react';

interface GameHUDProps {
  stats: GameStats;
}

// Combo text based on combo count
function getComboText(combo: number): string | null {
  if (combo >= 8) return 'FRENZY!';
  if (combo >= 6) return 'BLITZ!';
  if (combo >= 4) return 'AWESOME!';
  if (combo >= 2) return 'GREAT!';
  return null;
}

export function GameHUD({ stats }: GameHUDProps) {
  const comboText = getComboText(stats.combo);

  return (
    <>
      {/* Main HUD - Score and Combo */}
      <div className="absolute inset-x-0 top-0 p-4 pointer-events-none z-10">
        <div className="flex justify-between items-start max-w-4xl mx-auto">
          {/* Score - Left side */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-game-red to-red-900 flex items-center justify-center shadow-lg border-2 border-yellow-400">
              <span className="text-2xl">🍎</span>
            </div>
            <span className="score-text text-5xl text-primary drop-shadow-lg">
              {stats.score}
            </span>
          </div>

          {/* Combo - Center */}
          <div className="text-center">
            {comboText && (
              <div 
                key={stats.combo} 
                className="combo-text text-3xl mb-1"
                style={{ color: 'hsl(var(--game-combo))' }}
              >
                {stats.combo}x {comboText}
              </div>
            )}
            <div className="text-muted-foreground text-sm font-game tracking-wider">
              BEST: {stats.highScore}
            </div>
          </div>

          {/* Empty spacer for symmetry - lives moved to fixed position */}
          <div className="w-32" />
        </div>
      </div>

      {/* Lives - Fixed Top Right (X marks like original - BLUE when unused, RED when lost) */}
      <div className="fixed top-4 right-4 flex gap-2 z-40 pointer-events-none">
        {Array.from({ length: 3 }).map((_, i) => (
          <X
            key={i}
            size={40}
            strokeWidth={5}
            style={{
              color: i >= stats.lives ? '#ef4444' : '#3b82f6',
              filter: i >= stats.lives 
                ? 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.9))' 
                : 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))',
              opacity: i >= stats.lives ? 1 : 0.8,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </>
  );
}
