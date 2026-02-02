export type FruitType = 'apple' | 'orange' | 'watermelon' | 'banana' | 'pineapple' | 'strawberry';

export type SpecialFruitType = 'frenzy' | 'freeze';

export interface SpecialFruit {
  id: string;
  specialType: SpecialFruitType;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
}

export interface Fruit {
  id: string;
  type: FruitType;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  sliced: boolean;
  sliceAngle?: number;
}

export interface Bomb {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  sliced: boolean;
}

export interface SlicedFruit {
  id: string;
  type: FruitType;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  half: 'left' | 'right';
  sliceAngle: number;
  createdAt: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  color: string;
  size: number;
  createdAt: number;
  lifetime: number;
}

export interface ScorePopup {
  id: string;
  x: number;
  y: number;
  score: number;
  isCombo: boolean;
  createdAt: number;
}

export type GameState = 'menu' | 'playing' | 'gameover';

export interface GameStats {
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  fruitsSliced: number;
  highScore: number;
}

export const FRUIT_COLORS: Record<FruitType, string[]> = {
  apple: ['#e53935', '#c62828', '#ffcdd2'],
  orange: ['#fb8c00', '#ef6c00', '#ffe0b2'],
  watermelon: ['#43a047', '#e53935', '#c8e6c9'],
  banana: ['#fdd835', '#f9a825', '#fff9c4'],
  pineapple: ['#ffb300', '#ff8f00', '#ffecb3'],
  strawberry: ['#e53935', '#c62828', '#ffcdd2'],
};

export const FRUIT_POINTS: Record<FruitType, number> = {
  apple: 1,
  orange: 1,
  watermelon: 2,
  banana: 1,
  pineapple: 2,
  strawberry: 1,
};
