// ============================================================
// TOU - Weapon System (47 Weapons)
// ============================================================

const WEAPON_CATEGORIES = {
    LASER: 'Laser/Energie',
    BALLISTIC: 'Ballistisch',
    ROCKET: 'Raketen',
    EXPLOSIVE: 'Explosiv/Fläche',
    SPECIAL: 'Spezial/Fun'
};

// All 47 weapons defined
const WEAPONS = [
    // === LASER / ENERGY (1-10) ===
    { id: 0, name: 'Pulse Laser', cat: WEAPON_CATEGORIES.LASER, color: '#0f0', damage: 8, speed: 1200, rate: 80, spread: 0.02, lifetime: 0.4, projSize: 3, projLen: 12, sound: 'laser1', desc: 'Standard-Pulslaser' },
    { id: 1, name: 'Twin Laser', cat: WEAPON_CATEGORIES.LASER, color: '#0f0', damage: 6, speed: 1200, rate: 70, spread: 0.01, lifetime: 0.4, projSize: 2, projLen: 10, count: 2, offsetY: 6, sound: 'laser1', desc: 'Doppellaser' },
    { id: 2, name: 'Heavy Laser', cat: WEAPON_CATEGORIES.LASER, color: '#f80', damage: 22, speed: 1000, rate: 250, spread: 0.01, lifetime: 0.5, projSize: 5, projLen: 20, sound: 'laser2', desc: 'Schwerer Energiepuls' },
    { id: 3, name: 'Rapid Laser', cat: WEAPON_CATEGORIES.LASER, color: '#0ff', damage: 4, speed: 1400, rate: 40, spread: 0.06, lifetime: 0.35, projSize: 2, projLen: 8, sound: 'laser1', desc: 'Schnellfeuer-Laser' },
    { id: 4, name: 'Beam Laser', cat: WEAPON_CATEGORIES.LASER, color: '#f0f', damage: 30, speed: 0, rate: 0, spread: 0, lifetime: 0, projSize: 3, projLen: 0, beam: true, beamRange: 400, beamDPS: 120, sound: 'beam', desc: 'Kontinuierlicher Strahl' },
    { id: 5, name: 'Plasma Gun', cat: WEAPON_CATEGORIES.LASER, color: '#4f4', damage: 15, speed: 800, rate: 150, spread: 0.03, lifetime: 0.6, projSize: 6, projLen: 6, glow: true, sound: 'plasma', desc: 'Plasmageschoss' },
    { id: 6, name: 'Ion Cannon', cat: WEAPON_CATEGORIES.LASER, color: '#88f', damage: 12, speed: 900, rate: 200, spread: 0.02, lifetime: 0.5, projSize: 5, projLen: 14, slow: 0.5, slowDur: 1.5, sound: 'ion', desc: 'Verlangsamt Gegner' },
    { id: 7, name: 'Phaser', cat: WEAPON_CATEGORIES.LASER, color: '#ff0', damage: 10, speed: 1500, rate: 120, spread: 0, lifetime: 0.3, projSize: 2, projLen: 25, piercing: true, sound: 'laser2', desc: 'Durchdringend' },
    { id: 8, name: 'Disruptor', cat: WEAPON_CATEGORIES.LASER, color: '#f44', damage: 18, speed: 700, rate: 300, spread: 0.04, lifetime: 0.7, projSize: 8, projLen: 8, emp: true, empDur: 2.0, sound: 'disruptor', desc: 'Deaktiviert Waffen kurz' },
    { id: 9, name: 'Tri-Laser', cat: WEAPON_CATEGORIES.LASER, color: '#0f0', damage: 5, speed: 1100, rate: 130, spread: 0.15, lifetime: 0.4, projSize: 2, projLen: 10, count: 3, fan: true, sound: 'laser1', desc: 'Dreifach-Fächer' },

    // === BALLISTIC (10-19) ===
    { id: 10, name: 'Vulcan', cat: WEAPON_CATEGORIES.BALLISTIC, color: '#ff0', damage: 6, speed: 1000, rate: 50, spread: 0.08, lifetime: 0.5, projSize: 2, projLen: 6, sound: 'vulcan', desc: 'Gatling-Geschütz' },
    { id: 11, name: 'Shotgun', cat: WEAPON_CATEGORIES.BALLISTIC, color: '#fa0', damage: 5, speed: 900, rate: 400, spread: 0.25, lifetime: 0.3, projSize: 2, projLen: 4, count: 8, fan: true, sound: 'shotgun', desc: 'Schrotflinte' },
    { id: 12, name: 'Railgun', cat: WEAPON_CATEGORIES.BALLISTIC, color: '#0af', damage: 50, speed: 2000, rate: 800, spread: 0, lifetime: 0.4, projSize: 3, projLen: 30, piercing: true, screenShake: 4, sound: 'railgun', desc: 'Hochgeschwindigkeits-Projektil' },
    { id: 13, name: 'Cannon', cat: WEAPON_CATEGORIES.BALLISTIC, color: '#ccc', damage: 25, speed: 700, rate: 350, spread: 0.03, lifetime: 0.7, projSize: 5, projLen: 5, explosive: true, explRadius: 40, sound: 'cannon', desc: 'Explosivgeschoss' },
    { id: 14, name: 'Flak', cat: WEAPON_CATEGORIES.BALLISTIC, color: '#ff8', damage: 3, speed: 800, rate: 100, spread: 0.12, lifetime: 0.4, projSize: 2, projLen: 3, count: 5, fan: true, fragOnDeath: true, fragCount: 3, sound: 'flak', desc: 'Splittergeschoss' },
    { id: 15, name: 'Autocannon', cat: WEAPON_CATEGORIES.BALLISTIC, color: '#ee0', damage: 10, speed: 900, rate: 100, spread: 0.04, lifetime: 0.5, projSize: 3, projLen: 8, sound: 'autocannon', desc: 'Automatikkanone' },
    { id: 16, name: 'Sniper', cat: WEAPON_CATEGORIES.BALLISTIC, color: '#fff', damage: 60, speed: 2500, rate: 1200, spread: 0, lifetime: 0.5, projSize: 2, projLen: 35, piercing: true, screenShake: 6, sound: 'sniper', desc: 'Extreme Reichweite & Schaden' },
    { id: 17, name: 'Ricochet Gun', cat: WEAPON_CATEGORIES.BALLISTIC, color: '#f0f', damage: 12, speed: 800, rate: 180, spread: 0.03, lifetime: 1.5, projSize: 3, projLen: 6, bounces: 5, sound: 'ricochet', desc: 'Projektile prallen ab' },
    { id: 18, name: 'Needle Gun', cat: WEAPON_CATEGORIES.BALLISTIC, color: '#aaf', damage: 3, speed: 1300, rate: 30, spread: 0.1, lifetime: 0.4, projSize: 1, projLen: 10, count: 1, sound: 'needle', desc: 'Nadelgewehr - extrem schnell' },
    { id: 19, name: 'Slug Thrower', cat: WEAPON_CATEGORIES.BALLISTIC, color: '#a80', damage: 35, speed: 600, rate: 500, spread: 0.05, lifetime: 0.8, projSize: 6, projLen: 6, knockback: 300, sound: 'slug', desc: 'Massiver Rückstoß' },

    // === ROCKETS & MISSILES (20-29) ===
    { id: 20, name: 'Dumbfire Rocket', cat: WEAPON_CATEGORIES.ROCKET, color: '#f80', damage: 30, speed: 500, rate: 300, spread: 0.02, lifetime: 1.5, projSize: 4, projLen: 10, explosive: true, explRadius: 50, accel: 800, trail: true, sound: 'rocket', desc: 'Ungelenkte Rakete' },
    { id: 21, name: 'Homing Missile', cat: WEAPON_CATEGORIES.ROCKET, color: '#f00', damage: 35, speed: 300, rate: 500, spread: 0, lifetime: 3.0, projSize: 4, projLen: 12, explosive: true, explRadius: 45, homing: true, homingStr: 3.5, trail: true, sound: 'missile', desc: 'Zielsuchende Rakete' },
    { id: 22, name: 'Swarm Missiles', cat: WEAPON_CATEGORIES.ROCKET, color: '#f40', damage: 10, speed: 350, rate: 600, spread: 0.3, lifetime: 2.5, projSize: 3, projLen: 7, explosive: true, explRadius: 25, homing: true, homingStr: 2.5, count: 6, fan: true, trail: true, sound: 'swarm', desc: 'Schwarm kleiner Raketen' },
    { id: 23, name: 'Torpedo', cat: WEAPON_CATEGORIES.ROCKET, color: '#0af', damage: 70, speed: 250, rate: 1000, spread: 0, lifetime: 4.0, projSize: 5, projLen: 16, explosive: true, explRadius: 80, homing: true, homingStr: 1.5, trail: true, screenShake: 8, sound: 'torpedo', desc: 'Langsam, aber verheerend' },
    { id: 24, name: 'Multi-Rocket', cat: WEAPON_CATEGORIES.ROCKET, color: '#fa0', damage: 15, speed: 600, rate: 400, spread: 0.15, lifetime: 1.2, projSize: 3, projLen: 8, explosive: true, explRadius: 30, count: 3, fan: true, trail: true, sound: 'rocket', desc: 'Dreifach-Rakete' },
    { id: 25, name: 'Cruise Missile', cat: WEAPON_CATEGORIES.ROCKET, color: '#ff0', damage: 55, speed: 200, rate: 1500, spread: 0, lifetime: 5.0, projSize: 5, projLen: 18, explosive: true, explRadius: 100, homing: true, homingStr: 4.0, trail: true, screenShake: 10, sound: 'cruise', desc: 'Sehr starke Lenkrakete' },
    { id: 26, name: 'Rocket Barrage', cat: WEAPON_CATEGORIES.ROCKET, color: '#f60', damage: 8, speed: 550, rate: 50, spread: 0.2, lifetime: 1.0, projSize: 3, projLen: 7, explosive: true, explRadius: 20, trail: true, burstCount: 8, burstDelay: 50, sound: 'rocket', desc: 'Schnelle Raketensalve' },
    { id: 27, name: 'Napalm Rocket', cat: WEAPON_CATEGORIES.ROCKET, color: '#f40', damage: 20, speed: 450, rate: 600, spread: 0.03, lifetime: 1.5, projSize: 5, projLen: 10, explosive: true, explRadius: 60, trail: true, fire: true, fireDur: 3.0, fireDPS: 15, sound: 'napalm', desc: 'Hinterlässt Feuer' },
    { id: 28, name: 'EMP Rocket', cat: WEAPON_CATEGORIES.ROCKET, color: '#44f', damage: 15, speed: 400, rate: 700, spread: 0.02, lifetime: 2.0, projSize: 4, projLen: 10, explosive: true, explRadius: 70, emp: true, empDur: 3.0, trail: true, sound: 'emp', desc: 'EMP-Effekt im Radius' },
    { id: 29, name: 'Cluster Rocket', cat: WEAPON_CATEGORIES.ROCKET, color: '#f80', damage: 12, speed: 500, rate: 500, spread: 0, lifetime: 1.0, projSize: 5, projLen: 12, explosive: true, explRadius: 30, trail: true, cluster: true, clusterCount: 8, clusterSpread: TAU, sound: 'cluster', desc: 'Splittet in Submunition' },

    // === EXPLOSIVE & AREA (30-39) ===
    { id: 30, name: 'Proximity Mine', cat: WEAPON_CATEGORIES.EXPLOSIVE, color: '#f00', damage: 45, speed: 100, rate: 400, spread: 0, lifetime: 15.0, projSize: 6, projLen: 6, mine: true, triggerDist: 60, explosive: true, explRadius: 70, sound: 'mine', desc: 'Näherungsmine' },
    { id: 31, name: 'Cluster Bomb', cat: WEAPON_CATEGORIES.EXPLOSIVE, color: '#fa0', damage: 8, speed: 400, rate: 600, spread: 0.05, lifetime: 1.0, projSize: 6, projLen: 6, cluster: true, clusterCount: 12, clusterSpread: TAU, explosive: true, explRadius: 25, sound: 'bomb', desc: 'Streubombe' },
    { id: 32, name: 'Grenade', cat: WEAPON_CATEGORIES.EXPLOSIVE, color: '#8f0', damage: 30, speed: 350, rate: 350, spread: 0.05, lifetime: 1.2, projSize: 5, projLen: 5, explosive: true, explRadius: 55, bounces: 3, sound: 'grenade', desc: 'Springende Granate' },
    { id: 33, name: 'Mega Bomb', cat: WEAPON_CATEGORIES.EXPLOSIVE, color: '#f00', damage: 80, speed: 300, rate: 2000, spread: 0, lifetime: 2.0, projSize: 10, projLen: 10, explosive: true, explRadius: 150, screenShake: 15, sound: 'megabomb', desc: 'Massive Explosion' },
    { id: 34, name: 'Fire Wall', cat: WEAPON_CATEGORIES.EXPLOSIVE, color: '#f60', damage: 5, speed: 500, rate: 50, spread: 0.02, lifetime: 2.0, projSize: 4, projLen: 4, fire: true, fireDur: 4.0, fireDPS: 20, count: 1, sound: 'firewall', desc: 'Erzeugt Feuerwand' },
    { id: 35, name: 'Carpet Bomb', cat: WEAPON_CATEGORIES.EXPLOSIVE, color: '#f80', damage: 15, speed: 300, rate: 800, spread: 0.4, lifetime: 1.5, projSize: 4, projLen: 4, explosive: true, explRadius: 35, count: 10, fan: true, sound: 'carpet', desc: 'Flächenbombardement' },
    { id: 36, name: 'Gravity Bomb', cat: WEAPON_CATEGORIES.EXPLOSIVE, color: '#a0f', damage: 10, speed: 250, rate: 1200, spread: 0, lifetime: 3.0, projSize: 8, projLen: 8, gravity: true, gravRadius: 120, gravStr: 400, explosive: true, explRadius: 60, sound: 'gravity', desc: 'Zieht Gegner an' },
    { id: 37, name: 'Acid Pool', cat: WEAPON_CATEGORIES.EXPLOSIVE, color: '#0f0', damage: 5, speed: 350, rate: 500, spread: 0.1, lifetime: 1.0, projSize: 5, projLen: 5, pool: true, poolDur: 5.0, poolRadius: 40, poolDPS: 25, sound: 'acid', desc: 'Säure-Zone am Boden' },
    { id: 38, name: 'Nuke', cat: WEAPON_CATEGORIES.EXPLOSIVE, color: '#ff0', damage: 120, speed: 200, rate: 5000, spread: 0, lifetime: 3.0, projSize: 10, projLen: 10, explosive: true, explRadius: 250, screenShake: 25, nuke: true, sound: 'nuke', desc: 'Alles vernichtend' },
    { id: 39, name: 'Remote Mine', cat: WEAPON_CATEGORIES.EXPLOSIVE, color: '#f88', damage: 50, speed: 150, rate: 500, spread: 0, lifetime: 20.0, projSize: 6, projLen: 6, mine: true, remote: true, explosive: true, explRadius: 80, sound: 'mine', desc: 'Manuell auslösbar' },

    // === SPECIAL & FUN (40-46) ===
    { id: 40, name: 'Chain Lightning', cat: WEAPON_CATEGORIES.SPECIAL, color: '#4af', damage: 15, speed: 1500, rate: 300, spread: 0.03, lifetime: 0.3, projSize: 3, projLen: 15, chain: true, chainRange: 150, chainCount: 4, chainDecay: 0.7, sound: 'lightning', desc: 'Springt zwischen Gegnern' },
    { id: 41, name: 'Bouncer', cat: WEAPON_CATEGORIES.SPECIAL, color: '#f0f', damage: 8, speed: 600, rate: 120, spread: 0.05, lifetime: 4.0, projSize: 5, projLen: 5, bounces: 20, glow: true, sound: 'bouncer', desc: 'Prallt extrem oft ab' },
    { id: 42, name: 'Spiral Shot', cat: WEAPON_CATEGORIES.SPECIAL, color: '#0ff', damage: 7, speed: 400, rate: 100, spread: 0, lifetime: 2.0, projSize: 3, projLen: 8, spiral: true, spiralSpeed: 8, spiralRadius: 30, sound: 'spiral', desc: 'Spiralförmige Projektile' },
    { id: 43, name: 'Shockwave', cat: WEAPON_CATEGORIES.SPECIAL, color: '#fff', damage: 20, speed: 0, rate: 600, spread: 0, lifetime: 0, projSize: 0, projLen: 0, shockwave: true, shockRadius: 120, shockGrow: 800, sound: 'shockwave', desc: 'Expandierende Druckwelle' },
    { id: 44, name: 'Black Hole', cat: WEAPON_CATEGORIES.SPECIAL, color: '#808', damage: 5, speed: 300, rate: 2000, spread: 0, lifetime: 4.0, projSize: 12, projLen: 12, gravity: true, gravRadius: 200, gravStr: 600, sound: 'blackhole', desc: 'Extremes Gravitationsfeld' },
    { id: 45, name: 'Mirror Shield', cat: WEAPON_CATEGORIES.SPECIAL, color: '#aaf', damage: 0, speed: 0, rate: 1500, spread: 0, lifetime: 3.0, projSize: 0, projLen: 0, shield: true, shieldRadius: 50, reflective: true, sound: 'shield', desc: 'Reflektiert Projektile' },
    { id: 46, name: 'Teleport Gun', cat: WEAPON_CATEGORIES.SPECIAL, color: '#a0f', damage: 10, speed: 1000, rate: 800, spread: 0, lifetime: 0.5, projSize: 4, projLen: 15, teleport: true, sound: 'teleport', desc: 'Teleportiert zum Einschlagsort' },
];

// Weapon pickup class
class WeaponPickup {
    constructor(x, y, weaponId) {
        this.x = x;
        this.y = y;
        this.weaponId = weaponId;
        this.radius = 10;
        this.alive = true;
        this.respawnTime = 10000;
        this.timer = 0;
        this.bobPhase = Math.random() * TAU;
    }

    update(dt) {
        this.bobPhase += dt * 3;
    }

    draw(ctx, camX, camY) {
        const w = WEAPONS[this.weaponId];
        const sx = this.x - camX;
        const sy = this.y - camY + Math.sin(this.bobPhase) * 3;

        ctx.save();
        ctx.globalAlpha = 0.8 + Math.sin(this.bobPhase * 2) * 0.2;
        ctx.fillStyle = w.color;
        ctx.shadowColor = w.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius, 0, TAU);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(w.name.charAt(0), sx, sy);
        ctx.restore();
    }
}

// Get a random weapon with bias toward certain categories
function getRandomWeapon() {
    return WEAPONS[randInt(0, WEAPONS.length - 1)];
}

function getRandomWeaponId() {
    return randInt(0, WEAPONS.length - 1);
}
