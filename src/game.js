// ============================================================
// TOU - Main Game Engine
// ============================================================

// ---- Globals ----
let canvas, ctx;
let gameState = 'menu'; // menu, playing, paused
let level, particles, audio;
let ships = [];
let projectiles = [];
let beams = [];
let shockwaveAttacks = [];
let aiControllers = [];
let screenShake = 0;
let screenShakeX = 0, screenShakeY = 0;
let lastTime = 0;
let gameTime = 0;
let showScoreboard = false;
let fragLimit = 50;
let gameMode = 'deathmatch';
let winner = null;
let killFeed = [];
let playerCount = 1;

// Camera
let camX = 0, camY = 0;

// Input state per player
const playerInputs = [{}, {}, {}, {}];
const keysDown = {};

// Key bindings for 4 players
const KEY_BINDINGS = [
    // Player 1: WASD + QE
    { thrust: 'KeyW', brake: 'KeyS', strafeLeft: 'KeyA', strafeRight: 'KeyD', left: 'KeyQ', right: 'KeyE', fire: 'Space', switchWeapon: 'KeyF' },
    // Player 2: Arrows + ,.
    { thrust: 'ArrowUp', brake: 'ArrowDown', strafeLeft: 'ArrowLeft', strafeRight: 'ArrowRight', left: 'Comma', right: 'Period', fire: 'Enter', switchWeapon: 'ShiftRight' },
    // Player 3: IJKL + UO
    { thrust: 'KeyI', brake: 'KeyK', strafeLeft: 'KeyJ', strafeRight: 'KeyL', left: 'KeyU', right: 'KeyO', fire: 'KeyP', switchWeapon: 'Semicolon' },
    // Player 4: Numpad
    { thrust: 'Numpad8', brake: 'Numpad5', strafeLeft: 'Numpad4', strafeRight: 'Numpad6', left: 'Numpad7', right: 'Numpad9', fire: 'Numpad0', switchWeapon: 'NumpadDecimal' },
];

// ---- Input Handling ----
document.addEventListener('keydown', (e) => {
    keysDown[e.code] = true;

    if (e.code === 'Escape') {
        if (gameState === 'playing') { gameState = 'paused'; document.getElementById('pauseOverlay').style.display = 'flex'; }
        else if (gameState === 'paused') resumeGame();
    }
    if (e.code === 'Tab') {
        e.preventDefault();
        showScoreboard = true;
    }

    // Weapon switch on keydown
    for (let p = 0; p < playerCount; p++) {
        if (e.code === KEY_BINDINGS[p].switchWeapon) {
            const ship = ships.find(s => s.isPlayer && s.playerIndex === p);
            if (ship && ship.alive) ship.cycleWeapon();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keysDown[e.code] = false;
    if (e.code === 'Tab') showScoreboard = false;
});

function getPlayerInput(playerIndex) {
    const kb = KEY_BINDINGS[playerIndex];
    return {
        thrust: !!keysDown[kb.thrust],
        brake: !!keysDown[kb.brake],
        strafeLeft: !!keysDown[kb.strafeLeft],
        strafeRight: !!keysDown[kb.strafeRight],
        left: !!keysDown[kb.left],
        right: !!keysDown[kb.right],
        fire: !!keysDown[kb.fire],
        switchWeapon: false
    };
}

// ---- Menu Functions ----
function showControls() {
    const ci = document.getElementById('controlsInfo');
    ci.style.display = ci.style.display === 'none' ? 'block' : 'none';
}

function startGame() {
    // Read settings
    gameMode = document.getElementById('optMode').value;
    playerCount = parseInt(document.getElementById('optPlayers').value);
    const botCount = parseInt(document.getElementById('optBots').value);
    const difficulty = parseInt(document.getElementById('optDifficulty').value);
    const mapSize = document.getElementById('optMapSize').value;
    fragLimit = parseInt(document.getElementById('optFragLimit').value);

    // Init canvas
    canvas = document.getElementById('gameCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');

    // Init audio
    audio = new AudioSystem();
    audio.init();

    // Generate level
    level = new Level(mapSize);
    level.generate();

    // Init particles
    particles = new ParticleSystem(6000);

    // Create ships
    ships = [];
    projectiles = [];
    beams = [];
    shockwaveAttacks = [];
    aiControllers = [];
    killFeed = [];
    winner = null;
    gameTime = 0;

    const totalShips = playerCount + botCount;
    let teamCounter = 0;

    for (let i = 0; i < totalShips; i++) {
        const isPlayer = i < playerCount;
        let teamId;
        if (gameMode === 'team') {
            if (isPlayer) {
                teamId = 0; // All players on team 0
            } else {
                teamId = (teamCounter % 2 === 0) ? 0 : 1;
                teamCounter++;
            }
        } else {
            teamId = i; // Each on own team for deathmatch
        }

        const ship = new Ship(i, isPlayer, isPlayer ? i : -1, teamId);
        const sp = level.getSpawnPoint(i);
        ship.spawn(sp.x, sp.y);

        if (isPlayer) {
            ship.name = `Spieler ${i + 1}`;
        } else {
            const botNames = ['Razor', 'Venom', 'Ghost', 'Blitz', 'Storm', 'Fury', 'Shadow', 'Hawk',
                'Reaper', 'Cobra', 'Wolf', 'Phantom', 'Ace', 'Bolt', 'Dagger', 'Ember',
                'Frost', 'Havoc', 'Iron', 'Jet', 'Knife', 'Lance', 'Mace', 'Neon',
                'Onyx', 'Pike', 'Quake', 'Raze', 'Saber', 'Tank', 'Ultra', 'Volt',
                'Warp', 'Xeno', 'Yeti', 'Zero', 'Apex', 'Byte', 'Clash', 'Doom',
                'Edge', 'Flux', 'Grit', 'Hex', 'Ikon', 'Jinx', 'Krypt', 'Lynx',
                'Maxx', 'Nexus', 'Orion', 'Pyro', 'Rex', 'Slug', 'Thor', 'Unit',
                'Vice', 'Wraith', 'Xenon', 'Yoke'];
            ship.name = botNames[i % botNames.length];
        }

        ships.push(ship);

        if (!isPlayer) {
            aiControllers.push(new AIController(difficulty));
        }
    }

    // Hide menu, start game
    document.getElementById('menu').style.display = 'none';
    gameState = 'playing';

    audio.startMusic();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function resumeGame() {
    gameState = 'playing';
    document.getElementById('pauseOverlay').style.display = 'none';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function quitToMenu() {
    gameState = 'menu';
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
    if (audio) audio.stopMusic();
}

// ---- Main Game Loop ----
function gameLoop(timestamp) {
    if (gameState !== 'playing') return;

    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    gameTime += dt;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// ---- Update ----
function update(dt) {
    // Update ships
    let aiIdx = 0;
    for (const ship of ships) {
        if (ship.isPlayer) {
            if (ship.alive) {
                const input = getPlayerInput(ship.playerIndex);
                ship.update(dt, level, input);

                // Firing
                if (input.fire) {
                    tryFire(ship);
                }
            } else {
                ship.update(dt, level, null);
                if (ship.respawnTimer <= 0) {
                    const sp = level.getSpawnPoint(randInt(0, level.spawnPoints.length - 1));
                    ship.spawn(sp.x, sp.y);
                }
            }
        } else {
            if (ship.alive) {
                const ai = aiControllers[aiIdx];
                const input = ai.getInput(ship, ships, projectiles, level, dt);
                ship.update(dt, level, input);

                if (input.fire) tryFire(ship);
                if (input.switchWeapon) ship.cycleWeapon();
            } else {
                ship.update(dt, level, null);
                if (ship.respawnTimer <= 0) {
                    const sp = level.getSpawnPoint(randInt(0, level.spawnPoints.length - 1));
                    ship.spawn(sp.x, sp.y);
                }
            }
            aiIdx++;
        }

        // Burst fire
        if (ship.alive && ship.burstRemaining > 0 && ship.burstCooldown <= 0) {
            fireProjectile(ship, WEAPONS[ship.burstWeaponId], 0);
            ship.burstRemaining--;
            ship.burstCooldown = WEAPONS[ship.burstWeaponId].burstDelay || 50;
        }

        // Thrust particles
        if (ship.alive && ship.thrustAmount > 0) {
            particles.emit(
                ship.x - Math.cos(ship.angle) * 10,
                ship.y - Math.sin(ship.angle) * 10,
                -Math.cos(ship.angle) * 100 + randFloat(-30, 30),
                -Math.sin(ship.angle) * 100 + randFloat(-30, 30),
                0.2, 2, '#f80', 'trail'
            );
        }
    }

    // Update projectiles
    updateProjectiles(dt);

    // Update beams
    updateBeams(dt);

    // Update shockwaves
    updateShockwaveAttacks(dt);

    // Weapon pickups
    for (const wp of level.weaponSpawns) {
        if (!wp.alive) {
            wp.timer -= dt * 1000;
            if (wp.timer <= 0) {
                wp.alive = true;
                wp.weaponId = getRandomWeaponId();
            }
            continue;
        }
        wp.update(dt);

        // Check pickup collision with ships
        for (const ship of ships) {
            if (!ship.alive) continue;
            if (dist(ship.x, ship.y, wp.x, wp.y) < ship.radius + wp.radius) {
                ship.addWeapon(wp.weaponId);
                wp.alive = false;
                wp.timer = wp.respawnTime;
                audio.play('pickup', wp.x, wp.y, camX + canvas.width / 2, camY + canvas.height / 2);
                particles.sparks(wp.x, wp.y, 8, WEAPONS[wp.weaponId].color);
            }
        }
    }

    // Fire/acid zone damage
    for (const fz of level.fireZones) {
        for (const ship of ships) {
            if (!ship.alive) continue;
            if (dist(ship.x, ship.y, fz.x, fz.y) < fz.radius + ship.radius) {
                ship.takeDamage(fz.dps * dt, fz.ownerId);
                if (!ship.alive) {
                    handleKill(fz.ownerId, ship);
                }
            }
        }
    }
    for (const ap of level.acidPools) {
        for (const ship of ships) {
            if (!ship.alive) continue;
            if (dist(ship.x, ship.y, ap.x, ap.y) < ap.radius + ship.radius) {
                ship.takeDamage(ap.dps * dt, ap.ownerId);
                if (!ship.alive) {
                    handleKill(ap.ownerId, ship);
                }
            }
        }
    }

    // Particles
    particles.update(dt);

    // Screen shake
    if (screenShake > 0) {
        screenShake -= dt * 20;
        screenShakeX = (Math.random() - 0.5) * screenShake;
        screenShakeY = (Math.random() - 0.5) * screenShake;
    } else {
        screenShakeX = 0;
        screenShakeY = 0;
    }

    // Kill feed cleanup
    for (let i = killFeed.length - 1; i >= 0; i--) {
        killFeed[i].timer -= dt;
        if (killFeed[i].timer <= 0) killFeed.splice(i, 1);
    }

    // Check win condition
    if (fragLimit > 0 && !winner) {
        for (const ship of ships) {
            if (ship.kills >= fragLimit) {
                winner = ship;
                break;
            }
        }
    }
}

// ---- Firing System ----
function tryFire(ship) {
    if (ship.empTimer > 0) return;
    if (ship.fireCooldown > 0) return;

    const w = ship.getWeapon();

    // Remote mine detonation
    if (w.remote && ship.remoteMines.length > 0) {
        for (const mine of ship.remoteMines) {
            mine.lifetime = 0; // trigger explosion
        }
        ship.remoteMines = [];
        ship.fireCooldown = 200;
        return;
    }

    // Shield activation
    if (w.shield) {
        ship.shieldTimer = w.lifetime;
        ship.shieldRadius = w.shieldRadius;
        ship.shieldReflective = w.reflective || false;
        ship.fireCooldown = w.rate;
        audio.play(w.sound, ship.x, ship.y, camX + canvas.width / 2, camY + canvas.height / 2);
        return;
    }

    // Shockwave
    if (w.shockwave) {
        shockwaveAttacks.push({
            x: ship.x, y: ship.y,
            radius: 0, maxRadius: w.shockRadius,
            growSpeed: w.shockGrow,
            damage: w.damage,
            ownerId: ship.id,
            teamId: ship.teamId,
            hit: new Set()
        });
        ship.fireCooldown = w.rate;
        audio.play(w.sound, ship.x, ship.y, camX + canvas.width / 2, camY + canvas.height / 2);
        particles.shockwaves.push({
            x: ship.x, y: ship.y,
            radius: 5, maxRadius: w.shockRadius,
            life: 0.5, maxLife: 0.5, color: w.color
        });
        return;
    }

    // Beam weapon
    if (w.beam) {
        const beamEnd = level.raycast(ship.x, ship.y, ship.angle, w.beamRange);
        beams.push({
            x: ship.x, y: ship.y,
            angle: ship.angle,
            length: beamEnd,
            damage: w.beamDPS / 60,
            ownerId: ship.id,
            teamId: ship.teamId,
            color: w.color,
            life: 0.05
        });
        audio.play(w.sound, ship.x, ship.y, camX + canvas.width / 2, camY + canvas.height / 2);
        return;
    }

    // Burst fire weapons
    if (w.burstCount && !ship.burstRemaining) {
        ship.burstRemaining = w.burstCount;
        ship.burstCooldown = 0;
        ship.burstWeaponId = w.id;
        ship.fireCooldown = w.rate;
        return;
    }

    ship.fireCooldown = w.rate;

    const count = w.count || 1;
    if (w.fan && count > 1) {
        // Fan spread
        const totalSpread = w.spread * 2;
        for (let i = 0; i < count; i++) {
            const a = ship.angle - totalSpread / 2 + (totalSpread / (count - 1)) * i;
            fireProjectile(ship, w, a - ship.angle);
        }
    } else if (w.offsetY && count > 1) {
        // Parallel shots
        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * w.offsetY;
            fireProjectile(ship, w, 0, offset);
        }
    } else {
        fireProjectile(ship, w, 0);
    }

    audio.play(w.sound, ship.x, ship.y, camX + canvas.width / 2, camY + canvas.height / 2);
}

function fireProjectile(ship, w, angleOffset, lateralOffset) {
    const angle = ship.angle + (angleOffset || 0) + (Math.random() - 0.5) * w.spread;
    let px = ship.x + Math.cos(ship.angle) * 12;
    let py = ship.y + Math.sin(ship.angle) * 12;

    if (lateralOffset) {
        px += Math.cos(ship.angle + Math.PI / 2) * lateralOffset;
        py += Math.sin(ship.angle + Math.PI / 2) * lateralOffset;
    }

    const proj = {
        x: px, y: py,
        vx: Math.cos(angle) * w.speed + ship.vx * 0.3,
        vy: Math.sin(angle) * w.speed + ship.vy * 0.3,
        angle: angle,
        damage: w.damage,
        radius: w.projSize,
        length: w.projLen,
        color: w.color,
        ownerId: ship.id,
        teamId: ship.teamId,
        lifetime: w.lifetime,
        maxLifetime: w.lifetime,
        alive: true,
        weaponId: w.id,
        // Special properties
        explosive: w.explosive || false,
        explRadius: w.explRadius || 0,
        homing: w.homing || false,
        homingStr: w.homingStr || 0,
        piercing: w.piercing || false,
        bounces: w.bounces || 0,
        mine: w.mine || false,
        triggerDist: w.triggerDist || 0,
        remote: w.remote || false,
        trail: w.trail || false,
        accel: w.accel || 0,
        glow: w.glow || false,
        slow: w.slow || 0,
        slowDur: w.slowDur || 0,
        emp: w.emp || false,
        empDur: w.empDur || 0,
        knockback: w.knockback || 0,
        chain: w.chain || false,
        chainRange: w.chainRange || 0,
        chainCount: w.chainCount || 0,
        chainDecay: w.chainDecay || 1,
        spiral: w.spiral || false,
        spiralSpeed: w.spiralSpeed || 0,
        spiralRadius: w.spiralRadius || 0,
        spiralPhase: 0,
        cluster: w.cluster || false,
        clusterCount: w.clusterCount || 0,
        clusterSpread: w.clusterSpread || TAU,
        fire: w.fire || false,
        fireDur: w.fireDur || 0,
        fireDPS: w.fireDPS || 0,
        pool: w.pool || false,
        poolDur: w.poolDur || 0,
        poolRadius: w.poolRadius || 0,
        poolDPS: w.poolDPS || 0,
        gravity: w.gravity || false,
        gravRadius: w.gravRadius || 0,
        gravStr: w.gravStr || 0,
        nuke: w.nuke || false,
        teleport: w.teleport || false,
        screenShake: w.screenShake || 0,
        fragOnDeath: w.fragOnDeath || false,
        fragCount: w.fragCount || 0,
        hitShips: new Set()
    };

    // Register remote mine
    if (w.remote) {
        ship.remoteMines.push(proj);
    }

    projectiles.push(proj);
}

// ---- Projectile Update ----
function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (!p.alive) {
            projectiles.splice(i, 1);
            continue;
        }

        p.lifetime -= dt;

        // Mine behavior - stays still
        if (p.mine && p.lifetime > 0.5) {
            p.vx *= 0.9;
            p.vy *= 0.9;

            // Proximity trigger
            if (!p.remote) {
                for (const ship of ships) {
                    if (!ship.alive || ship.id === p.ownerId) continue;
                    if (gameMode === 'team' && ship.teamId === p.teamId) continue;
                    if (dist(p.x, p.y, ship.x, ship.y) < p.triggerDist) {
                        p.lifetime = 0;
                        break;
                    }
                }
            }
        }

        // Homing
        if (p.homing && !p.mine) {
            let closest = null;
            let closestDist = 500;
            for (const ship of ships) {
                if (!ship.alive || ship.id === p.ownerId) continue;
                if (gameMode === 'team' && ship.teamId === p.teamId) continue;
                const d = dist(p.x, p.y, ship.x, ship.y);
                if (d < closestDist) {
                    closestDist = d;
                    closest = ship;
                }
            }
            if (closest) {
                const desired = angleBetween(p.x, p.y, closest.x, closest.y);
                const diff = angleDiff(p.angle, desired);
                p.angle += clamp(diff, -p.homingStr * dt, p.homingStr * dt);
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                p.vx = Math.cos(p.angle) * speed;
                p.vy = Math.sin(p.angle) * speed;
            }
        }

        // Acceleration
        if (p.accel) {
            p.vx += Math.cos(p.angle) * p.accel * dt;
            p.vy += Math.sin(p.angle) * p.accel * dt;
        }

        // Spiral
        if (p.spiral) {
            p.spiralPhase += p.spiralSpeed * dt;
            const perpX = -Math.sin(p.angle);
            const perpY = Math.cos(p.angle);
            p.x += perpX * Math.cos(p.spiralPhase) * p.spiralRadius * dt;
            p.y += perpY * Math.cos(p.spiralPhase) * p.spiralRadius * dt;
        }

        // Gravity well
        if (p.gravity) {
            for (const ship of ships) {
                if (!ship.alive || ship.id === p.ownerId) continue;
                const d = dist(p.x, p.y, ship.x, ship.y);
                if (d < p.gravRadius && d > 5) {
                    const force = p.gravStr / (d * d) * dt * 1000;
                    const ax = (p.x - ship.x) / d;
                    const ay = (p.y - ship.y) / d;
                    ship.vx += ax * force;
                    ship.vy += ay * force;
                }
            }
        }

        // Move
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Trail
        if (p.trail && p.alive) {
            particles.trail(p.x, p.y, -p.vx * 0.1, -p.vy * 0.1, p.color);
        }

        // Glow particles
        if (p.glow && Math.random() < 0.3) {
            particles.emit(p.x, p.y, randFloat(-20, 20), randFloat(-20, 20), 0.2, 2, p.color);
        }

        // Wall collision
        if (level.isWall(p.x, p.y)) {
            if (p.bounces > 0) {
                p.bounces--;
                const normal = level.getWallNormal(p.x, p.y);
                const dot = p.vx * normal.x + p.vy * normal.y;
                p.vx -= 2 * dot * normal.x;
                p.vy -= 2 * dot * normal.y;
                p.angle = Math.atan2(p.vy, p.vx);
                // Push out of wall
                p.x += normal.x * 5;
                p.y += normal.y * 5;
                audio.play('ricochet', p.x, p.y, camX + canvas.width / 2, camY + canvas.height / 2);
                particles.sparks(p.x, p.y, 3, '#ff0');
            } else {
                p.lifetime = 0;
            }
        }

        // Ship collision
        if (!p.mine || p.lifetime <= 0.5) {
            for (const ship of ships) {
                if (!ship.alive || ship.id === p.ownerId) continue;
                if (p.piercing && p.hitShips.has(ship.id)) continue;
                if (gameMode === 'team' && ship.teamId === p.teamId) continue;

                const d = dist(p.x, p.y, ship.x, ship.y);
                if (d < ship.radius + p.radius) {
                    // Shield check
                    if (ship.shieldTimer > 0) {
                        if (ship.shieldReflective) {
                            p.ownerId = ship.id;
                            p.teamId = ship.teamId;
                            p.vx *= -1;
                            p.vy *= -1;
                            p.angle = Math.atan2(p.vy, p.vx);
                            particles.sparks(p.x, p.y, 5, '#aaf');
                        } else {
                            p.lifetime = 0;
                        }
                        continue;
                    }

                    // Apply damage
                    ship.takeDamage(p.damage, p.ownerId);

                    // Knockback
                    if (p.knockback) {
                        const ka = Math.atan2(p.vy, p.vx);
                        ship.vx += Math.cos(ka) * p.knockback;
                        ship.vy += Math.sin(ka) * p.knockback;
                    }

                    // Slow
                    if (p.slow) {
                        ship.slowFactor = p.slow;
                        ship.slowTimer = p.slowDur;
                    }

                    // EMP
                    if (p.emp) {
                        ship.empTimer = p.empDur;
                    }

                    // Teleport
                    if (p.teleport) {
                        const shooter = ships.find(s => s.id === p.ownerId);
                        if (shooter && shooter.alive) {
                            shooter.x = p.x;
                            shooter.y = p.y;
                            particles.sparks(shooter.x, shooter.y, 15, '#a0f');
                        }
                    }

                    // Chain lightning
                    if (p.chain && p.chainCount > 0) {
                        chainLightning(p, ship);
                    }

                    if (!ship.alive) {
                        handleKill(p.ownerId, ship);
                    }

                    particles.sparks(p.x, p.y, 5, p.color);

                    if (p.piercing) {
                        p.hitShips.add(ship.id);
                    } else if (!p.explosive) {
                        p.lifetime = 0;
                    }

                    if (p.explosive) {
                        p.lifetime = 0;
                    }
                    break;
                }
            }
        }

        // Death / explosion
        if (p.lifetime <= 0) {
            p.alive = false;

            if (p.explosive) {
                explode(p.x, p.y, p.explRadius, p.damage * 0.5, p.ownerId, p.teamId, p.nuke);
                if (p.screenShake) screenShake = Math.max(screenShake, p.screenShake);
            }

            if (p.cluster) {
                for (let c = 0; c < p.clusterCount; c++) {
                    const ca = (c / p.clusterCount) * p.clusterSpread + (Math.random() - 0.5) * 0.3;
                    const cp = {
                        x: p.x, y: p.y,
                        vx: Math.cos(ca) * 300, vy: Math.sin(ca) * 300,
                        angle: ca, damage: p.damage * 0.4, radius: 3, length: 4,
                        color: p.color, ownerId: p.ownerId, teamId: p.teamId,
                        lifetime: 0.8, maxLifetime: 0.8, alive: true, weaponId: p.weaponId,
                        explosive: true, explRadius: p.explRadius * 0.5,
                        homing: false, piercing: false, bounces: 0,
                        mine: false, trail: false, glow: false,
                        slow: 0, emp: false, knockback: 0,
                        chain: false, spiral: false, cluster: false,
                        fire: false, pool: false, gravity: false,
                        nuke: false, teleport: false, remote: false,
                        screenShake: 0, fragOnDeath: false,
                        hitShips: new Set(), accel: 0
                    };
                    projectiles.push(cp);
                }
            }

            if (p.fragOnDeath) {
                for (let f = 0; f < (p.fragCount || 3); f++) {
                    const fa = Math.random() * TAU;
                    const fp = {
                        x: p.x, y: p.y,
                        vx: Math.cos(fa) * 400, vy: Math.sin(fa) * 400,
                        angle: fa, damage: p.damage * 0.3, radius: 2, length: 3,
                        color: p.color, ownerId: p.ownerId, teamId: p.teamId,
                        lifetime: 0.5, maxLifetime: 0.5, alive: true, weaponId: p.weaponId,
                        explosive: false, homing: false, piercing: false, bounces: 0,
                        mine: false, trail: false, glow: false,
                        slow: 0, emp: false, knockback: 0,
                        chain: false, spiral: false, cluster: false,
                        fire: false, pool: false, gravity: false,
                        nuke: false, teleport: false, remote: false,
                        screenShake: 0, fragOnDeath: false,
                        hitShips: new Set(), accel: 0
                    };
                    projectiles.push(fp);
                }
            }

            if (p.fire) {
                level.fireZones.push({
                    x: p.x, y: p.y, radius: 30,
                    timer: p.fireDur, dps: p.fireDPS,
                    ownerId: p.ownerId
                });
            }

            if (p.pool) {
                level.acidPools.push({
                    x: p.x, y: p.y, radius: p.poolRadius,
                    timer: p.poolDur, dps: p.poolDPS,
                    ownerId: p.ownerId
                });
            }
        }
    }
}

function explode(x, y, radius, damage, ownerId, teamId, isNuke) {
    // Damage ships in radius
    for (const ship of ships) {
        if (!ship.alive) continue;
        if (gameMode === 'team' && ship.teamId === teamId && ship.id !== ownerId) continue;
        const d = dist(x, y, ship.x, ship.y);
        if (d < radius) {
            const dmgFactor = 1 - (d / radius);
            ship.takeDamage(damage * dmgFactor, ownerId);

            // Knockback from explosion
            const ka = angleBetween(x, y, ship.x, ship.y);
            const force = (1 - d / radius) * 300;
            ship.vx += Math.cos(ka) * force;
            ship.vy += Math.sin(ka) * force;

            if (!ship.alive) {
                handleKill(ownerId, ship);
            }
        }
    }

    if (isNuke) {
        particles.nukeExplosion(x, y, radius);
        audio.play('nuke', x, y, camX + canvas.width / 2, camY + canvas.height / 2);
    } else if (radius > 80) {
        particles.bigExplosion(x, y, radius, 80);
        audio.play('bigexplosion', x, y, camX + canvas.width / 2, camY + canvas.height / 2);
    } else {
        particles.explosion(x, y, radius, '#f80', 20);
        audio.play('explosion', x, y, camX + canvas.width / 2, camY + canvas.height / 2);
    }
}

function chainLightning(proj, hitShip) {
    let currentTarget = hitShip;
    let damage = proj.damage * proj.chainDecay;
    let remaining = proj.chainCount;
    const hitSet = new Set([hitShip.id, proj.ownerId]);

    while (remaining > 0) {
        let closest = null;
        let closestDist = proj.chainRange;

        for (const ship of ships) {
            if (!ship.alive || hitSet.has(ship.id)) continue;
            if (gameMode === 'team' && ship.teamId === proj.teamId) continue;
            const d = dist(currentTarget.x, currentTarget.y, ship.x, ship.y);
            if (d < closestDist) {
                closestDist = d;
                closest = ship;
            }
        }

        if (!closest) break;

        closest.takeDamage(damage, proj.ownerId);
        hitSet.add(closest.id);

        // Visual lightning effect
        particles.emit(
            (currentTarget.x + closest.x) / 2,
            (currentTarget.y + closest.y) / 2,
            0, 0, 0.2, 3, '#4af'
        );

        if (!closest.alive) {
            handleKill(proj.ownerId, closest);
        }

        currentTarget = closest;
        damage *= proj.chainDecay;
        remaining--;
    }
}

function updateBeams(dt) {
    for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i];
        b.life -= dt;
        if (b.life <= 0) {
            beams.splice(i, 1);
            continue;
        }

        // Check beam hits
        const step = 5;
        for (let d = 0; d < b.length; d += step) {
            const bx = b.x + Math.cos(b.angle) * d;
            const by = b.y + Math.sin(b.angle) * d;

            for (const ship of ships) {
                if (!ship.alive || ship.id === b.ownerId) continue;
                if (gameMode === 'team' && ship.teamId === b.teamId) continue;
                if (dist(bx, by, ship.x, ship.y) < ship.radius + 3) {
                    ship.takeDamage(b.damage, b.ownerId);
                    if (!ship.alive) handleKill(b.ownerId, ship);
                }
            }
        }
    }
}

function updateShockwaveAttacks(dt) {
    for (let i = shockwaveAttacks.length - 1; i >= 0; i--) {
        const sw = shockwaveAttacks[i];
        sw.radius += sw.growSpeed * dt;

        if (sw.radius >= sw.maxRadius) {
            shockwaveAttacks.splice(i, 1);
            continue;
        }

        for (const ship of ships) {
            if (!ship.alive || ship.id === sw.ownerId) continue;
            if (gameMode === 'team' && ship.teamId === sw.teamId) continue;
            if (sw.hit.has(ship.id)) continue;

            const d = dist(sw.x, sw.y, ship.x, ship.y);
            if (d < sw.radius + ship.radius && d > sw.radius - 20) {
                ship.takeDamage(sw.damage, sw.ownerId);
                sw.hit.add(ship.id);

                const ka = angleBetween(sw.x, sw.y, ship.x, ship.y);
                ship.vx += Math.cos(ka) * 400;
                ship.vy += Math.sin(ka) * 400;

                if (!ship.alive) handleKill(sw.ownerId, ship);
            }
        }
    }
}

function handleKill(killerId, victim) {
    const killer = ships.find(s => s.id === killerId);
    if (killer && killer.id !== victim.id) {
        killer.kills++;
    }

    particles.shipDestroyed(victim.x, victim.y, victim.color.hex);
    audio.play('death', victim.x, victim.y, camX + canvas.width / 2, camY + canvas.height / 2);
    screenShake = Math.max(screenShake, 5);

    const killerName = killer ? killer.name : '???';
    const killerColor = killer ? killer.color.hex : '#fff';
    killFeed.push({
        text: `${killerName} -> ${victim.name}`,
        killerColor: killerColor,
        victimColor: victim.color.hex,
        timer: 4
    });
}

// ---- Render ----
function render() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Camera follows first player
    const player1 = ships.find(s => s.isPlayer && s.playerIndex === 0);
    if (player1) {
        const targetCamX = player1.x - canvas.width / 2;
        const targetCamY = player1.y - canvas.height / 2;
        camX = lerp(camX, targetCamX, 0.1);
        camY = lerp(camY, targetCamY, 0.1);
    }

    // Clamp camera
    camX = clamp(camX, 0, level.width - canvas.width);
    camY = clamp(camY, 0, level.height - canvas.height);

    // Apply screen shake
    const viewX = camX + screenShakeX;
    const viewY = camY + screenShakeY;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw level
    level.draw(ctx, viewX, viewY, canvas.width, canvas.height);

    // Draw beams
    for (const b of beams) {
        const sx = b.x - viewX;
        const sy = b.y - viewY;
        const ex = b.x + Math.cos(b.angle) * b.length - viewX;
        const ey = b.y + Math.sin(b.angle) * b.length - viewY;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    // Draw projectiles
    for (const p of projectiles) {
        if (!p.alive) continue;
        const sx = p.x - viewX;
        const sy = p.y - viewY;
        if (sx < -30 || sx > canvas.width + 30 || sy < -30 || sy > canvas.height + 30) continue;

        ctx.save();

        if (p.mine) {
            // Mine drawing
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.6 + Math.sin(gameTime * 5) * 0.3;
            ctx.beginPath();
            ctx.arc(sx, sy, p.radius, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (p.gravity) {
            // Gravity well
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            for (let r = p.radius; r < p.gravRadius; r += 20) {
                ctx.globalAlpha = 0.3 * (1 - r / p.gravRadius);
                ctx.beginPath();
                ctx.arc(sx, sy, r + Math.sin(gameTime * 3 + r) * 5, 0, TAU);
                ctx.stroke();
            }
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(sx, sy, p.radius, 0, TAU);
            ctx.fill();
        } else {
            // Regular projectile
            ctx.translate(sx, sy);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            if (p.glow) {
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
            }
            ctx.fillRect(-p.length / 2, -p.radius / 2, p.length, p.radius);
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    // Draw ships
    for (const ship of ships) {
        ship.draw(ctx, viewX, viewY, ship.isPlayer && ship.playerIndex === 0);
    }

    // Draw particles
    particles.draw(ctx, viewX, viewY);

    // ---- HUD ----
    // Current weapon
    if (player1 && player1.alive) {
        const w = player1.getWeapon();
        ctx.fillStyle = w.color;
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`[${w.name}]`, 10, canvas.height - 40);
        ctx.fillStyle = '#aaa';
        ctx.font = '11px monospace';
        ctx.fillText(w.desc, 10, canvas.height - 22);

        // Weapon list
        for (let i = 0; i < player1.weapons.length; i++) {
            const pw = WEAPONS[player1.weapons[i]];
            const active = i === player1.currentWeapon;
            ctx.fillStyle = active ? pw.color : '#555';
            ctx.font = active ? 'bold 12px monospace' : '11px monospace';
            ctx.fillText(`${i + 1}: ${pw.name}`, 10, canvas.height - 60 - (player1.weapons.length - 1 - i) * 16);
        }

        // HP
        const hpW = 200;
        const hpH = 8;
        const hpX = 10;
        const hpY = canvas.height - 8;
        ctx.fillStyle = '#300';
        ctx.fillRect(hpX, hpY, hpW, hpH);
        const hpR = player1.hp / SHIP_MAX_HP;
        ctx.fillStyle = hpR > 0.5 ? '#0f0' : hpR > 0.25 ? '#f80' : '#f00';
        ctx.fillRect(hpX, hpY, hpW * hpR, hpH);
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(`HP: ${Math.ceil(player1.hp)}`, hpX + hpW + 8, hpY + 7);

        // Score
        ctx.fillStyle = '#0f0';
        ctx.font = '16px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`KILLS: ${player1.kills}`, canvas.width - 10, canvas.height - 10);
    }

    // Respawn message
    if (player1 && !player1.alive) {
        ctx.fillStyle = '#f00';
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ZERSTÖRT', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#aaa';
        ctx.font = '14px monospace';
        ctx.fillText(`Respawn in ${player1.respawnTimer.toFixed(1)}s`, canvas.width / 2, canvas.height / 2 + 10);
    }

    // Kill feed
    ctx.textAlign = 'left';
    for (let i = 0; i < killFeed.length && i < 6; i++) {
        const kf = killFeed[killFeed.length - 1 - i];
        ctx.globalAlpha = Math.min(1, kf.timer);
        ctx.fillStyle = kf.killerColor;
        ctx.font = '11px monospace';
        ctx.fillText(kf.text, 10, 20 + i * 16);
    }
    ctx.globalAlpha = 1;

    // Scoreboard
    if (showScoreboard) {
        drawScoreboard();
    }

    // Winner
    if (winner) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f80';
        ctx.font = '36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${winner.name} GEWINNT!`, canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillStyle = '#fff';
        ctx.font = '18px monospace';
        ctx.fillText(`${winner.kills} Kills`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillStyle = '#aaa';
        ctx.font = '14px monospace';
        ctx.fillText('ESC = Hauptmenü', canvas.width / 2, canvas.height / 2 + 50);
    }

    // Minimap
    drawMinimap();

    // FPS counter
    ctx.fillStyle = '#555';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Ships: ${ships.filter(s => s.alive).length}/${ships.length} Proj: ${projectiles.length}`, canvas.width - 10, 14);
}

function drawScoreboard() {
    const sorted = [...ships].sort((a, b) => b.kills - a.kills);
    const sbW = 350;
    const lineH = 18;
    const sbH = sorted.length * lineH + 40;
    const sbX = (canvas.width - sbW) / 2;
    const sbY = (canvas.height - sbH) / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(sbX, sbY, sbW, sbH);
    ctx.strokeStyle = '#0f0';
    ctx.strokeRect(sbX, sbY, sbW, sbH);

    ctx.fillStyle = '#f80';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCOREBOARD', canvas.width / 2, sbY + 18);

    ctx.textAlign = 'left';
    ctx.font = '10px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('#', sbX + 10, sbY + 35);
    ctx.fillText('NAME', sbX + 30, sbY + 35);
    ctx.fillText('KILLS', sbX + 200, sbY + 35);
    ctx.fillText('DEATHS', sbX + 260, sbY + 35);
    ctx.fillText('K/D', sbX + 320, sbY + 35);

    for (let i = 0; i < sorted.length; i++) {
        const s = sorted[i];
        const y = sbY + 52 + i * lineH;
        ctx.fillStyle = s.isPlayer ? s.color.hex : '#888';
        ctx.font = s.isPlayer ? 'bold 11px monospace' : '11px monospace';
        ctx.fillText(`${i + 1}`, sbX + 10, y);
        ctx.fillText(s.name, sbX + 30, y);
        ctx.fillText(`${s.kills}`, sbX + 200, y);
        ctx.fillText(`${s.deaths}`, sbX + 260, y);
        const kd = s.deaths > 0 ? (s.kills / s.deaths).toFixed(1) : s.kills.toFixed(1);
        ctx.fillText(kd, sbX + 320, y);
    }
}

function drawMinimap() {
    const mmW = 150;
    const mmH = 150;
    const mmX = canvas.width - mmW - 10;
    const mmY = 20;
    const scaleX = mmW / level.width;
    const scaleY = mmH / level.height;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(mmX, mmY, mmW, mmH);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(mmX, mmY, mmW, mmH);

    // Draw ships as dots
    for (const ship of ships) {
        if (!ship.alive) continue;
        const mx = mmX + ship.x * scaleX;
        const my = mmY + ship.y * scaleY;
        ctx.fillStyle = ship.isPlayer ? ship.color.hex : '#555';
        const sz = ship.isPlayer ? 3 : 1.5;
        ctx.fillRect(mx - sz / 2, my - sz / 2, sz, sz);
    }

    // Camera viewport indicator
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(
        mmX + camX * scaleX,
        mmY + camY * scaleY,
        canvas.width * scaleX,
        canvas.height * scaleY
    );
    ctx.globalAlpha = 1;
}

// ---- Window resize ----
window.addEventListener('resize', () => {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});
