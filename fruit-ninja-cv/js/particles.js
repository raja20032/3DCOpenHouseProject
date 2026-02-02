/**
 * Particle System for Fruit Ninja CV
 * Creates juice splatter effects when fruits are sliced
 */

class Particle {
    constructor(x, y, color, options = {}) {
        this.x = x;
        this.y = y;
        this.color = color;

        // Velocity with spread
        const angle = options.angle || Math.random() * Math.PI * 2;
        const speed = options.speed || (3 + Math.random() * 6);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Size
        this.size = options.size || (4 + Math.random() * 8);
        this.originalSize = this.size;

        // Lifetime
        this.life = 1;
        this.decay = options.decay || (0.015 + Math.random() * 0.015);

        // Physics
        this.gravity = options.gravity || 0.15;
        this.friction = 0.99;

        // Visual style
        this.type = options.type || 'circle'; // 'circle', 'drop', 'seed'
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        // Apply physics
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;

        this.x += this.vx;
        this.y += this.vy;

        // Decay
        this.life -= this.decay;
        this.size = this.originalSize * this.life;
        this.rotation += this.rotationSpeed;

        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.life;

        if (this.type === 'seed') {
            // Draw seed shape (for watermelon, etc.)
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 0.6, this.size * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'drop') {
            // Draw juice drop
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.quadraticCurveTo(this.size, 0, 0, this.size);
            ctx.quadraticCurveTo(-this.size, 0, 0, -this.size);
            ctx.fill();
        } else {
            // Draw circle (default)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}


class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    /**
     * Create juice splatter effect at a position
     */
    createJuiceSplatter(x, y, color, count = 15) {
        // Main juice drops
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, {
                type: 'circle',
                speed: 4 + Math.random() * 8,
                decay: 0.02 + Math.random() * 0.01
            }));
        }

        // Smaller droplets
        for (let i = 0; i < count / 2; i++) {
            this.particles.push(new Particle(x, y, color, {
                type: 'drop',
                size: 2 + Math.random() * 4,
                speed: 6 + Math.random() * 6,
                decay: 0.025 + Math.random() * 0.015
            }));
        }
    }

    /**
     * Create watermelon-specific splatter with seeds
     */
    createWatermelonSplatter(x, y) {
        // Red juice
        this.createJuiceSplatter(x, y, '#e63946', 12);

        // Black seeds
        for (let i = 0; i < 6; i++) {
            this.particles.push(new Particle(x, y, '#1a1a1a', {
                type: 'seed',
                size: 4 + Math.random() * 3,
                speed: 5 + Math.random() * 5,
                decay: 0.015,
                gravity: 0.2
            }));
        }
    }

    /**
     * Create explosion effect (for bombs)
     */
    createExplosion(x, y) {
        const colors = ['#ff6600', '#ff3300', '#ffcc00', '#ff0000'];

        for (let i = 0; i < 40; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, color, {
                type: 'circle',
                size: 5 + Math.random() * 15,
                speed: 8 + Math.random() * 12,
                decay: 0.025 + Math.random() * 0.02,
                gravity: 0.1
            }));
        }

        // Smoke particles
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(x, y, 'rgba(50, 50, 50, 0.8)', {
                type: 'circle',
                size: 10 + Math.random() * 20,
                speed: 2 + Math.random() * 4,
                decay: 0.01 + Math.random() * 0.01,
                gravity: -0.05
            }));
        }
    }

    /**
     * Update all particles
     */
    update() {
        this.particles = this.particles.filter(particle => particle.update());
    }

    /**
     * Draw all particles
     */
    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }

    /**
     * Get particle count
     */
    get count() {
        return this.particles.length;
    }
}

// Create global particle system instance
const particleSystem = new ParticleSystem();
