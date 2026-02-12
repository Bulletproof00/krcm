// ============================================================
// TOU - AI System (Scalable Difficulty 1-5)
// ============================================================

class AIController {
    constructor(difficulty) {
        this.difficulty = difficulty; // 1-5
        this.thinkInterval = this._getThinkInterval();
        this.thinkTimer = Math.random() * this.thinkInterval;
        this.targetId = -1;
        this.wanderAngle = Math.random() * TAU;
        this.wanderTimer = 0;
        this.strafeDir = 0;
        this.strafeTimer = 0;
        this.evadeTimer = 0;
        this.evadeDir = 0;
        this.weaponSwitchTimer = 0;
    }

    _getThinkInterval() {
        // Higher difficulty = thinks more often
        return [0.5, 0.3, 0.2, 0.1, 0.05][this.difficulty - 1] || 0.2;
    }

    getInput(ship, ships, projectiles, level, dt) {
        const input = {
            thrust: false, brake: false, left: false, right: false,
            strafeLeft: false, strafeRight: false, fire: false, switchWeapon: false
        };

        if (!ship.alive) return input;

        this.thinkTimer -= dt;
        this.wanderTimer -= dt;
        this.strafeTimer -= dt;
        this.evadeTimer -= dt;
        this.weaponSwitchTimer -= dt;

        // Find target
        if (this.thinkTimer <= 0) {
            this.thinkTimer = this.thinkInterval;
            this._selectTarget(ship, ships);

            // Occasionally switch weapon
            if (this.weaponSwitchTimer <= 0 && ship.weapons.length > 1) {
                if (Math.random() < 0.3) {
                    input.switchWeapon = true;
                    this.weaponSwitchTimer = randFloat(2, 5);
                }
            }
        }

        const target = this.targetId >= 0 ? ships.find(s => s.id === this.targetId && s.alive) : null;

        // Evade nearby projectiles (higher difficulty = better evasion)
        if (this.difficulty >= 2) {
            const evadeResult = this._checkProjectileEvasion(ship, projectiles);
            if (evadeResult && this.evadeTimer <= 0) {
                this.evadeDir = evadeResult;
                this.evadeTimer = 0.3;
            }
        }

        if (this.evadeTimer > 0) {
            if (this.evadeDir > 0) input.strafeRight = true;
            else input.strafeLeft = true;
            input.thrust = true;
        }

        if (target) {
            const dx = target.x - ship.x;
            const dy = target.y - ship.y;
            const distToTarget = Math.sqrt(dx * dx + dy * dy);
            const angleToTarget = Math.atan2(dy, dx);
            const diff = angleDiff(ship.angle, angleToTarget);

            // Aim accuracy based on difficulty
            const aimTolerance = [0.4, 0.25, 0.15, 0.08, 0.03][this.difficulty - 1];
            const aimNoise = [0.3, 0.15, 0.08, 0.03, 0.01][this.difficulty - 1];

            // Add aim noise
            const noisyDiff = diff + (Math.random() - 0.5) * aimNoise;

            // Rotation
            if (noisyDiff > aimTolerance) input.right = true;
            else if (noisyDiff < -aimTolerance) input.left = true;

            // Movement
            const weapon = ship.getWeapon();
            const idealDist = weapon.beam ? 200 : (weapon.homing ? 300 : 250);

            if (distToTarget > idealDist + 50) {
                input.thrust = true;
            } else if (distToTarget < idealDist - 80) {
                input.brake = true;
            }

            // Strafing (difficulty 3+)
            if (this.difficulty >= 3 && this.strafeTimer <= 0) {
                this.strafeDir = randSign();
                this.strafeTimer = randFloat(0.3, 1.0);
            }
            if (this.strafeTimer > 0 && this.difficulty >= 3) {
                if (this.strafeDir > 0) input.strafeRight = true;
                else input.strafeLeft = true;
            }

            // Shooting
            const fireChance = [0.3, 0.5, 0.7, 0.85, 0.95][this.difficulty - 1];
            if (Math.abs(diff) < aimTolerance * 3 && Math.random() < fireChance) {
                // Check line of sight
                const wallDist = level.raycast(ship.x, ship.y, ship.angle, distToTarget);
                if (wallDist >= distToTarget * 0.9 || weapon.homing || weapon.bounces) {
                    input.fire = true;
                }
            }

            // Use mines/bombs when near enemies
            if (weapon.mine && distToTarget < 150) {
                input.fire = true;
            }
        } else {
            // Wander
            if (this.wanderTimer <= 0) {
                this.wanderAngle += (Math.random() - 0.5) * 2;
                this.wanderTimer = randFloat(1, 3);
            }

            const diff = angleDiff(ship.angle, this.wanderAngle);
            if (diff > 0.1) input.right = true;
            else if (diff < -0.1) input.left = true;
            input.thrust = true;

            // Wall avoidance
            const ahead = level.raycast(ship.x, ship.y, ship.angle, 100);
            if (ahead < 80) {
                input.thrust = false;
                input.brake = true;
                this.wanderAngle += Math.PI * 0.5 * randSign();
            }
        }

        // Wall avoidance - always active
        const wallAhead = level.raycast(ship.x, ship.y, ship.angle, 60);
        if (wallAhead < 50) {
            input.thrust = false;
            input.brake = true;
            const leftClear = level.raycast(ship.x, ship.y, ship.angle - 0.5, 80);
            const rightClear = level.raycast(ship.x, ship.y, ship.angle + 0.5, 80);
            if (leftClear > rightClear) input.left = true;
            else input.right = true;
        }

        // Remote mine detonation
        if (ship.remoteMines.length > 0 && target) {
            for (const mine of ship.remoteMines) {
                if (dist(mine.x, mine.y, target.x, target.y) < 80) {
                    input.fire = true; // will trigger detonation logic
                }
            }
        }

        return input;
    }

    _selectTarget(ship, ships) {
        let bestDist = Infinity;
        let bestId = -1;
        const aggroRange = [400, 500, 700, 900, 1200][this.difficulty - 1];

        for (const other of ships) {
            if (other.id === ship.id || !other.alive) continue;
            if (other.teamId === ship.teamId && ship.teamId >= 0) continue;

            const d = dist(ship.x, ship.y, other.x, other.y);
            if (d > aggroRange) continue;

            // Prioritize close enemies and the one who last hit us
            let priority = d;
            if (other.id === ship.lastDamagedBy) priority *= 0.5;
            if (other.isPlayer) priority *= 0.8; // slightly prefer targeting players

            if (priority < bestDist) {
                bestDist = priority;
                bestId = other.id;
            }
        }

        this.targetId = bestId;
    }

    _checkProjectileEvasion(ship, projectiles) {
        const evadeRange = [0, 80, 120, 160, 200][this.difficulty - 1];
        let closestDanger = Infinity;
        let evadeDir = 0;

        for (const proj of projectiles) {
            if (proj.ownerId === ship.id || !proj.alive) continue;
            const d = dist(proj.x, proj.y, ship.x, ship.y);
            if (d > evadeRange) continue;

            // Check if projectile is heading toward us
            const toShip = angleBetween(proj.x, proj.y, ship.x, ship.y);
            const projAngle = Math.atan2(proj.vy, proj.vx);
            const aDiff = Math.abs(angleDiff(projAngle, toShip));

            if (aDiff < 0.5 && d < closestDanger) {
                closestDanger = d;
                // Evade perpendicular to projectile direction
                const cross = Math.cos(projAngle) * (ship.y - proj.y) - Math.sin(projAngle) * (ship.x - proj.x);
                evadeDir = cross > 0 ? 1 : -1;
            }
        }

        return closestDanger < evadeRange ? evadeDir : 0;
    }
}
