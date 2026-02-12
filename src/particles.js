// ============================================================
// TOU - Particle & Effects System
// ============================================================

class Particle {
    constructor() { this.alive = false; }
    init(x, y, vx, vy, life, size, color, type) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.life = life; this.maxLife = life;
        this.size = size; this.color = color;
        this.type = type || 'default';
        this.alive = true;
        this.alpha = 1;
        return this;
    }
}

class ParticleSystem {
    constructor(maxParticles) {
        this.particles = [];
        this.maxParticles = maxParticles || 5000;
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(new Particle());
        }
        this.shockwaves = [];
    }

    _getParticle() {
        for (let i = 0; i < this.particles.length; i++) {
            if (!this.particles[i].alive) return this.particles[i];
        }
        return null;
    }

    emit(x, y, vx, vy, life, size, color, type) {
        const p = this._getParticle();
        if (p) p.init(x, y, vx, vy, life, size, color, type);
    }

    explosion(x, y, radius, color, count) {
        count = count || 30;
        for (let i = 0; i < count; i++) {
            const a = Math.random() * TAU;
            const spd = randFloat(50, radius * 5);
            const life = randFloat(0.2, 0.6);
            const sz = randFloat(1, 4);
            this.emit(x, y, Math.cos(a) * spd, Math.sin(a) * spd, life, sz, color);
        }
    }

    bigExplosion(x, y, radius, count) {
        count = count || 60;
        // Core
        for (let i = 0; i < count; i++) {
            const a = Math.random() * TAU;
            const spd = randFloat(30, radius * 4);
            const life = randFloat(0.3, 0.8);
            const sz = randFloat(2, 6);
            const c = ['#ff0', '#f80', '#f40', '#f00', '#fff'][randInt(0, 4)];
            this.emit(x, y, Math.cos(a) * spd, Math.sin(a) * spd, life, sz, c);
        }
        // Debris
        for (let i = 0; i < count / 3; i++) {
            const a = Math.random() * TAU;
            const spd = randFloat(100, radius * 6);
            const life = randFloat(0.5, 1.2);
            this.emit(x, y, Math.cos(a) * spd, Math.sin(a) * spd, life, randFloat(1, 3), '#aaa', 'spark');
        }
        // Shockwave ring
        this.shockwaves.push({
            x, y, radius: 5, maxRadius: radius * 1.5,
            life: 0.4, maxLife: 0.4, color: '#fff'
        });
    }

    nukeExplosion(x, y, radius) {
        for (let i = 0; i < 200; i++) {
            const a = Math.random() * TAU;
            const spd = randFloat(50, radius * 3);
            const life = randFloat(0.5, 1.5);
            const sz = randFloat(3, 10);
            const c = ['#ff0', '#f80', '#fff', '#f40'][randInt(0, 3)];
            this.emit(x, y, Math.cos(a) * spd, Math.sin(a) * spd, life, sz, c);
        }
        this.shockwaves.push({
            x, y, radius: 10, maxRadius: radius * 2,
            life: 0.8, maxLife: 0.8, color: '#ff0'
        });
        this.shockwaves.push({
            x, y, radius: 5, maxRadius: radius * 1.5,
            life: 0.6, maxLife: 0.6, color: '#fff'
        });
    }

    trail(x, y, vx, vy, color) {
        this.emit(x, y, vx * 0.1 + randFloat(-20, 20), vy * 0.1 + randFloat(-20, 20),
            randFloat(0.1, 0.3), randFloat(1, 3), color, 'trail');
    }

    sparks(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * TAU;
            const spd = randFloat(100, 400);
            this.emit(x, y, Math.cos(a) * spd, Math.sin(a) * spd,
                randFloat(0.1, 0.4), randFloat(1, 2), color || '#ff0', 'spark');
        }
    }

    shipDestroyed(x, y, color) {
        this.bigExplosion(x, y, 60, 80);
        // Colored fragments
        for (let i = 0; i < 15; i++) {
            const a = Math.random() * TAU;
            const spd = randFloat(80, 300);
            this.emit(x, y, Math.cos(a) * spd, Math.sin(a) * spd,
                randFloat(0.5, 1.5), randFloat(2, 5), color, 'debris');
        }
    }

    update(dt) {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (!p.alive) continue;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.alpha = clamp(p.life / p.maxLife, 0, 1);
            if (p.type === 'spark') {
                p.vx *= 0.95;
                p.vy *= 0.95;
            }
            if (p.type === 'trail') {
                p.size *= 0.95;
            }
            if (p.life <= 0) p.alive = false;
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.life -= dt;
            const t = 1 - sw.life / sw.maxLife;
            sw.radius = lerp(5, sw.maxRadius, t);
            if (sw.life <= 0) this.shockwaves.splice(i, 1);
        }
    }

    draw(ctx, camX, camY) {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (!p.alive) continue;
            const sx = p.x - camX;
            const sy = p.y - camY;
            if (sx < -20 || sx > ctx.canvas.width + 20 || sy < -20 || sy > ctx.canvas.height + 20) continue;

            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;

            if (p.type === 'spark') {
                ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
            } else if (p.type === 'debris') {
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(p.life * 10);
                ctx.fillRect(-p.size, -p.size / 3, p.size * 2, p.size * 0.7);
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(sx, sy, Math.max(0.5, p.size * p.alpha), 0, TAU);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // Draw shockwaves
        for (const sw of this.shockwaves) {
            const sx = sw.x - camX;
            const sy = sw.y - camY;
            const alpha = sw.life / sw.maxLife;
            ctx.globalAlpha = alpha * 0.6;
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = 3 * alpha;
            ctx.beginPath();
            ctx.arc(sx, sy, sw.radius, 0, TAU);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
}
