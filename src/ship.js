// ============================================================
// TOU - Ship / Entity System
// ============================================================

const SHIP_RADIUS = 8;
const SHIP_MAX_SPEED = 400;
const SHIP_ACCEL = 600;
const SHIP_FRICTION = 0.97;
const SHIP_ROTATION_SPEED = 5.0;
const SHIP_MAX_HP = 100;
const RESPAWN_TIME = 2.0;

class Ship {
    constructor(id, isPlayer, playerIndex, teamId) {
        this.id = id;
        this.isPlayer = isPlayer;
        this.playerIndex = playerIndex; // 0-3 for human players
        this.teamId = teamId;
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.angle = 0;
        this.hp = SHIP_MAX_HP;
        this.alive = true;
        this.respawnTimer = 0;
        this.radius = SHIP_RADIUS;
        this.weapons = [0]; // weapon IDs
        this.currentWeapon = 0;
        this.fireCooldown = 0;
        this.kills = 0;
        this.deaths = 0;
        this.color = getTeamColor(teamId);
        this.name = isPlayer ? `Spieler ${playerIndex + 1}` : `Bot ${id}`;
        this.shieldTimer = 0;
        this.shieldRadius = 0;
        this.shieldReflective = false;
        this.slowFactor = 1.0;
        this.slowTimer = 0;
        this.empTimer = 0;
        this.invulnTimer = 0; // brief invuln after spawn
        this.thrustAmount = 0; // for visual
        this.lastDamagedBy = -1; // ship id that last hit us
        // Burst fire state
        this.burstRemaining = 0;
        this.burstCooldown = 0;
        this.burstWeaponId = -1;
        // Remote mines
        this.remoteMines = [];
    }

    spawn(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = Math.random() * TAU;
        this.hp = SHIP_MAX_HP;
        this.alive = true;
        this.respawnTimer = 0;
        this.invulnTimer = 1.5;
        this.shieldTimer = 0;
        this.slowFactor = 1.0;
        this.slowTimer = 0;
        this.empTimer = 0;
        this.weapons = [getRandomWeaponId()];
        this.currentWeapon = 0;
        this.fireCooldown = 0;
        this.burstRemaining = 0;
    }

    getWeapon() {
        return WEAPONS[this.weapons[this.currentWeapon]];
    }

    cycleWeapon() {
        if (this.weapons.length > 1) {
            this.currentWeapon = (this.currentWeapon + 1) % this.weapons.length;
        }
    }

    addWeapon(weaponId) {
        if (!this.weapons.includes(weaponId)) {
            this.weapons.push(weaponId);
            if (this.weapons.length > 5) {
                this.weapons.shift();
                if (this.currentWeapon >= this.weapons.length) {
                    this.currentWeapon = this.weapons.length - 1;
                }
            }
        }
        this.currentWeapon = this.weapons.indexOf(weaponId);
    }

    takeDamage(amount, attackerId) {
        if (this.invulnTimer > 0) return;
        if (this.shieldTimer > 0) return;
        this.hp -= amount;
        this.lastDamagedBy = attackerId;
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.respawnTimer = RESPAWN_TIME;
        this.deaths++;
    }

    update(dt, level, input) {
        if (!this.alive) {
            this.respawnTimer -= dt;
            return;
        }

        // Timers
        if (this.invulnTimer > 0) this.invulnTimer -= dt;
        if (this.fireCooldown > 0) this.fireCooldown -= dt * 1000;
        if (this.shieldTimer > 0) this.shieldTimer -= dt;
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) this.slowFactor = 1.0;
        }
        if (this.empTimer > 0) this.empTimer -= dt;

        // Burst fire
        if (this.burstRemaining > 0) {
            this.burstCooldown -= dt * 1000;
        }

        // Movement from input
        this.thrustAmount = 0;
        if (input) {
            const accel = SHIP_ACCEL * this.slowFactor;
            if (input.thrust) {
                this.vx += Math.cos(this.angle) * accel * dt;
                this.vy += Math.sin(this.angle) * accel * dt;
                this.thrustAmount = 1;
            }
            if (input.brake) {
                this.vx -= Math.cos(this.angle) * accel * 0.5 * dt;
                this.vy -= Math.sin(this.angle) * accel * 0.5 * dt;
            }
            if (input.left) this.angle -= SHIP_ROTATION_SPEED * dt;
            if (input.right) this.angle += SHIP_ROTATION_SPEED * dt;
            if (input.strafeLeft) {
                this.vx += Math.cos(this.angle - Math.PI / 2) * accel * 0.6 * dt;
                this.vy += Math.sin(this.angle - Math.PI / 2) * accel * 0.6 * dt;
            }
            if (input.strafeRight) {
                this.vx += Math.cos(this.angle + Math.PI / 2) * accel * 0.6 * dt;
                this.vy += Math.sin(this.angle + Math.PI / 2) * accel * 0.6 * dt;
            }
        }

        // Friction
        this.vx *= SHIP_FRICTION;
        this.vy *= SHIP_FRICTION;

        // Speed limit
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpd = SHIP_MAX_SPEED * this.slowFactor;
        if (speed > maxSpd) {
            this.vx = (this.vx / speed) * maxSpd;
            this.vy = (this.vy / speed) * maxSpd;
        }

        // Move + wall collision
        const newX = this.x + this.vx * dt;
        const newY = this.y + this.vy * dt;

        // X collision
        if (!level.isWall(newX + this.radius, this.y) && !level.isWall(newX - this.radius, this.y)) {
            this.x = newX;
        } else {
            this.vx *= -0.3; // Bounce off walls
        }

        // Y collision
        if (!level.isWall(this.x, newY + this.radius) && !level.isWall(this.x, newY - this.radius)) {
            this.y = newY;
        } else {
            this.vy *= -0.3;
        }

        // Corner check
        if (level.isWall(this.x + this.radius, this.y + this.radius) ||
            level.isWall(this.x - this.radius, this.y - this.radius) ||
            level.isWall(this.x + this.radius, this.y - this.radius) ||
            level.isWall(this.x - this.radius, this.y + this.radius)) {
            // Push out
            this.vx *= -0.2;
            this.vy *= -0.2;
        }

        // Keep in bounds
        this.x = clamp(this.x, TILE_SIZE * 3, level.width - TILE_SIZE * 3);
        this.y = clamp(this.y, TILE_SIZE * 3, level.height - TILE_SIZE * 3);
    }

    draw(ctx, camX, camY, isLocal) {
        if (!this.alive) return;

        const sx = this.x - camX;
        const sy = this.y - camY;

        // Off-screen culling
        if (sx < -30 || sx > ctx.canvas.width + 30 || sy < -30 || sy > ctx.canvas.height + 30) return;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.angle);

        // Thrust flame
        if (this.thrustAmount > 0) {
            const flameLen = 8 + Math.random() * 8;
            ctx.fillStyle = '#f80';
            ctx.beginPath();
            ctx.moveTo(-8, -3);
            ctx.lineTo(-8 - flameLen, 0);
            ctx.lineTo(-8, 3);
            ctx.fill();
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.moveTo(-8, -1.5);
            ctx.lineTo(-8 - flameLen * 0.6, 0);
            ctx.lineTo(-8, 1.5);
            ctx.fill();
        }

        // Ship body
        const c = this.color;
        ctx.fillStyle = c.hex;
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Ship shape - arrow-like
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-7, -6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, 6);
        ctx.closePath();
        ctx.fill();

        // Outline
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.restore();

        // Shield
        if (this.shieldTimer > 0) {
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.1;
            ctx.strokeStyle = '#aaf';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, this.shieldRadius || 50, 0, TAU);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // HP bar
        if (this.hp < SHIP_MAX_HP) {
            const barW = 20;
            const barH = 3;
            const barX = sx - barW / 2;
            const barY = sy - 14;
            ctx.fillStyle = '#300';
            ctx.fillRect(barX, barY, barW, barH);
            const hpRatio = this.hp / SHIP_MAX_HP;
            ctx.fillStyle = hpRatio > 0.5 ? '#0f0' : hpRatio > 0.25 ? '#f80' : '#f00';
            ctx.fillRect(barX, barY, barW * hpRatio, barH);
        }

        // Name tag for player ships
        if (this.isPlayer) {
            ctx.fillStyle = c.hex;
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, sx, sy + 16);
        }

        ctx.globalAlpha = 1;
    }
}
