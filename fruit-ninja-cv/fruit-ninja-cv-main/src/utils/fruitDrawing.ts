/**
 * Procedural fruit drawing utilities
 * Draws fruits using canvas gradients for authentic Fruit Ninja look
 * No external images needed - all rendered programmatically
 */

import { FruitType, SpecialFruitType } from '@/types/game';

// Fruit color definitions with skin, flesh, and highlight colors
export const FRUIT_VISUALS: Record<FruitType, {
  skin: string[];      // Outer gradient colors
  flesh: string[];     // Inner flesh color (visible when sliced)
  highlight: string;   // Shine/highlight color
  leafColor?: string;  // Stem/leaf color if applicable
}> = {
  apple: {
    skin: ['#FF4136', '#CC0000', '#8B0000'],
    flesh: ['#FFFACD', '#F5F5DC'],
    highlight: '#FF6B6B',
    leafColor: '#228B22',
  },
  orange: {
    skin: ['#FF8C00', '#FF6600', '#CC5500'],
    flesh: ['#FFB347', '#FFA500'],
    highlight: '#FFAA33',
  },
  watermelon: {
    skin: ['#228B22', '#006400', '#004400'],
    flesh: ['#FF6B6B', '#FF4444', '#CC0000'],
    highlight: '#32CD32',
  },
  banana: {
    skin: ['#FFE135', '#FFD700', '#DAA520'],
    flesh: ['#FFFACD', '#FFF8DC'],
    highlight: '#FFFF99',
  },
  pineapple: {
    skin: ['#FFB300', '#FF8C00', '#CC7000'],
    flesh: ['#FFFFE0', '#FFFACD'],
    highlight: '#FFD700',
    leafColor: '#228B22',
  },
  strawberry: {
    skin: ['#FF4444', '#CC0000', '#990000'],
    flesh: ['#FFB6C1', '#FF69B4'],
    highlight: '#FF6B6B',
    leafColor: '#228B22',
  },
};

// Juice splash colors for particles
export const JUICE_COLORS: Record<FruitType, string[]> = {
  apple: ['#FF4136', '#FF6B6B', '#FFFACD', '#CC0000'],
  orange: ['#FF8C00', '#FFB347', '#FFA500', '#FF6600'],
  watermelon: ['#FF6B6B', '#FF4444', '#228B22', '#CC0000'],
  banana: ['#FFE135', '#FFD700', '#FFFACD', '#DAA520'],
  pineapple: ['#FFB300', '#FFD700', '#FFFFE0', '#FF8C00'],
  strawberry: ['#FF4444', '#FF69B4', '#FFB6C1', '#CC0000'],
};

/**
 * Draw a whole fruit on the canvas
 */
export function drawFruit(
  ctx: CanvasRenderingContext2D,
  type: FruitType,
  x: number,
  y: number,
  radius: number,
  rotation: number
): void {
  const visuals = FRUIT_VISUALS[type];
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Draw shadow first
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  
  // Create main body gradient
  const gradient = ctx.createRadialGradient(
    -radius * 0.3, -radius * 0.3, 0,
    0, 0, radius
  );
  gradient.addColorStop(0, visuals.highlight);
  gradient.addColorStop(0.3, visuals.skin[0]);
  gradient.addColorStop(0.7, visuals.skin[1]);
  gradient.addColorStop(1, visuals.skin[2]);
  
  // Draw fruit body based on type
  ctx.beginPath();
  
  if (type === 'banana') {
    // Banana - curved shape
    drawBananaShape(ctx, radius);
  } else if (type === 'watermelon') {
    // Watermelon - oval shape
    ctx.ellipse(0, 0, radius, radius * 0.75, 0, 0, Math.PI * 2);
  } else if (type === 'pineapple') {
    // Pineapple - slightly elongated
    ctx.ellipse(0, 0, radius * 0.85, radius, 0, 0, Math.PI * 2);
  } else {
    // Default circular shape (apple, orange, strawberry)
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  }
  
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Reset shadow for details
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Add shine highlight
  const shineGradient = ctx.createRadialGradient(
    -radius * 0.4, -radius * 0.4, 0,
    -radius * 0.3, -radius * 0.3, radius * 0.4
  );
  shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.beginPath();
  ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = shineGradient;
  ctx.fill();
  
  // Draw leaf/stem if applicable
  if (visuals.leafColor && type !== 'banana') {
    drawLeaf(ctx, type, radius, visuals.leafColor);
  }
  
  // Strawberry seeds
  if (type === 'strawberry') {
    drawStrawberrySeeds(ctx, radius);
  }
  
  // Pineapple pattern
  if (type === 'pineapple') {
    drawPineapplePattern(ctx, radius);
  }
  
  ctx.restore();
}

/**
 * Draw a sliced fruit half
 */
export function drawSlicedFruit(
  ctx: CanvasRenderingContext2D,
  type: FruitType,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  half: 'left' | 'right',
  alpha: number
): void {
  const visuals = FRUIT_VISUALS[type];
  
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Clip to half
  ctx.beginPath();
  if (half === 'left') {
    ctx.rect(-radius, -radius, radius, radius * 2);
  } else {
    ctx.rect(0, -radius, radius, radius * 2);
  }
  ctx.clip();
  
  // Draw outer skin
  const skinGradient = ctx.createRadialGradient(
    -radius * 0.3, -radius * 0.3, 0,
    0, 0, radius
  );
  skinGradient.addColorStop(0, visuals.highlight);
  skinGradient.addColorStop(0.3, visuals.skin[0]);
  skinGradient.addColorStop(0.7, visuals.skin[1]);
  skinGradient.addColorStop(1, visuals.skin[2]);
  
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = skinGradient;
  ctx.fill();
  
  // Draw exposed flesh
  const fleshGradient = ctx.createRadialGradient(
    0, 0, 0,
    0, 0, radius * 0.85
  );
  fleshGradient.addColorStop(0, visuals.flesh[0]);
  fleshGradient.addColorStop(1, visuals.flesh[1] || visuals.flesh[0]);
  
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
  ctx.fillStyle = fleshGradient;
  ctx.fill();
  
  // Draw seeds/core for specific fruits
  if (type === 'apple') {
    drawAppleCore(ctx, radius);
  } else if (type === 'watermelon') {
    drawWatermelonSeeds(ctx, radius);
  } else if (type === 'orange') {
    drawOrangeSegments(ctx, radius);
  }
  
  ctx.restore();
}

/**
 * Draw the blade/swipe trail with simple point-to-point drawing (more reliable)
 */
export function drawBladeTrail(
  ctx: CanvasRenderingContext2D,
  trail: Array<{ x: number; y: number; timestamp: number }>,
  isSwiping: boolean
): void {
  if (trail.length < 2 || !isSwiping) return;
  
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Outer glow
  ctx.shadowColor = '#60DFFF';
  ctx.shadowBlur = 20;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 8;
  
  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);
  for (let i = 1; i < trail.length; i++) {
    ctx.lineTo(trail[i].x, trail[i].y);
  }
  ctx.stroke();
  
  // Inner bright core
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(96, 223, 255, 0.8)';
  ctx.lineWidth = 3;
  
  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);
  for (let i = 1; i < trail.length; i++) {
    ctx.lineTo(trail[i].x, trail[i].y);
  }
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Draw bomb with fuse and glow
 */
export function drawBomb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Red danger glow
  ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
  ctx.shadowBlur = 25;
  
  // Bomb body
  const gradient = ctx.createRadialGradient(
    -radius * 0.3, -radius * 0.3, 0,
    0, 0, radius
  );
  gradient.addColorStop(0, '#4a4a4a');
  gradient.addColorStop(0.5, '#2a2a2a');
  gradient.addColorStop(1, '#111111');
  
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Metallic highlight
  ctx.shadowBlur = 0;
  const shineGradient = ctx.createRadialGradient(
    -radius * 0.4, -radius * 0.4, 0,
    -radius * 0.3, -radius * 0.3, radius * 0.35
  );
  shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.beginPath();
  ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = shineGradient;
  ctx.fill();
  
  // Fuse
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.quadraticCurveTo(radius * 0.3, -radius * 1.3, radius * 0.5, -radius * 1.4);
  ctx.stroke();
  
  // Fuse spark
  const sparkGradient = ctx.createRadialGradient(
    radius * 0.5, -radius * 1.4, 0,
    radius * 0.5, -radius * 1.4, 8
  );
  sparkGradient.addColorStop(0, '#FFFF00');
  sparkGradient.addColorStop(0.5, '#FF6600');
  sparkGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
  
  ctx.beginPath();
  ctx.arc(radius * 0.5, -radius * 1.4, 8, 0, Math.PI * 2);
  ctx.fillStyle = sparkGradient;
  ctx.fill();
  
  // Skull warning symbol
  ctx.fillStyle = '#FF0000';
  ctx.font = `bold ${radius * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☠', 0, 0);
  
  ctx.restore();
}

/**
 * Draw finger tracking indicator
 */
export function drawFingerIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isTracking: boolean
): void {
  if (!isTracking) return;
  
  ctx.save();
  
  // Outer glow ring
  const gradient = ctx.createRadialGradient(x, y, 5, x, y, 35);
  gradient.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
  gradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.4)');
  gradient.addColorStop(1, 'rgba(255, 200, 50, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, 35, 0, Math.PI * 2);
  ctx.fill();
  
  // Middle ring
  ctx.strokeStyle = '#FFC832';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.stroke();
  
  // Center dot
  ctx.fillStyle = '#FFC832';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// Helper functions for fruit details

function drawBananaShape(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.moveTo(-radius * 0.8, radius * 0.3);
  ctx.quadraticCurveTo(-radius * 0.5, -radius * 0.8, radius * 0.3, -radius * 0.6);
  ctx.quadraticCurveTo(radius * 0.9, -radius * 0.4, radius * 0.8, radius * 0.1);
  ctx.quadraticCurveTo(radius * 0.5, radius * 0.5, -radius * 0.3, radius * 0.4);
  ctx.quadraticCurveTo(-radius * 0.9, radius * 0.3, -radius * 0.8, radius * 0.3);
  ctx.closePath();
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  type: FruitType,
  radius: number,
  color: string
): void {
  ctx.fillStyle = color;
  
  if (type === 'apple' || type === 'strawberry') {
    // Stem
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-2, -radius - 8, 4, 12);
    
    // Leaf
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(8, -radius - 5, 12, 6, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'pineapple') {
    // Crown leaves
    for (let i = 0; i < 5; i++) {
      const angle = (i - 2) * 0.3;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-4, -radius);
      ctx.quadraticCurveTo(0, -radius - 25, 4, -radius);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawStrawberrySeeds(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r = radius * 0.6;
    const seedX = Math.cos(angle) * r;
    const seedY = Math.sin(angle) * r;
    
    ctx.beginPath();
    ctx.ellipse(seedX, seedY, 3, 2, angle, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPineapplePattern(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
  ctx.lineWidth = 1;
  
  // Diamond pattern
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-radius, i * radius * 0.25);
    ctx.lineTo(radius, i * radius * 0.25);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(i * radius * 0.3, -radius);
    ctx.lineTo(i * radius * 0.3, radius);
    ctx.stroke();
  }
}

function drawAppleCore(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.fillStyle = '#8B4513';
  // Seeds
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.ellipse(i * radius * 0.15, 0, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWatermelonSeeds(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.fillStyle = '#111111';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
    const r = radius * (0.3 + Math.random() * 0.3);
    const seedX = Math.cos(angle) * r;
    const seedY = Math.sin(angle) * r;
    
    ctx.beginPath();
    ctx.ellipse(seedX, seedY, 4, 7, angle, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOrangeSegments(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  
  // Radial segments
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * radius * 0.8, Math.sin(angle) * radius * 0.8);
    ctx.stroke();
  }
  
  // Center
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw a special power-up fruit with distinctive glow
 */
export function drawSpecialFruit(
  ctx: CanvasRenderingContext2D,
  specialType: SpecialFruitType,
  x: number,
  y: number,
  radius: number,
  rotation: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  
  if (specialType === 'frenzy') {
    // Frenzy Banana - Golden glowing banana
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 30;
    
    // Draw banana shape with golden gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, '#FFFF00');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    drawBananaShape(ctx, radius);
    ctx.fill();
    
    // Add sparkle effect
    ctx.shadowBlur = 0;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + rotation * 0.02;
      const sparkleX = Math.cos(angle) * radius * 0.6;
      const sparkleY = Math.sin(angle) * radius * 0.6;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // "FRENZY" indicator
    ctx.fillStyle = '#FF4500';
    ctx.font = `bold ${radius * 0.35}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 0, 0);
  } else {
    // Freeze Fruit - Blue ice cube effect
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 35;
    
    // Ice crystal shape
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, '#E0FFFF');
    gradient.addColorStop(0.4, '#87CEEB');
    gradient.addColorStop(0.8, '#00BFFF');
    gradient.addColorStop(1, '#1E90FF');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    // Hexagonal ice shape
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * radius * 0.9;
      const py = Math.sin(angle) * radius * 0.9;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    
    // Ice crystal inner pattern
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * radius * 0.7, Math.sin(angle) * radius * 0.7);
      ctx.lineTo(Math.cos(angle + Math.PI) * radius * 0.7, Math.sin(angle + Math.PI) * radius * 0.7);
      ctx.stroke();
    }
    
    // Snowflake symbol
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${radius * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❄', 0, 0);
  }
  
  ctx.restore();
}
