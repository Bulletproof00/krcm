// ============================================================
// TOU - Math & Utility Functions
// ============================================================

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); }
function distSq(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return dx * dx + dy * dy; }
function angleBetween(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); }
function angleDiff(a, b) { let d = ((b - a) % TAU + TAU + Math.PI) % TAU - Math.PI; return d; }
function randFloat(min, max) { return min + Math.random() * (max - min); }
function randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
function randSign() { return Math.random() < 0.5 ? -1 : 1; }
function randColor() { return `hsl(${randInt(0,360)},100%,50%)`; }
function hslToStr(h, s, l) { return `hsl(${h},${s}%,${l}%)`; }

// Seeded random for level generation
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 16807 + 0) % 2147483647;
        return this.seed / 2147483647;
    }
    nextInt(min, max) {
        return Math.floor(min + this.next() * (max - min + 1));
    }
    nextFloat(min, max) {
        return min + this.next() * (max - min);
    }
}

// Simple spatial hash grid for collision detection
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    clear() {
        this.cells.clear();
    }

    _key(cx, cy) {
        return (cx * 73856093) ^ (cy * 19349663);
    }

    insert(obj) {
        const cs = this.cellSize;
        const cx = Math.floor(obj.x / cs);
        const cy = Math.floor(obj.y / cs);
        const key = this._key(cx, cy);
        let cell = this.cells.get(key);
        if (!cell) { cell = []; this.cells.set(key, cell); }
        cell.push(obj);
    }

    query(x, y, radius) {
        const cs = this.cellSize;
        const minCx = Math.floor((x - radius) / cs);
        const maxCx = Math.floor((x + radius) / cs);
        const minCy = Math.floor((y - radius) / cs);
        const maxCy = Math.floor((y + radius) / cs);
        const result = [];
        for (let cx = minCx; cx <= maxCx; cx++) {
            for (let cy = minCy; cy <= maxCy; cy++) {
                const cell = this.cells.get(this._key(cx, cy));
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        result.push(cell[i]);
                    }
                }
            }
        }
        return result;
    }
}

// Object pool for projectiles/particles
class Pool {
    constructor(factory, initialSize) {
        this.factory = factory;
        this.pool = [];
        this.active = [];
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }

    get() {
        let obj = this.pool.pop();
        if (!obj) obj = this.factory();
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const idx = this.active.indexOf(obj);
        if (idx !== -1) {
            this.active.splice(idx, 1);
            this.pool.push(obj);
        }
    }

    releaseAll() {
        while (this.active.length) {
            this.pool.push(this.active.pop());
        }
    }
}

// Color utilities
const TEAM_COLORS = [
    { h: 120, s: 100, l: 50, hex: '#00ff00', name: 'Grün' },
    { h: 0, s: 100, l: 50, hex: '#ff0000', name: 'Rot' },
    { h: 200, s: 100, l: 55, hex: '#00aaff', name: 'Blau' },
    { h: 60, s: 100, l: 50, hex: '#ffff00', name: 'Gelb' },
    { h: 280, s: 100, l: 60, hex: '#cc44ff', name: 'Lila' },
    { h: 30, s: 100, l: 50, hex: '#ff8800', name: 'Orange' },
    { h: 170, s: 100, l: 50, hex: '#00ffaa', name: 'Cyan' },
    { h: 330, s: 100, l: 60, hex: '#ff44aa', name: 'Pink' },
];

function getTeamColor(teamId) {
    return TEAM_COLORS[teamId % TEAM_COLORS.length];
}
