/**
 * GameCanvas - Main game rendering component
 * Renders fruits, bombs, particles, and blade trail using canvas 2D
 * Uses procedural drawing for authentic Fruit Ninja visuals
 */

import { useEffect, useRef, useCallback } from 'react';
import { Fruit, Bomb, SlicedFruit, Particle, ScorePopup, FruitType, SpecialFruit, SpecialFruitType } from '@/types/game';
import { BladePoint } from '@/hooks/useHandTracking';
import {
  drawFruit,
  drawSlicedFruit,
  drawBladeTrail,
  drawBomb,
  drawFingerIndicator,
  drawSpecialFruit,
  JUICE_COLORS,
} from '@/utils/fruitDrawing';

// Background gradient colors
const BG_COLORS = {
  top: '#5D3A1A',    // Dark wood
  bottom: '#8B5A2B', // Lighter wood
};

interface GameCanvasProps {
  width: number;
  height: number;
  fruits: Fruit[];
  bombs: Bomb[];
  specialFruits: SpecialFruit[];
  slicedFruits: SlicedFruit[];
  particles: Particle[];
  scorePopups: ScorePopup[];
  trail: BladePoint[];
  fingerPosition: { x: number; y: number; isTracking: boolean };
  isSwiping: boolean;
  useMouseFallback?: boolean;
  activeEffect?: SpecialFruitType | null;
}

export function GameCanvas({
  width,
  height,
  fruits,
  bombs,
  specialFruits,
  slicedFruits,
  particles,
  scorePopups,
  trail,
  fingerPosition,
  isSwiping,
  useMouseFallback = false,
  activeEffect,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw dark wooden background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#3d2c1e');
    bgGradient.addColorStop(0.3, '#4a3728');
    bgGradient.addColorStop(0.5, '#5c4033');
    bgGradient.addColorStop(0.7, '#4a3728');
    bgGradient.addColorStop(1, '#2d1f15');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle wood grain texture
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < height; i += 15) {
      ctx.strokeStyle = i % 30 === 0 ? '#1a1008' : '#6b4a2a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, i + Math.sin(i * 0.08) * 3);
      ctx.lineTo(width, i + Math.sin(i * 0.08 + 1.5) * 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Draw juice particles (behind fruits)
    particles.forEach(particle => {
      const age = (Date.now() - particle.createdAt) / particle.lifetime;
      const alpha = Math.max(0, 1 - age);
      const size = Math.max(0.5, particle.size * (1 - age * 0.5));

      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Juice droplet with glow - ensure radius is positive
      if (size > 0) {
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, size
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(0.7, particle.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Draw sliced fruit halves
    slicedFruits.forEach(sf => {
      const age = (Date.now() - sf.createdAt) / 1500;
      const alpha = Math.max(0, 1 - age);
      
      drawSlicedFruit(
        ctx,
        sf.type,
        sf.x,
        sf.y,
        sf.radius,
        sf.rotation,
        sf.half,
        alpha
      );
    });

    // Draw whole fruits
    fruits.forEach(fruit => {
      drawFruit(ctx, fruit.type, fruit.x, fruit.y, fruit.radius, fruit.rotation);
    });

    // Draw special power-up fruits
    specialFruits.forEach(special => {
      drawSpecialFruit(ctx, special.specialType, special.x, special.y, special.radius, special.rotation);
    });

    // Draw bombs
    bombs.forEach(bomb => {
      drawBomb(ctx, bomb.x, bomb.y, bomb.radius, bomb.rotation);
    });

    // Draw blade trail
    drawBladeTrail(ctx, trail, isSwiping);

    // Draw finger indicator (hand tracking mode only)
    if (!useMouseFallback) {
      drawFingerIndicator(ctx, fingerPosition.x, fingerPosition.y, fingerPosition.isTracking);
    }

    // Draw score popups
    scorePopups.forEach(popup => {
      const age = (Date.now() - popup.createdAt) / 1000;
      const alpha = Math.max(0, 1 - age);
      const y = popup.y - age * 80;
      const scale = 1 + age * 0.3;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(popup.x, y);
      ctx.scale(scale, scale);

      // Score text with shadow
      ctx.font = 'bold 36px Bangers, cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Shadow
      ctx.fillStyle = '#000';
      ctx.fillText(`+${popup.score}`, 3, 3);

      // Main text - gold for normal, red for combo
      ctx.fillStyle = popup.isCombo ? '#FF6B6B' : '#FFD700';
      ctx.fillText(`+${popup.score}`, 0, 0);

      // Combo label
      if (popup.isCombo) {
        ctx.font = 'bold 20px Bangers, cursive';
        ctx.fillStyle = '#FF6B6B';
        ctx.fillText('COMBO!', 0, 28);
      }

      ctx.restore();
    });

    // Draw active effect overlay
    if (activeEffect) {
      ctx.save();
      if (activeEffect === 'frenzy') {
        // Golden tint overlay
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);
      } else if (activeEffect === 'freeze') {
        // Blue tint overlay
        ctx.fillStyle = 'rgba(135, 206, 235, 0.15)';
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
    }
  }, [width, height, fruits, bombs, specialFruits, slicedFruits, particles, scorePopups, trail, fingerPosition, isSwiping, useMouseFallback, activeEffect]);

  // Animation loop
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0"
    />
  );
}
