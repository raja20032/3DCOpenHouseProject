/**
 * Blade System for Fruit Ninja CV
 * Renders the glowing slice trail and handles collision detection
 */

class BladeTrail {
    constructor() {
        this.points = [];
        this.maxPoints = 20;
        this.colors = {
            outer: 'rgba(255, 255, 255, 0.8)',
            inner: 'rgba(200, 230, 255, 1)',
            glow: 'rgba(255, 255, 255, 0.3)'
        };
        this.velocity = { x: 0, y: 0 };
        this.speed = 0;
        this.isActive = false;
        this.swipeThreshold = 5; // Lower threshold for easier mouse slicing
        this.lastPosition = null;
    }

    addPoint(x, y, timestamp = Date.now()) {
        if (this.lastPosition) {
            const dt = (timestamp - this.lastPosition.time) / 1000;
            if (dt > 0) {
                this.velocity.x = (x - this.lastPosition.x) / dt;
                this.velocity.y = (y - this.lastPosition.y) / dt;
                this.speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            }
        }

        this.points.push({ x, y, time: timestamp, speed: this.speed });
        while (this.points.length > this.maxPoints) this.points.shift();
        this.lastPosition = { x, y, time: timestamp };
        this.isActive = this.speed > this.swipeThreshold;
    }

    isSlicing() {
        return this.isActive && this.points.length >= 2;
    }

    getBladeSegment() {
        if (this.points.length < 2) return null;
        const p1 = this.points[this.points.length - 2];
        const p2 = this.points[this.points.length - 1];
        return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }

    checkCircleIntersection(cx, cy, radius) {
        if (!this.isSlicing()) return false;
        const seg = this.getBladeSegment();
        if (!seg) return false;
        return this.lineCircleIntersection(seg.x1, seg.y1, seg.x2, seg.y2, cx, cy, radius);
    }

    lineCircleIntersection(x1, y1, x2, y2, cx, cy, r) {
        const dx = x2 - x1, dy = y2 - y1;
        const fx = x1 - cx, fy = y1 - cy;
        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - r * r;
        let disc = b * b - 4 * a * c;
        if (disc < 0) return false;
        disc = Math.sqrt(disc);
        const t1 = (-b - disc) / (2 * a);
        const t2 = (-b + disc) / (2 * a);
        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    }

    update() {
        const now = Date.now();
        this.points = this.points.filter(p => (now - p.time) < 200);
        if (this.lastPosition && (now - this.lastPosition.time) > 50) {
            this.speed *= 0.9;
            if (this.speed < 1) { this.speed = 0; this.isActive = false; }
        }
    }

    draw(ctx) {
        if (this.points.length < 2) return;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Glow
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.strokeStyle = this.colors.glow;
        ctx.lineWidth = 30;
        ctx.stroke();

        // Outer
        ctx.strokeStyle = this.colors.outer;
        ctx.lineWidth = 8;
        ctx.stroke();

        // Inner
        ctx.strokeStyle = this.colors.inner;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }

    clear() {
        this.points = [];
        this.velocity = { x: 0, y: 0 };
        this.speed = 0;
        this.isActive = false;
        this.lastPosition = null;
    }

    getSpeed() { return this.speed; }
    getCurrentPosition() {
        if (this.points.length === 0) return null;
        const lp = this.points[this.points.length - 1];
        return { x: lp.x, y: lp.y };
    }
}

class FingerIndicator {
    constructor() {
        this.x = 0; this.y = 0;
        this.isVisible = false;
        this.size = 25;
        this.pulsePhase = 0;
    }
    setPosition(x, y) { this.x = x; this.y = y; this.isVisible = true; }
    hide() { this.isVisible = false; }
    update() { this.pulsePhase += 0.1; }
    draw(ctx) {
        if (!this.isVisible) return;
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;
        const size = this.size * pulse;
        ctx.save();
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 2);
        grad.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
        grad.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
        grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

const bladeTrail = new BladeTrail();
const fingerIndicator = new FingerIndicator();
