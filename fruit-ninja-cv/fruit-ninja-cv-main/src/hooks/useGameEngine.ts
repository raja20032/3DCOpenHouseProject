import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Fruit,
  Bomb,
  SlicedFruit,
  Particle,
  ScorePopup,
  GameState,
  GameStats,
  FruitType,
  SpecialFruit,
  SpecialFruitType,
  FRUIT_COLORS,
  FRUIT_POINTS,
} from '@/types/game';
import { BladePoint } from './useHandTracking';

const GRAVITY = 0.4;
const INITIAL_LIVES = 3;
const SPAWN_INTERVAL_BASE = 1500;
const SPAWN_INTERVAL_MIN = 600;
const BOMB_CHANCE_BASE = 0.15;
const BOMB_CHANCE_MAX = 0.35;
const PARTICLE_COUNT = 12;
const PARTICLE_LIFETIME = 600;
const SLICED_FRUIT_LIFETIME = 1500;
const SCORE_POPUP_LIFETIME = 1000;
const COMBO_WINDOW = 800;
const SPECIAL_FRUIT_CHANCE = 0.08; // 8% chance for power-up fruits (reduced for difficulty)
const SPECIAL_FRUIT_MIN_WAVE = 1; // Start spawning from wave 1
const GUARANTEED_SPECIAL_INTERVAL = 15; // Force a special every 15 spawn cycles (increased for difficulty)
const CRITICAL_THROW_CHANCE = 0.12; // 12% chance for critical multi-fruit throw

const FRUIT_TYPES: FruitType[] = ['apple', 'orange', 'watermelon', 'banana', 'pineapple', 'strawberry'];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function lineCircleIntersection(
  x1: number, y1: number,
  x2: number, y2: number,
  cx: number, cy: number,
  r: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = (fx * fx + fy * fy) - r * r;

  let discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) return false;

  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

export function useGameEngine(canvasWidth: number, canvasHeight: number) {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    lives: INITIAL_LIVES,
    combo: 0,
    maxCombo: 0,
    fruitsSliced: 0,
    highScore: parseInt(localStorage.getItem('fruitNinjaHighScore') || '0'),
  });
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [specialFruits, setSpecialFruits] = useState<SpecialFruit[]>([]);
  const [slicedFruits, setSlicedFruits] = useState<SlicedFruit[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [bombFlash, setBombFlash] = useState(false);
  const [activeEffect, setActiveEffect] = useState<SpecialFruitType | null>(null);
  const [timeScale, setTimeScale] = useState(1);

  const lastSpawnRef = useRef<number>(0);
  const lastComboTimeRef = useRef<number>(0);
  const gameLoopRef = useRef<number | null>(null);
  const waveRef = useRef<number>(1);
  const effectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spawnsSinceSpecialRef = useRef<number>(0);
  const [currentWave, setCurrentWave] = useState(1);
  const [showWaveAnnouncement, setShowWaveAnnouncement] = useState(false);
  const [criticalFlash, setCriticalFlash] = useState(false);

  const spawnFruit = useCallback(() => {
    const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    const spawnX = Math.random() * (canvasWidth - 100) + 50;
    const targetX = canvasWidth / 2 + (Math.random() - 0.5) * canvasWidth * 0.5;
    const velocityX = (targetX - spawnX) * 0.02 + (Math.random() - 0.5) * 2;
    
    const fruit: Fruit = {
      id: generateId(),
      type,
      x: spawnX,
      y: canvasHeight + 50,
      velocityX,
      velocityY: -(14 + Math.random() * 6 + waveRef.current * 0.5),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      radius: type === 'watermelon' || type === 'pineapple' ? 50 : 35,
      sliced: false,
    };

    setFruits(prev => [...prev, fruit]);
  }, [canvasWidth, canvasHeight]);

  const spawnBomb = useCallback(() => {
    const spawnX = Math.random() * (canvasWidth - 100) + 50;
    const targetX = canvasWidth / 2 + (Math.random() - 0.5) * canvasWidth * 0.5;
    const velocityX = (targetX - spawnX) * 0.02 + (Math.random() - 0.5) * 2;

    const bomb: Bomb = {
      id: generateId(),
      x: spawnX,
      y: canvasHeight + 50,
      velocityX,
      velocityY: -(14 + Math.random() * 5),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 6,
      radius: 40,
      sliced: false,
    };

    setBombs(prev => [...prev, bomb]);
  }, [canvasWidth, canvasHeight]);

  // Spawn special power-up fruit
  const spawnSpecialFruit = useCallback((type: SpecialFruitType) => {
    const spawnX = Math.random() * (canvasWidth - 100) + 50;
    const targetX = canvasWidth / 2 + (Math.random() - 0.5) * canvasWidth * 0.3;
    const velocityX = (targetX - spawnX) * 0.02;

    const special: SpecialFruit = {
      id: generateId(),
      specialType: type,
      x: spawnX,
      y: canvasHeight + 50,
      velocityX,
      velocityY: -(14 + Math.random() * 4), // Higher arc for visibility
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 6,
      radius: 45,
    };

    setSpecialFruits(prev => [...prev, special]);
  }, [canvasWidth, canvasHeight]);

  // Activate Frenzy effect (slow-mo + fruit shower)
  const activateFrenzy = useCallback(() => {
    // Clear any existing effect
    if (effectTimeoutRef.current) {
      clearTimeout(effectTimeoutRef.current);
    }

    setActiveEffect('frenzy');
    setTimeScale(0.3); // Slow motion

    // Spawn 15-18 fruits rapidly (NO bombs during frenzy!)
    for (let i = 0; i < 16; i++) {
      setTimeout(() => {
        if (gameState === 'playing') {
          spawnFruit();
        }
      }, i * 80);
    }

    // Effect lasts 4 seconds
    effectTimeoutRef.current = setTimeout(() => {
      setActiveEffect(null);
      setTimeScale(1);
    }, 4000);
  }, [spawnFruit, gameState]);

  // Activate Freeze effect (everything slows down)
  const activateFreeze = useCallback(() => {
    if (effectTimeoutRef.current) {
      clearTimeout(effectTimeoutRef.current);
    }

    setActiveEffect('freeze');
    setTimeScale(0.2); // Very slow

    // Lasts 3 seconds
    effectTimeoutRef.current = setTimeout(() => {
      setActiveEffect(null);
      setTimeScale(1);
    }, 3000);
  }, []);

  // Note: sliceSpecialFruit defined after addScorePopup below

  const createParticles = useCallback((x: number, y: number, type: FruitType) => {
    const colors = FRUIT_COLORS[type];
    const newParticles: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5;
      const speed = 3 + Math.random() * 5;
      
      newParticles.push({
        id: generateId(),
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 8,
        createdAt: Date.now(),
        lifetime: PARTICLE_LIFETIME,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const createSlicedFruit = useCallback((fruit: Fruit, sliceAngle: number) => {
    const leftHalf: SlicedFruit = {
      id: generateId(),
      type: fruit.type,
      x: fruit.x,
      y: fruit.y,
      velocityX: fruit.velocityX - 3,
      velocityY: fruit.velocityY - 2,
      rotation: fruit.rotation,
      rotationSpeed: -8,
      radius: fruit.radius,
      half: 'left',
      sliceAngle,
      createdAt: Date.now(),
    };

    const rightHalf: SlicedFruit = {
      id: generateId(),
      type: fruit.type,
      x: fruit.x,
      y: fruit.y,
      velocityX: fruit.velocityX + 3,
      velocityY: fruit.velocityY - 2,
      rotation: fruit.rotation,
      rotationSpeed: 8,
      radius: fruit.radius,
      half: 'right',
      sliceAngle,
      createdAt: Date.now(),
    };

    setSlicedFruits(prev => [...prev, leftHalf, rightHalf]);
  }, []);

  const addScorePopup = useCallback((x: number, y: number, score: number, isCombo: boolean) => {
    const popup: ScorePopup = {
      id: generateId(),
      x,
      y,
      score,
      isCombo,
      createdAt: Date.now(),
    };
    setScorePopups(prev => [...prev, popup]);
  }, []);

  // Slice special fruit (defined after addScorePopup)
  const sliceSpecialFruit = useCallback((special: SpecialFruit) => {
    // Create golden/ice particles
    const colors = special.specialType === 'frenzy' 
      ? ['#FFD700', '#FFA500', '#FF6347', '#FFFF00']
      : ['#00FFFF', '#87CEEB', '#ADD8E6', '#E0FFFF'];
    
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5;
      const speed = 4 + Math.random() * 6;
      
      newParticles.push({
        id: generateId(),
        x: special.x,
        y: special.y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 10,
        createdAt: Date.now(),
        lifetime: PARTICLE_LIFETIME * 1.5,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);

    // Add score popup
    addScorePopup(special.x, special.y, 50, true);
    
    // Add to score
    setStats(prev => ({
      ...prev,
      score: prev.score + 50,
    }));

    // Remove special fruit
    setSpecialFruits(prev => prev.filter(s => s.id !== special.id));

    // Activate effect
    if (special.specialType === 'frenzy') {
      activateFrenzy();
    } else {
      activateFreeze();
    }
  }, [addScorePopup, activateFrenzy, activateFreeze]);

  const sliceFruit = useCallback((fruit: Fruit, sliceAngle: number) => {
    const now = Date.now();
    
    // Check if this is part of a combo chain (within window of last slice)
    const timeSinceLastSlice = now - lastComboTimeRef.current;
    const isPartOfCombo = timeSinceLastSlice < COMBO_WINDOW && lastComboTimeRef.current > 0;
    
    // Update timestamp AFTER checking (fixes the race condition)
    lastComboTimeRef.current = now;

    const basePoints = FRUIT_POINTS[fruit.type];
    let comboMultiplier = 1;
    let isComboDisplay = false;

    setStats(prev => {
      // If within combo window, increment combo; otherwise reset to 1
      const newCombo = isPartOfCombo ? prev.combo + 1 : 1;
      comboMultiplier = Math.min(newCombo, 8); // Allow up to 8x multiplier
      isComboDisplay = newCombo >= 2; // Show combo text for 2+ chain
      
      const points = basePoints * comboMultiplier;
      const newScore = prev.score + points;
      const newHighScore = Math.max(newScore, prev.highScore);

      if (newHighScore > prev.highScore) {
        localStorage.setItem('fruitNinjaHighScore', newHighScore.toString());
      }

      return {
        ...prev,
        score: newScore,
        combo: newCombo,
        maxCombo: Math.max(newCombo, prev.maxCombo),
        fruitsSliced: prev.fruitsSliced + 1,
        highScore: newHighScore,
      };
    });

    // Create visual effects
    createParticles(fruit.x, fruit.y, fruit.type);
    createSlicedFruit(fruit, sliceAngle);
    addScorePopup(fruit.x, fruit.y, basePoints * comboMultiplier, isComboDisplay);

    // Remove from fruits list
    setFruits(prev => prev.filter(f => f.id !== fruit.id));
  }, [createParticles, createSlicedFruit, addScorePopup]);

  const sliceBomb = useCallback(() => {
    setBombFlash(true);
    setTimeout(() => setBombFlash(false), 300);

    setStats(prev => {
      const newHighScore = Math.max(prev.score, prev.highScore);
      if (newHighScore > prev.highScore) {
        localStorage.setItem('fruitNinjaHighScore', newHighScore.toString());
      }
      return { ...prev, lives: 0, highScore: newHighScore };
    });
    
    setGameState('gameover');
  }, []);

  const checkCollisions = useCallback((trail: BladePoint[], isSwiping: boolean) => {
    if (!isSwiping || trail.length < 2) return;

    // Check last 4 segments for more forgiving hit detection
    for (let i = Math.max(0, trail.length - 5); i < trail.length - 1; i++) {
      const p1 = trail[i];
      const p2 = trail[i + 1];
      const sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      // Check fruits (with slightly larger hitbox)
      fruits.forEach(fruit => {
        if (!fruit.sliced && lineCircleIntersection(p1.x, p1.y, p2.x, p2.y, fruit.x, fruit.y, fruit.radius * 1.15)) {
          sliceFruit(fruit, sliceAngle);
        }
      });

      // Check special fruits
      specialFruits.forEach(special => {
        if (lineCircleIntersection(p1.x, p1.y, p2.x, p2.y, special.x, special.y, special.radius * 1.2)) {
          sliceSpecialFruit(special);
        }
      });

      // Check bombs (only if not in frenzy mode - you're immune during frenzy!)
      if (activeEffect !== 'frenzy') {
        bombs.forEach(bomb => {
          if (!bomb.sliced && lineCircleIntersection(p1.x, p1.y, p2.x, p2.y, bomb.x, bomb.y, bomb.radius)) {
            sliceBomb();
          }
        });
      }
    }
  }, [fruits, bombs, specialFruits, activeEffect, sliceFruit, sliceBomb, sliceSpecialFruit]);

  const updatePhysics = useCallback(() => {
    const now = Date.now();
    
    // Apply time scale to gravity for slow-mo effects
    const adjustedGravity = GRAVITY * timeScale;
    setFruits(prev => {
      const updated: Fruit[] = [];
      let missedCount = 0;

      prev.forEach(fruit => {
        const newFruit = {
          ...fruit,
          x: fruit.x + fruit.velocityX * timeScale,
          y: fruit.y + fruit.velocityY * timeScale,
          velocityY: fruit.velocityY + adjustedGravity,
          rotation: fruit.rotation + fruit.rotationSpeed * timeScale,
        };

        // Check if fruit fell off screen without being sliced
        if (newFruit.y > canvasHeight + 100) {
          missedCount++;
        } else {
          updated.push(newFruit);
        }
      });

      if (missedCount > 0) {
        setStats(prev => {
          const newLives = prev.lives - missedCount;
          if (newLives <= 0) {
            const newHighScore = Math.max(prev.score, prev.highScore);
            localStorage.setItem('fruitNinjaHighScore', newHighScore.toString());
            setGameState('gameover');
            return { ...prev, lives: 0, highScore: newHighScore };
          }
          return { ...prev, lives: newLives };
        });
      }

      return updated;
    });

    // Update bombs
    setBombs(prev =>
      prev
        .map(bomb => ({
          ...bomb,
          x: bomb.x + bomb.velocityX * timeScale,
          y: bomb.y + bomb.velocityY * timeScale,
          velocityY: bomb.velocityY + adjustedGravity,
          rotation: bomb.rotation + bomb.rotationSpeed * timeScale,
        }))
        .filter(bomb => bomb.y < canvasHeight + 100)
    );

    // Update special fruits (power-ups) - FIX: was missing physics!
    setSpecialFruits(prev =>
      prev
        .map(special => ({
          ...special,
          x: special.x + special.velocityX * timeScale,
          y: special.y + special.velocityY * timeScale,
          velocityY: special.velocityY + adjustedGravity,
          rotation: special.rotation + special.rotationSpeed * timeScale,
        }))
        .filter(special => special.y < canvasHeight + 100)
    );

    // Update sliced fruits
    setSlicedFruits(prev =>
      prev
        .map(sf => ({
          ...sf,
          x: sf.x + sf.velocityX * timeScale,
          y: sf.y + sf.velocityY * timeScale,
          velocityY: sf.velocityY + adjustedGravity,
          rotation: sf.rotation + sf.rotationSpeed * timeScale,
        }))
        .filter(sf => now - sf.createdAt < SLICED_FRUIT_LIFETIME)
    );

    // Update particles
    setParticles(prev =>
      prev
        .map(p => ({
          ...p,
          x: p.x + p.velocityX * timeScale,
          y: p.y + p.velocityY * timeScale,
          velocityY: p.velocityY + adjustedGravity * 0.5,
        }))
        .filter(p => now - p.createdAt < p.lifetime)
    );

    // Update score popups
    setScorePopups(prev => prev.filter(sp => now - sp.createdAt < SCORE_POPUP_LIFETIME));

    // Spawn new fruits/bombs (skip during frenzy - we handle spawning there)
    if (activeEffect !== 'frenzy') {
      const spawnInterval = Math.max(
        SPAWN_INTERVAL_MIN,
        SPAWN_INTERVAL_BASE - waveRef.current * 100
      );

      if (now - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = now;
        spawnsSinceSpecialRef.current++;
        
        // Check for critical throw (4-5 fruits in tight arc)
        if (Math.random() < CRITICAL_THROW_CHANCE) {
          const criticalCount = 4 + Math.floor(Math.random() * 2);
          const baseX = Math.random() * (canvasWidth * 0.6) + canvasWidth * 0.2;
          for (let i = 0; i < criticalCount; i++) {
            setTimeout(() => spawnFruit(), i * 60);
          }
          setCriticalFlash(true);
          setTimeout(() => setCriticalFlash(false), 400);
        } else {
          // Regular spawn: 1-3 fruits
          const fruitCount = 1 + Math.floor(Math.random() * Math.min(3, waveRef.current));
          for (let i = 0; i < fruitCount; i++) {
            setTimeout(() => spawnFruit(), i * 100);
          }

          // Maybe spawn a bomb
          const bombChance = Math.min(BOMB_CHANCE_MAX, BOMB_CHANCE_BASE + waveRef.current * 0.03);
          if (Math.random() < bombChance) {
            spawnBomb();
          }
        }

        // Special fruit spawning (more frequent + guaranteed interval)
        const shouldSpawnSpecial = 
          (waveRef.current >= SPECIAL_FRUIT_MIN_WAVE && Math.random() < SPECIAL_FRUIT_CHANCE) ||
          spawnsSinceSpecialRef.current >= GUARANTEED_SPECIAL_INTERVAL;
        
        if (shouldSpawnSpecial) {
          const specialType: SpecialFruitType = 'freeze'; // Only freeze power-up (no frenzy)
          spawnSpecialFruit(specialType);
          spawnsSinceSpecialRef.current = 0;
        }

        // Increase wave every 10 spawns and show announcement
        const newWave = Math.floor(stats.fruitsSliced / 10) + 1;
        if (newWave > waveRef.current) {
          waveRef.current = newWave;
          setCurrentWave(newWave);
          setShowWaveAnnouncement(true);
          setTimeout(() => setShowWaveAnnouncement(false), 2000);
        }
      }
    }
  }, [canvasWidth, canvasHeight, spawnFruit, spawnBomb, spawnSpecialFruit, stats.fruitsSliced, timeScale, activeEffect]);

  const startGame = useCallback(() => {
    // Clear any active effects
    if (effectTimeoutRef.current) {
      clearTimeout(effectTimeoutRef.current);
    }
    setActiveEffect(null);
    setTimeScale(1);
    
    setGameState('playing');
    setStats(prev => ({
      score: 0,
      lives: INITIAL_LIVES,
      combo: 0,
      maxCombo: 0,
      fruitsSliced: 0,
      highScore: prev.highScore,
    }));
    setFruits([]);
    setBombs([]);
    setSpecialFruits([]);
    setSlicedFruits([]);
    setParticles([]);
    setScorePopups([]);
    lastSpawnRef.current = 0;
    lastComboTimeRef.current = 0;
    waveRef.current = 1;
    spawnsSinceSpecialRef.current = 0;
    setCurrentWave(1);
    setShowWaveAnnouncement(false);
    setCriticalFlash(false);
  }, []);

  const returnToMenu = useCallback(() => {
    if (effectTimeoutRef.current) {
      clearTimeout(effectTimeoutRef.current);
    }
    setActiveEffect(null);
    setTimeScale(1);
    
    setGameState('menu');
    setFruits([]);
    setBombs([]);
    setSpecialFruits([]);
    setSlicedFruits([]);
    setParticles([]);
    setScorePopups([]);
  }, []);

  return {
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
  };
}
