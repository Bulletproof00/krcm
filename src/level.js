// ============================================================
// TOU - Procedural Level Generator
// ============================================================

const TILE_SIZE = 32;
const TILE_EMPTY = 0;
const TILE_WALL = 1;
const TILE_SPAWN = 2;

class Level {
    constructor(sizeKey) {
        const sizes = { small: 80, medium: 120, large: 180 };
        this.gridW = sizes[sizeKey] || 120;
        this.gridH = sizes[sizeKey] || 120;
        this.width = this.gridW * TILE_SIZE;
        this.height = this.gridH * TILE_SIZE;
        this.grid = [];
        this.spawnPoints = [];
        this.weaponSpawns = [];
        this.fireZones = []; // active fire zones
        this.acidPools = []; // active acid pools
        this.wallCanvas = null;
    }

    generate() {
        const gw = this.gridW;
        const gh = this.gridH;
        // Fill with walls
        this.grid = new Array(gw * gh).fill(TILE_WALL);

        // Cellular automata cave generation
        // Start by randomly clearing ~48% of tiles
        for (let i = 0; i < gw * gh; i++) {
            const x = i % gw;
            const y = Math.floor(i / gw);
            // Keep border as walls
            if (x < 2 || x >= gw - 2 || y < 2 || y >= gh - 2) continue;
            if (Math.random() < 0.48) {
                this.grid[i] = TILE_EMPTY;
            }
        }

        // Run cellular automata 5 iterations
        for (let iter = 0; iter < 5; iter++) {
            const newGrid = new Array(gw * gh).fill(TILE_WALL);
            for (let y = 2; y < gh - 2; y++) {
                for (let x = 2; x < gw - 2; x++) {
                    let walls = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            if (this.grid[(y + dy) * gw + (x + dx)] === TILE_WALL) walls++;
                        }
                    }
                    newGrid[y * gw + x] = walls >= 5 ? TILE_WALL : TILE_EMPTY;
                }
            }
            this.grid = newGrid;
        }

        // Carve corridors to ensure connectivity
        this._carveCorridors();

        // Carve some arenas (open chambers)
        this._carveArenas();

        // Find spawn points
        this._findSpawnPoints();

        // Place weapon pickups
        this._placeWeaponPickups();

        // Pre-render wall canvas
        this._renderWalls();
    }

    _carveCorridors() {
        const gw = this.gridW;
        const gh = this.gridH;
        const corridorCount = Math.floor((gw + gh) / 8);

        for (let i = 0; i < corridorCount; i++) {
            let x = randInt(5, gw - 6);
            let y = randInt(5, gh - 6);
            const horizontal = Math.random() < 0.5;
            const length = randInt(10, 30);
            const width = randInt(1, 3);

            for (let l = 0; l < length; l++) {
                for (let w = -width; w <= width; w++) {
                    const tx = horizontal ? x + l : x + w;
                    const ty = horizontal ? y + w : y + l;
                    if (tx >= 2 && tx < gw - 2 && ty >= 2 && ty < gh - 2) {
                        this.grid[ty * gw + tx] = TILE_EMPTY;
                    }
                }
                // Occasional branch
                if (Math.random() < 0.15) {
                    const branchLen = randInt(3, 10);
                    for (let b = 0; b < branchLen; b++) {
                        const bx = horizontal ? x + l : x + l * (Math.random() < 0.5 ? 1 : -1);
                        const by = horizontal ? y + b * randSign() : y + l;
                        if (bx >= 2 && bx < gw - 2 && by >= 2 && by < gh - 2) {
                            this.grid[by * gw + bx] = TILE_EMPTY;
                        }
                    }
                }
            }
        }
    }

    _carveArenas() {
        const gw = this.gridW;
        const gh = this.gridH;
        const arenaCount = Math.floor((gw * gh) / 1500);

        for (let i = 0; i < arenaCount; i++) {
            const cx = randInt(15, gw - 16);
            const cy = randInt(15, gh - 16);
            const rx = randInt(5, 12);
            const ry = randInt(5, 12);

            for (let y = cy - ry; y <= cy + ry; y++) {
                for (let x = cx - rx; x <= cx + rx; x++) {
                    if (x >= 2 && x < gw - 2 && y >= 2 && y < gh - 2) {
                        const dx = (x - cx) / rx;
                        const dy = (y - cy) / ry;
                        if (dx * dx + dy * dy <= 1.0) {
                            this.grid[y * gw + x] = TILE_EMPTY;
                        }
                    }
                }
            }

            // Some arenas have pillars
            if (Math.random() < 0.4) {
                const pillarCount = randInt(1, 4);
                for (let p = 0; p < pillarCount; p++) {
                    const px = cx + randInt(-rx + 2, rx - 2);
                    const py = cy + randInt(-ry + 2, ry - 2);
                    const pr = randInt(1, 2);
                    for (let dy = -pr; dy <= pr; dy++) {
                        for (let dx = -pr; dx <= pr; dx++) {
                            if (dx * dx + dy * dy <= pr * pr) {
                                const tx = px + dx;
                                const ty = py + dy;
                                if (tx >= 2 && tx < gw - 2 && ty >= 2 && ty < gh - 2) {
                                    this.grid[ty * gw + tx] = TILE_WALL;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    _findSpawnPoints() {
        const gw = this.gridW;
        const gh = this.gridH;
        this.spawnPoints = [];

        for (let attempt = 0; attempt < 500; attempt++) {
            const x = randInt(5, gw - 6);
            const y = randInt(5, gh - 6);
            if (this.grid[y * gw + x] !== TILE_EMPTY) continue;

            // Check area is clear
            let clear = true;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (this.grid[(y + dy) * gw + (x + dx)] !== TILE_EMPTY) {
                        clear = false;
                        break;
                    }
                }
                if (!clear) break;
            }
            if (!clear) continue;

            // Check distance from other spawns
            const wx = x * TILE_SIZE + TILE_SIZE / 2;
            const wy = y * TILE_SIZE + TILE_SIZE / 2;
            let tooClose = false;
            for (const sp of this.spawnPoints) {
                if (dist(wx, wy, sp.x, sp.y) < 200) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;

            this.spawnPoints.push({ x: wx, y: wy });
            if (this.spawnPoints.length >= 64) break;
        }
    }

    _placeWeaponPickups() {
        const gw = this.gridW;
        const gh = this.gridH;
        this.weaponSpawns = [];
        const count = Math.floor((gw * gh) / 300);

        for (let attempt = 0; attempt < count * 3; attempt++) {
            const x = randInt(4, gw - 5);
            const y = randInt(4, gh - 5);
            if (this.grid[y * gw + x] !== TILE_EMPTY) continue;

            const wx = x * TILE_SIZE + TILE_SIZE / 2;
            const wy = y * TILE_SIZE + TILE_SIZE / 2;

            let tooClose = false;
            for (const wp of this.weaponSpawns) {
                if (dist(wx, wy, wp.x, wp.y) < 150) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;

            this.weaponSpawns.push(new WeaponPickup(wx, wy, getRandomWeaponId()));
            if (this.weaponSpawns.length >= count) break;
        }
    }

    getSpawnPoint(index) {
        if (this.spawnPoints.length === 0) {
            return { x: this.width / 2, y: this.height / 2 };
        }
        return this.spawnPoints[index % this.spawnPoints.length];
    }

    isWall(px, py) {
        const gx = Math.floor(px / TILE_SIZE);
        const gy = Math.floor(py / TILE_SIZE);
        if (gx < 0 || gx >= this.gridW || gy < 0 || gy >= this.gridH) return true;
        return this.grid[gy * this.gridW + gx] === TILE_WALL;
    }

    isWallGrid(gx, gy) {
        if (gx < 0 || gx >= this.gridW || gy < 0 || gy >= this.gridH) return true;
        return this.grid[gy * this.gridW + gx] === TILE_WALL;
    }

    // Cast a ray, returns distance to wall
    raycast(x, y, angle, maxDist) {
        const step = TILE_SIZE / 2;
        const dx = Math.cos(angle) * step;
        const dy = Math.sin(angle) * step;
        let cx = x, cy = y;
        let traveled = 0;
        while (traveled < maxDist) {
            cx += dx;
            cy += dy;
            traveled += step;
            if (this.isWall(cx, cy)) return traveled;
        }
        return maxDist;
    }

    // Get wall normal at a point (for bouncing)
    getWallNormal(px, py) {
        const gx = Math.floor(px / TILE_SIZE);
        const gy = Math.floor(py / TILE_SIZE);
        let nx = 0, ny = 0;
        if (this.isWallGrid(gx - 1, gy)) nx += 1;
        if (this.isWallGrid(gx + 1, gy)) nx -= 1;
        if (this.isWallGrid(gx, gy - 1)) ny += 1;
        if (this.isWallGrid(gx, gy + 1)) ny -= 1;
        const len = Math.sqrt(nx * nx + ny * ny);
        if (len > 0) { nx /= len; ny /= len; }
        return { x: nx, y: ny };
    }

    _renderWalls() {
        this.wallCanvas = document.createElement('canvas');
        this.wallCanvas.width = this.width;
        this.wallCanvas.height = this.height;
        const wctx = this.wallCanvas.getContext('2d');

        // Background
        wctx.fillStyle = '#0a0a0a';
        wctx.fillRect(0, 0, this.width, this.height);

        const gw = this.gridW;
        const gh = this.gridH;

        // Draw walls with slight variation
        for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
                if (this.grid[y * gw + x] === TILE_WALL) {
                    // Edge detection for 3D-ish look
                    const hasTop = y > 0 && this.grid[(y - 1) * gw + x] === TILE_EMPTY;
                    const hasBottom = y < gh - 1 && this.grid[(y + 1) * gw + x] === TILE_EMPTY;
                    const hasLeft = x > 0 && this.grid[y * gw + (x - 1)] === TILE_EMPTY;
                    const hasRight = x < gw - 1 && this.grid[y * gw + (x + 1)] === TILE_EMPTY;
                    const isEdge = hasTop || hasBottom || hasLeft || hasRight;

                    const px = x * TILE_SIZE;
                    const py = y * TILE_SIZE;

                    if (isEdge) {
                        const v = 35 + ((x * 7 + y * 13) % 15);
                        wctx.fillStyle = `rgb(${v},${v + 5},${v})`;
                        wctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                        // Edge highlights
                        wctx.strokeStyle = `rgba(100,120,100,0.3)`;
                        wctx.lineWidth = 1;
                        if (hasTop) { wctx.beginPath(); wctx.moveTo(px, py + 0.5); wctx.lineTo(px + TILE_SIZE, py + 0.5); wctx.stroke(); }
                        if (hasLeft) { wctx.beginPath(); wctx.moveTo(px + 0.5, py); wctx.lineTo(px + 0.5, py + TILE_SIZE); wctx.stroke(); }
                    } else {
                        const v = 20 + ((x * 3 + y * 7) % 10);
                        wctx.fillStyle = `rgb(${v},${v},${v + 2})`;
                        wctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    }
                } else {
                    // Floor tiles with subtle grid
                    const px = x * TILE_SIZE;
                    const py = y * TILE_SIZE;
                    const v = 8 + ((x + y) % 2) * 3;
                    wctx.fillStyle = `rgb(${v},${v + 2},${v})`;
                    wctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    draw(ctx, camX, camY, viewW, viewH) {
        // Only draw the visible portion of the wall canvas
        const sx = Math.max(0, Math.floor(camX));
        const sy = Math.max(0, Math.floor(camY));
        const sw = Math.min(this.width - sx, viewW + 2);
        const sh = Math.min(this.height - sy, viewH + 2);
        if (sw > 0 && sh > 0) {
            ctx.drawImage(this.wallCanvas, sx, sy, sw, sh, sx - camX, sy - camY, sw, sh);
        }

        // Draw fire zones
        for (let i = this.fireZones.length - 1; i >= 0; i--) {
            const fz = this.fireZones[i];
            fz.timer -= 1 / 60;
            if (fz.timer <= 0) {
                this.fireZones.splice(i, 1);
                continue;
            }
            const alpha = Math.min(1, fz.timer / 0.5);
            const fx = fz.x - camX;
            const fy = fz.y - camY;
            ctx.globalAlpha = alpha * 0.4;
            ctx.fillStyle = '#f40';
            ctx.beginPath();
            ctx.arc(fx, fy, fz.radius, 0, TAU);
            ctx.fill();
            ctx.globalAlpha = alpha * 0.6;
            ctx.fillStyle = '#fa0';
            ctx.beginPath();
            ctx.arc(fx, fy, fz.radius * 0.6, 0, TAU);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Draw acid pools
        for (let i = this.acidPools.length - 1; i >= 0; i--) {
            const ap = this.acidPools[i];
            ap.timer -= 1 / 60;
            if (ap.timer <= 0) {
                this.acidPools.splice(i, 1);
                continue;
            }
            const alpha = Math.min(1, ap.timer / 0.5);
            const ax = ap.x - camX;
            const ay = ap.y - camY;
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = '#0f0';
            ctx.beginPath();
            ctx.arc(ax, ay, ap.radius, 0, TAU);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Draw weapon pickups
        for (const wp of this.weaponSpawns) {
            if (wp.alive) {
                wp.draw(ctx, camX, camY);
            }
        }
    }
}
