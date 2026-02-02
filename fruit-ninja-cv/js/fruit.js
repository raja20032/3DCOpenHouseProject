/**
 * Fruit System for Fruit Ninja CV
 * Fruit types, physics, spawning, and rendering
 */

// Fruit type definitions
const FRUIT_TYPES = {
    watermelon: {
        name: 'watermelon',
        radius: 55,
        outerColor: '#2d5a27',
        innerColor: '#e63946',
        points: 1,
        hasSeeds: true
    },
    orange: {
        name: 'orange',
        radius: 40,
        outerColor: '#ff8c00',
        innerColor: '#ffa500',
        points: 1,
        segments: 8
    },
    apple: {
        name: 'apple',
        radius: 38,
        outerColor: '#c41e3a',
        innerColor: '#fffacd',
        points: 1
    },
    greenApple: {
        name: 'greenApple',
        radius: 38,
        outerColor: '#7cb518',
        innerColor: '#f0fff0',
        points: 1
    },
    banana: {
        name: 'banana',
        radius: 35,
        outerColor: '#ffe135',
        innerColor: '#fffacd',
        points: 1,
        curved: true
    },
    strawberry: {
        name: 'strawberry',
        radius: 32,
        outerColor: '#ff355e',
        innerColor: '#ffb6c1',
        points: 1,
        hasSeeds: true
    },
    peach: {
        name: 'peach',
        radius: 38,
        outerColor: '#ffcba4',
        innerColor: '#ffefd5',
        points: 1
    },
    bomb: {
        name: 'bomb',
        radius: 45,
        outerColor: '#1a1a1a',
        innerColor: '#333333',
        points: 0,
        isBomb: true
    }
};

class Fruit {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = type.radius;

        // Physics
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = -18 - Math.random() * 6;
        this.gravity = 0.35;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.15;

        // State
        this.isSliced = false;
        this.isOffScreen = false;
        this.sliceAngle = 0;

        // Halves (created when sliced)
        this.halves = null;
    }

    update(canvasHeight) {
        if (this.isSliced && this.halves) {
            // Update halves physics
            this.halves.forEach(half => {
                half.vy += this.gravity;
                half.x += half.vx;
                half.y += half.vy;
                half.rotation += half.rotationSpeed;
            });
            // Check if halves off screen
            if (this.halves.every(h => h.y > canvasHeight + 100)) {
                this.isOffScreen = true;
            }
        } else {
            // Normal physics
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;

            // Check if fallen off bottom
            if (this.y > canvasHeight + this.radius && this.vy > 0) {
                this.isOffScreen = true;
            }
        }
    }

    slice(bladeAngle) {
        if (this.isSliced) return;
        this.isSliced = true;
        this.sliceAngle = bladeAngle || Math.random() * Math.PI;

        // Create two halves
        const splitVelocity = 3;
        const perpAngle = this.sliceAngle + Math.PI / 2;

        this.halves = [
            {
                x: this.x, y: this.y,
                vx: this.vx + Math.cos(perpAngle) * splitVelocity,
                vy: this.vy - 2,
                rotation: this.rotation,
                rotationSpeed: this.rotationSpeed + 0.1,
                side: 0
            },
            {
                x: this.x, y: this.y,
                vx: this.vx - Math.cos(perpAngle) * splitVelocity,
                vy: this.vy - 2,
                rotation: this.rotation,
                rotationSpeed: this.rotationSpeed - 0.1,
                side: 1
            }
        ];
    }

    draw(ctx) {
        if (this.isSliced && this.halves) {
            this.halves.forEach(half => this.drawHalf(ctx, half));
        } else {
            this.drawWhole(ctx);
        }
    }

    drawWhole(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type.isBomb) {
            this.drawBomb(ctx);
        } else {
            this.drawFruit(ctx);
        }

        ctx.restore();
    }

    drawFruit(ctx) {
        const r = this.radius;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.arc(3, 3, r, 0, Math.PI * 2);
        ctx.fill();

        // Main body
        ctx.fillStyle = this.type.outerColor;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        gradient.addColorStop(0, 'rgba(255,255,255,0.4)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Stem/leaf for certain fruits
        if (this.type.name !== 'banana') {
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.ellipse(0, -r + 5, 8, 4, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#654321';
            ctx.fillRect(-2, -r - 2, 4, 10);
        }
    }

    drawBomb(ctx) {
        const r = this.radius;

        // Body
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        gradient.addColorStop(0, 'rgba(100,100,100,0.4)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Fuse
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -r + 5);
        ctx.quadraticCurveTo(10, -r - 10, 5, -r - 20);
        ctx.stroke();

        // Spark
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(5, -r - 20, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(5, -r - 20, 3, 0, Math.PI * 2);
        ctx.fill();

        // X mark
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-15, -15);
        ctx.lineTo(15, 15);
        ctx.moveTo(15, -15);
        ctx.lineTo(-15, 15);
        ctx.stroke();
    }

    drawHalf(ctx, half) {
        ctx.save();
        ctx.translate(half.x, half.y);
        ctx.rotate(half.rotation);

        const r = this.radius;

        // Clip to half
        ctx.beginPath();
        if (half.side === 0) {
            ctx.rect(-r - 5, -r - 5, r + 5, (r + 5) * 2);
        } else {
            ctx.rect(0, -r - 5, r + 5, (r + 5) * 2);
        }
        ctx.clip();

        // Outer
        ctx.fillStyle = this.type.outerColor;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Inner flesh
        ctx.fillStyle = this.type.innerColor;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Seeds for watermelon
        if (this.type.hasSeeds && this.type.name === 'watermelon') {
            ctx.fillStyle = '#1a1a1a';
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + half.rotation;
                const dist = r * 0.4;
                ctx.beginPath();
                ctx.ellipse(
                    Math.cos(angle) * dist,
                    Math.sin(angle) * dist,
                    4, 7, angle, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

class FruitManager {
    constructor() {
        this.fruits = [];
        this.spawnTimer = 0;
        this.waveNumber = 1;
        this.baseSpawnInterval = 1500;
        this.minSpawnInterval = 400;
    }

    getSpawnInterval() {
        return Math.max(
            this.minSpawnInterval,
            this.baseSpawnInterval - (this.waveNumber - 1) * 100
        );
    }

    getFruitsPerWave() {
        return Math.min(1 + Math.floor(this.waveNumber / 2), 4);
    }

    getBombChance() {
        if (this.waveNumber < 3) return 0;
        return Math.min(0.15, 0.05 + (this.waveNumber - 3) * 0.02);
    }

    spawnFruit(canvasWidth, canvasHeight) {
        const fruitTypes = Object.values(FRUIT_TYPES).filter(t => !t.isBomb);
        const type = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];

        const x = Math.random() * (canvasWidth - 200) + 100;
        const y = canvasHeight + 50;

        const fruit = new Fruit(x, y, type);
        fruit.vx = (canvasWidth / 2 - x) * 0.01 + (Math.random() - 0.5) * 4;

        this.fruits.push(fruit);
    }

    spawnBomb(canvasWidth, canvasHeight) {
        const x = Math.random() * (canvasWidth - 200) + 100;
        const y = canvasHeight + 50;
        const bomb = new Fruit(x, y, FRUIT_TYPES.bomb);
        bomb.vx = (canvasWidth / 2 - x) * 0.01 + (Math.random() - 0.5) * 4;
        this.fruits.push(bomb);
    }

    spawnWave(canvasWidth, canvasHeight) {
        const count = this.getFruitsPerWave();
        const bombChance = this.getBombChance();

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (Math.random() < bombChance) {
                    this.spawnBomb(canvasWidth, canvasHeight);
                } else {
                    this.spawnFruit(canvasWidth, canvasHeight);
                }
            }, i * 150);
        }
    }

    update(deltaTime, canvasWidth, canvasHeight, isPlaying) {
        // Update all fruits
        this.fruits.forEach(fruit => fruit.update(canvasHeight));

        // Spawn new waves
        if (isPlaying) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.getSpawnInterval()) {
                this.spawnTimer = 0;
                this.spawnWave(canvasWidth, canvasHeight);
            }
        }
    }

    draw(ctx) {
        this.fruits.forEach(fruit => fruit.draw(ctx));
    }

    getMissedFruits() {
        return this.fruits.filter(f => f.isOffScreen && !f.isSliced && !f.type.isBomb);
    }

    removeOffscreenFruits() {
        this.fruits = this.fruits.filter(f => !f.isOffScreen);
    }

    getActiveFruits() {
        return this.fruits.filter(f => !f.isSliced && !f.isOffScreen);
    }

    reset() {
        this.fruits = [];
        this.spawnTimer = 0;
        this.waveNumber = 1;
    }

    increaseWave() {
        this.waveNumber++;
    }
}

const fruitManager = new FruitManager();
