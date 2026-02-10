#!/usr/bin/env python3
"""
Tunnels of the Underworld (TOU) - fast 2D arcade prototype.
Designed for local play with up to 4 humans and many AI bots.

Requirements: pygame
Run: python3 tou.py
"""

from __future__ import annotations

import math
import random
import sys
from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence, Tuple

import pygame
from pygame import Vector2

WIDTH, HEIGHT = 1280, 720
FPS = 120
MAX_UNITS = 64

WORLD_W, WORLD_H = 4200, 2600
TILE = 40
GRID_W, GRID_H = WORLD_W // TILE, WORLD_H // TILE

BG = (8, 8, 13)
WALL = (28, 32, 42)
FLOOR = (14, 16, 22)

TEAM_COLORS = [
    (85, 210, 255),
    (255, 102, 102),
    (145, 255, 130),
    (255, 200, 90),
]

HUMAN_SCHEMES = [
    {"up": pygame.K_w, "down": pygame.K_s, "left": pygame.K_a, "right": pygame.K_d, "fire": pygame.K_SPACE, "switch": pygame.K_q},
    {"up": pygame.K_UP, "down": pygame.K_DOWN, "left": pygame.K_LEFT, "right": pygame.K_RIGHT, "fire": pygame.K_RCTRL, "switch": pygame.K_RSHIFT},
    {"up": pygame.K_t, "down": pygame.K_g, "left": pygame.K_f, "right": pygame.K_h, "fire": pygame.K_y, "switch": pygame.K_r},
    {"up": pygame.K_i, "down": pygame.K_k, "left": pygame.K_j, "right": pygame.K_l, "fire": pygame.K_o, "switch": pygame.K_u},
]


@dataclass
class WeaponSpec:
    name: str
    category: str
    cooldown: float
    speed: float
    damage: float
    radius: float
    homing: float = 0.0
    bounce: int = 0
    pierce: int = 0
    spread: int = 1
    aoe: float = 0.0
    life: float = 2.5


WEAPON_POOL: List[WeaponSpec] = [
    WeaponSpec("Pin Laser", "Energy", 0.06, 1200, 4, 3, pierce=1),
    WeaponSpec("Beam Needle", "Energy", 0.04, 1400, 3, 2, pierce=2),
    WeaponSpec("Plasma Lash", "Energy", 0.1, 900, 6, 4),
    WeaponSpec("Ion Drill", "Energy", 0.2, 780, 9, 6),
    WeaponSpec("Pulse Arc", "Energy", 0.12, 980, 7, 5, spread=2),
    WeaponSpec("Photon Stream", "Energy", 0.02, 1500, 2.2, 2),
    WeaponSpec("Lance Ray", "Energy", 0.3, 1600, 20, 5, pierce=6),
    WeaponSpec("Diffraction Fan", "Energy", 0.13, 980, 5, 4, spread=5),
    WeaponSpec("Rail Spike", "Ballistic", 0.24, 1600, 19, 4, pierce=3),
    WeaponSpec("Slug Cannon", "Ballistic", 0.15, 820, 11, 5),
    WeaponSpec("Scattershot", "Ballistic", 0.2, 700, 4, 4, spread=8),
    WeaponSpec("Heavy Mortar", "Ballistic", 0.35, 520, 26, 8, aoe=60),
    WeaponSpec("Needler", "Ballistic", 0.07, 1000, 4.8, 2, spread=2),
    WeaponSpec("Shard Driver", "Ballistic", 0.1, 860, 7.2, 3, spread=4),
    WeaponSpec("Sawtooth Burst", "Ballistic", 0.22, 760, 8, 5, bounce=1, spread=5),
    WeaponSpec("Obelisk Shot", "Ballistic", 0.4, 640, 30, 10),
    WeaponSpec("Dumbfire Rocket", "Rocket", 0.18, 760, 12, 5, aoe=46),
    WeaponSpec("Homing Dart", "Rocket", 0.2, 720, 9.5, 4, homing=1.4),
    WeaponSpec("Hunter Missile", "Rocket", 0.28, 690, 16, 6, homing=2.1, aoe=50),
    WeaponSpec("Swarm Pod", "Rocket", 0.32, 650, 5.5, 3, homing=1.1, spread=6, aoe=24),
    WeaponSpec("Serpent Rocket", "Rocket", 0.24, 740, 13, 5, homing=1.6),
    WeaponSpec("Cyclone Rack", "Rocket", 0.38, 700, 10, 5, spread=7, aoe=28),
    WeaponSpec("Hydra Volley", "Rocket", 0.42, 760, 8.5, 4, spread=10, homing=0.8),
    WeaponSpec("Cataclysm Torpedo", "Rocket", 0.7, 560, 48, 9, aoe=120),
    WeaponSpec("Mine Dropper", "Explosive", 0.2, 120, 14, 7, aoe=70, life=5.0),
    WeaponSpec("Proximity Mine", "Explosive", 0.33, 100, 20, 8, aoe=84, life=7.0),
    WeaponSpec("Cluster Bomb", "Explosive", 0.5, 480, 18, 8, aoe=90),
    WeaponSpec("Depth Charge", "Explosive", 0.45, 320, 24, 10, aoe=110),
    WeaponSpec("Tunnel Blocker", "Explosive", 0.7, 200, 10, 11, aoe=130, life=6.0),
    WeaponSpec("Shock Bomb", "Explosive", 0.35, 420, 13, 8, aoe=75),
    WeaponSpec("Napalm Orb", "Explosive", 0.38, 500, 9, 8, aoe=95),
    WeaponSpec("EMP Barrel", "Explosive", 0.6, 260, 4, 12, aoe=140),
    WeaponSpec("Chain Lightning", "Special", 0.26, 1200, 7, 4, pierce=5),
    WeaponSpec("Bouncer", "Special", 0.14, 860, 6, 5, bounce=6),
    WeaponSpec("Spiral Shot", "Special", 0.09, 830, 5, 4, spread=3),
    WeaponSpec("Shockwave", "Special", 0.8, 0, 18, 0, aoe=140, life=0.15),
    WeaponSpec("Vortex Seed", "Special", 0.65, 300, 4, 10, aoe=160, life=4.5),
    WeaponSpec("Ricochet Prism", "Special", 0.2, 920, 8, 4, bounce=4, spread=2),
    WeaponSpec("Arc Nova", "Special", 0.5, 0, 14, 0, aoe=105, life=0.15),
    WeaponSpec("Gravity Bolt", "Special", 0.3, 680, 9, 7, aoe=60),
    WeaponSpec("Glitch Beam", "Special", 0.11, 1500, 5, 3, pierce=9),
    WeaponSpec("Chaos Dice", "Special", 0.25, 800, 3, 5, spread=1),
    WeaponSpec("Frost Dart", "Special", 0.12, 820, 6, 4),
    WeaponSpec("Thunder Coil", "Special", 0.2, 780, 8, 5, homing=0.6),
    WeaponSpec("Magma Ring", "Special", 0.52, 0, 22, 0, aoe=125, life=0.12),
    WeaponSpec("Echo Lance", "Special", 0.3, 980, 10, 4, pierce=2, spread=3),
    WeaponSpec("Mirror Burst", "Special", 0.27, 880, 7, 4, spread=6),
]
assert len(WEAPON_POOL) == 47


class Level:
    def __init__(self) -> None:
        self.grid = [[1 for _ in range(GRID_W)] for _ in range(GRID_H)]
        self.spawn_points: List[Vector2] = []
        self._generate()

    def _generate(self) -> None:
        for y in range(1, GRID_H - 1):
            for x in range(1, GRID_W - 1):
                self.grid[y][x] = 0 if random.random() < 0.47 else 1

        for _ in range(5):
            new_grid = [[1 for _ in range(GRID_W)] for _ in range(GRID_H)]
            for y in range(1, GRID_H - 1):
                for x in range(1, GRID_W - 1):
                    wall_neighbors = 0
                    for ny in range(y - 1, y + 2):
                        for nx in range(x - 1, x + 2):
                            if nx == x and ny == y:
                                continue
                            wall_neighbors += self.grid[ny][nx]
                    new_grid[y][x] = 1 if wall_neighbors >= 5 else 0
            self.grid = new_grid

        for _ in range(14):
            rw, rh = random.randint(4, 8), random.randint(4, 7)
            rx, ry = random.randint(2, GRID_W - rw - 2), random.randint(2, GRID_H - rh - 2)
            for y in range(ry, ry + rh):
                for x in range(rx, rx + rw):
                    self.grid[y][x] = 0

        for _ in range(10):
            x = random.randint(4, GRID_W - 5)
            for y in range(4, GRID_H - 4):
                if random.random() < 0.7:
                    self.grid[y][x] = 0

        self._collect_spawns()

    def _collect_spawns(self) -> None:
        candidates: List[Vector2] = []
        for y in range(2, GRID_H - 2):
            for x in range(2, GRID_W - 2):
                if self.grid[y][x] != 0:
                    continue
                empties = 0
                for ny in range(y - 1, y + 2):
                    for nx in range(x - 1, x + 2):
                        empties += 1 if self.grid[ny][nx] == 0 else 0
                if empties >= 7:
                    candidates.append(Vector2(x * TILE + TILE / 2, y * TILE + TILE / 2))
        random.shuffle(candidates)
        self.spawn_points = candidates[: max(100, len(candidates) // 3)]

    def is_wall(self, p: Vector2) -> bool:
        tx, ty = int(p.x // TILE), int(p.y // TILE)
        if tx < 0 or ty < 0 or tx >= GRID_W or ty >= GRID_H:
            return True
        return self.grid[ty][tx] == 1

    def random_spawn(self) -> Vector2:
        if not self.spawn_points:
            return Vector2(WORLD_W / 2, WORLD_H / 2)
        return random.choice(self.spawn_points).copy()

    def draw(self, surf: pygame.Surface, cam: Vector2) -> None:
        surf.fill(BG)
        start_x = max(0, int(cam.x // TILE) - 1)
        end_x = min(GRID_W, int((cam.x + WIDTH) // TILE) + 2)
        start_y = max(0, int(cam.y // TILE) - 1)
        end_y = min(GRID_H, int((cam.y + HEIGHT) // TILE) + 2)
        for y in range(start_y, end_y):
            for x in range(start_x, end_x):
                rect = pygame.Rect(x * TILE - cam.x, y * TILE - cam.y, TILE, TILE)
                col = WALL if self.grid[y][x] else FLOOR
                pygame.draw.rect(surf, col, rect)


@dataclass
class Projectile:
    pos: Vector2
    vel: Vector2
    team: int
    owner: int
    spec: WeaponSpec
    ttl: float
    radius: float
    damage: float
    bounce_left: int
    pierce_left: int
    angle_noise: float = 0.0


@dataclass
class Ship:
    idx: int
    is_human: bool
    team: int
    pos: Vector2
    vel: Vector2
    angle: float
    hp: float
    respawn: float
    score: int
    weapon_ids: List[int]
    weapon_slot: int
    fire_timer: float
    switch_timer: float
    ai_target: Optional[int] = None

    @property
    def alive(self) -> bool:
        return self.respawn <= 0 and self.hp > 0


class Game:
    def __init__(self) -> None:
        pygame.init()
        pygame.display.set_caption("Tunnels of the Underworld - Prototype")
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        self.clock = pygame.time.Clock()
        self.level = Level()

        self.mode = "tdm"
        self.ai_difficulty = 0.82
        self.humans = 1
        self.bots = 23
        self.total_units = min(MAX_UNITS, self.humans + self.bots)

        self.ships: List[Ship] = []
        self.projectiles: List[Projectile] = []
        self.effects: List[Tuple[Vector2, float, Tuple[int, int, int], float]] = []
        self.font = pygame.font.SysFont("Menlo", 18)
        self.big_font = pygame.font.SysFont("Menlo", 32, bold=True)

        self.match_time = 0.0
        self.round_length = 360.0
        self.running = True
        self._spawn_match()

    def _spawn_match(self) -> None:
        self.ships.clear()
        self.projectiles.clear()
        self.effects.clear()
        for i in range(self.total_units):
            is_human = i < self.humans
            team = i % 2 if self.mode == "tdm" else i
            self.ships.append(
                Ship(
                    idx=i,
                    is_human=is_human,
                    team=team,
                    pos=self.level.random_spawn(),
                    vel=Vector2(),
                    angle=random.random() * math.tau,
                    hp=100,
                    respawn=0.0,
                    score=0,
                    weapon_ids=random.sample(range(len(WEAPON_POOL)), 4),
                    weapon_slot=0,
                    fire_timer=0.0,
                    switch_timer=0.0,
                )
            )

    def run(self) -> None:
        while self.running:
            dt = self.clock.tick(FPS) / 1000.0
            dt = min(dt, 0.04)
            self._events()
            self._update(dt)
            self._draw()
        pygame.quit()

    def _events(self) -> None:
        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                self.running = False
            elif e.type == pygame.KEYDOWN:
                if e.key == pygame.K_ESCAPE:
                    self.running = False
                elif e.key == pygame.K_F1:
                    self.mode = "dm" if self.mode == "tdm" else "tdm"
                    self._spawn_match()
                elif e.key == pygame.K_F2:
                    self.humans = min(4, self.humans + 1)
                    self.total_units = min(MAX_UNITS, self.humans + self.bots)
                    self._spawn_match()
                elif e.key == pygame.K_F3:
                    self.humans = max(1, self.humans - 1)
                    self.total_units = min(MAX_UNITS, self.humans + self.bots)
                    self._spawn_match()
                elif e.key == pygame.K_F4:
                    self.bots = min(60, self.bots + 4)
                    self.total_units = min(MAX_UNITS, self.humans + self.bots)
                    self._spawn_match()
                elif e.key == pygame.K_F5:
                    self.bots = max(0, self.bots - 4)
                    self.total_units = min(MAX_UNITS, self.humans + self.bots)
                    self._spawn_match()
                elif e.key == pygame.K_F6:
                    self.ai_difficulty = min(1.5, self.ai_difficulty + 0.1)
                elif e.key == pygame.K_F7:
                    self.ai_difficulty = max(0.1, self.ai_difficulty - 0.1)
                elif e.key == pygame.K_F8:
                    self.level = Level()
                    self._spawn_match()

    def _move_ship(self, ship: Ship, thrust_vec: Vector2, dt: float) -> None:
        accel = 930
        damping = 0.986
        max_speed = 520
        ship.vel += thrust_vec * accel * dt
        ship.vel *= damping
        if ship.vel.length_squared() > max_speed * max_speed:
            ship.vel.scale_to_length(max_speed)

        old = ship.pos.copy()
        ship.pos += ship.vel * dt
        r = 10

        checks = [
            Vector2(ship.pos.x - r, ship.pos.y - r),
            Vector2(ship.pos.x + r, ship.pos.y - r),
            Vector2(ship.pos.x - r, ship.pos.y + r),
            Vector2(ship.pos.x + r, ship.pos.y + r),
        ]
        if any(self.level.is_wall(c) for c in checks):
            ship.pos = old
            ship.vel *= -0.28

    def _update(self, dt: float) -> None:
        self.match_time += dt
        keys = pygame.key.get_pressed()

        for ship in self.ships:
            ship.fire_timer = max(0.0, ship.fire_timer - dt)
            ship.switch_timer = max(0.0, ship.switch_timer - dt)

            if ship.respawn > 0:
                ship.respawn -= dt
                if ship.respawn <= 0:
                    ship.hp = 100
                    ship.pos = self.level.random_spawn()
                    ship.vel = Vector2()
                continue

            if ship.is_human:
                controls = HUMAN_SCHEMES[ship.idx]
                thrust = Vector2(0, 0)
                thrust.x = (1 if keys[controls["right"]] else 0) - (1 if keys[controls["left"]] else 0)
                thrust.y = (1 if keys[controls["down"]] else 0) - (1 if keys[controls["up"]] else 0)
                if thrust.length_squared() > 1:
                    thrust = thrust.normalize()
                if thrust.length_squared() > 0:
                    ship.angle = math.atan2(thrust.y, thrust.x)
                self._move_ship(ship, thrust, dt)
                if keys[controls["switch"]] and ship.switch_timer <= 0:
                    ship.weapon_slot = (ship.weapon_slot + 1) % len(ship.weapon_ids)
                    ship.switch_timer = 0.2
                if keys[controls["fire"]]:
                    self._ship_fire(ship)
            else:
                self._update_ai(ship, dt)

        self._update_projectiles(dt)
        self.effects = [(p, t - dt, c, r) for (p, t, c, r) in self.effects if t - dt > 0]

        if self.match_time >= self.round_length:
            self.match_time = 0
            self.level = Level()
            self._spawn_match()

    def _pick_target(self, ship: Ship) -> Optional[Ship]:
        alive = [s for s in self.ships if s.idx != ship.idx and s.respawn <= 0 and (self.mode == "dm" or s.team != ship.team)]
        if not alive:
            return None
        alive.sort(key=lambda s: (s.pos - ship.pos).length_squared())
        return alive[0]

    def _update_ai(self, ship: Ship, dt: float) -> None:
        target = self._pick_target(ship)
        thrust = Vector2()
        if target:
            to = target.pos - ship.pos
            dist = max(1.0, to.length())
            dirn = to / dist
            lead = target.vel * min(0.45, dist / 1300)
            aim_vec = to + lead
            jitter = Vector2(random.uniform(-0.16, 0.16), random.uniform(-0.16, 0.16)) * (1.2 - self.ai_difficulty)
            thrust = (dirn + jitter)
            if thrust.length_squared() > 1:
                thrust = thrust.normalize()
            avoid = self._avoid_vector(ship)
            thrust = (thrust * self.ai_difficulty + avoid * (1.05 - self.ai_difficulty * 0.5))
            if thrust.length_squared() > 1:
                thrust = thrust.normalize()
            ship.angle = math.atan2(aim_vec.y, aim_vec.x)
            if random.random() < 0.01 and ship.switch_timer <= 0:
                ship.weapon_slot = (ship.weapon_slot + 1) % len(ship.weapon_ids)
                ship.switch_timer = 0.22
            if dist < 900 + random.uniform(-120, 120):
                self._ship_fire(ship)
        self._move_ship(ship, thrust, dt)

    def _avoid_vector(self, ship: Ship) -> Vector2:
        sensors = [
            Vector2(math.cos(ship.angle), math.sin(ship.angle)),
            Vector2(math.cos(ship.angle + 0.7), math.sin(ship.angle + 0.7)),
            Vector2(math.cos(ship.angle - 0.7), math.sin(ship.angle - 0.7)),
        ]
        avoid = Vector2()
        for s in sensors:
            probe = ship.pos + s * 70
            if self.level.is_wall(probe):
                avoid -= s
        return avoid

    def _ship_fire(self, ship: Ship) -> None:
        spec = WEAPON_POOL[ship.weapon_ids[ship.weapon_slot]]
        if ship.fire_timer > 0:
            return
        ship.fire_timer = spec.cooldown

        if spec.name in {"Shockwave", "Arc Nova", "Magma Ring"}:
            self._explode(ship.pos, spec.aoe, spec.damage, ship.team, ship.idx)
            self.effects.append((ship.pos.copy(), 0.18, TEAM_COLORS[ship.team % len(TEAM_COLORS)], spec.aoe))
            return

        base_dir = Vector2(math.cos(ship.angle), math.sin(ship.angle))
        count = max(1, spec.spread)
        for i in range(count):
            spread_angle = 0.0
            if count > 1:
                spread_angle = (i - (count - 1) / 2) * (0.10 + random.uniform(-0.03, 0.03))
            d = base_dir.rotate_rad(spread_angle)
            if spec.name == "Spiral Shot":
                d = base_dir.rotate_rad(self.match_time * 8 + i * 0.7)
            speed = spec.speed * random.uniform(0.93, 1.07)
            vel = d * speed
            p = Projectile(
                pos=ship.pos + d * 14,
                vel=vel,
                team=ship.team,
                owner=ship.idx,
                spec=spec,
                ttl=spec.life,
                radius=spec.radius,
                damage=spec.damage,
                bounce_left=spec.bounce,
                pierce_left=spec.pierce,
                angle_noise=random.uniform(-0.6, 0.6) if spec.name == "Chaos Dice" else 0.0,
            )
            self.projectiles.append(p)

    def _update_projectiles(self, dt: float) -> None:
        survivors: List[Projectile] = []
        for p in self.projectiles:
            p.ttl -= dt
            if p.ttl <= 0:
                if p.spec.aoe > 0:
                    self._explode(p.pos, p.spec.aoe, p.damage, p.team, p.owner)
                continue

            if p.spec.homing > 0:
                target = self._nearest_enemy_pos(p.pos, p.team)
                if target is not None:
                    desired = (target - p.pos)
                    if desired.length_squared() > 1:
                        desired = desired.normalize()
                        current = p.vel.normalize() if p.vel.length_squared() > 0 else desired
                        blend = min(1.0, p.spec.homing * dt)
                        steer = current.lerp(desired, blend)
                        p.vel = steer.normalize() * p.vel.length()

            if p.angle_noise != 0 and p.vel.length_squared() > 0:
                p.vel = p.vel.rotate_rad(p.angle_noise * dt)

            old = p.pos.copy()
            p.pos += p.vel * dt

            if self.level.is_wall(p.pos):
                if p.bounce_left > 0:
                    p.bounce_left -= 1
                    p.pos = old
                    p.vel *= -0.8
                    survivors.append(p)
                    continue
                if p.spec.aoe > 0:
                    self._explode(p.pos, p.spec.aoe, p.damage, p.team, p.owner)
                continue

            hit = False
            for ship in self.ships:
                if ship.respawn > 0 or ship.idx == p.owner:
                    continue
                if self.mode == "tdm" and ship.team == p.team:
                    continue
                if (ship.pos - p.pos).length_squared() <= (10 + p.radius) ** 2:
                    ship.hp -= p.damage
                    self.effects.append((ship.pos.copy(), 0.11, (255, 245, 190), 16))
                    if p.spec.aoe > 0:
                        self._explode(p.pos, p.spec.aoe, p.damage * 0.8, p.team, p.owner)
                    if ship.hp <= 0:
                        ship.respawn = 2.0
                        killer = self.ships[p.owner]
                        killer.score += 1
                        self.effects.append((ship.pos.copy(), 0.35, (255, 130, 80), 40))
                    if p.pierce_left > 0:
                        p.pierce_left -= 1
                    else:
                        hit = True
                    break
            if not hit:
                survivors.append(p)

        self.projectiles = survivors[:900]

    def _nearest_enemy_pos(self, pos: Vector2, team: int) -> Optional[Vector2]:
        best, d2 = None, 10**30
        for s in self.ships:
            if s.respawn > 0:
                continue
            if self.mode == "tdm" and s.team == team:
                continue
            dd = (s.pos - pos).length_squared()
            if dd < d2:
                d2 = dd
                best = s.pos
        return best.copy() if best is not None else None

    def _explode(self, pos: Vector2, radius: float, damage: float, team: int, owner: int) -> None:
        if radius <= 0:
            return
        self.effects.append((pos.copy(), 0.18, (255, 120, 60), radius))
        for s in self.ships:
            if s.respawn > 0:
                continue
            if self.mode == "tdm" and s.team == team:
                continue
            d = (s.pos - pos).length()
            if d <= radius:
                scale = max(0.2, 1 - d / max(1, radius))
                s.hp -= damage * scale
                if s.hp <= 0:
                    s.respawn = 2.0
                    self.ships[owner].score += 1

    def _draw(self) -> None:
        focus = self.ships[0].pos if self.ships else Vector2(WORLD_W / 2, WORLD_H / 2)
        cam = Vector2(focus.x - WIDTH / 2, focus.y - HEIGHT / 2)
        cam.x = max(0, min(cam.x, WORLD_W - WIDTH))
        cam.y = max(0, min(cam.y, WORLD_H - HEIGHT))

        self.level.draw(self.screen, cam)

        for p in self.projectiles:
            col = TEAM_COLORS[p.team % len(TEAM_COLORS)]
            pygame.draw.circle(self.screen, col, (int(p.pos.x - cam.x), int(p.pos.y - cam.y)), int(max(2, p.radius)))

        for ship in self.ships:
            if ship.respawn > 0:
                continue
            col = TEAM_COLORS[ship.team % len(TEAM_COLORS)]
            center = Vector2(ship.pos.x - cam.x, ship.pos.y - cam.y)
            nose = center + Vector2(math.cos(ship.angle), math.sin(ship.angle)) * 14
            left = center + Vector2(math.cos(ship.angle + 2.5), math.sin(ship.angle + 2.5)) * 9
            right = center + Vector2(math.cos(ship.angle - 2.5), math.sin(ship.angle - 2.5)) * 9
            pygame.draw.polygon(self.screen, col, [nose, left, right])
            hpw = max(0, int(22 * (ship.hp / 100)))
            pygame.draw.rect(self.screen, (40, 40, 50), (center.x - 11, center.y + 12, 22, 3))
            pygame.draw.rect(self.screen, (90, 240, 110), (center.x - 11, center.y + 12, hpw, 3))

        for pos, ttl, col, rad in self.effects:
            alpha = int(255 * min(1, ttl * 5))
            glow = pygame.Surface((int(rad * 2 + 6), int(rad * 2 + 6)), pygame.SRCALPHA)
            pygame.draw.circle(glow, (*col, alpha), (glow.get_width() // 2, glow.get_height() // 2), int(rad))
            self.screen.blit(glow, (pos.x - cam.x - glow.get_width() / 2, pos.y - cam.y - glow.get_height() / 2))

        self._draw_ui()
        pygame.display.flip()

    def _draw_ui(self) -> None:
        p0 = self.ships[0]
        spec = WEAPON_POOL[p0.weapon_ids[p0.weapon_slot]]
        texts = [
            f"TOU | Mode: {'Team DM' if self.mode == 'tdm' else 'Deathmatch'} | Humans: {self.humans} | Bots: {self.bots} | Units: {self.total_units}/64",
            f"AI: {self.ai_difficulty:.2f} | Weapon: {spec.name} ({spec.category}) | Match: {int(self.round_length - self.match_time)}s",
            "F1 Mode, F2/F3 Humans +/-, F4/F5 Bots +/-, F6/F7 AI +/-, F8 New Level, ESC Quit",
        ]
        y = 8
        for t in texts:
            s = self.font.render(t, True, (230, 230, 238))
            self.screen.blit(s, (10, y))
            y += 21

        sorted_scores = sorted(self.ships, key=lambda s: s.score, reverse=True)[:8]
        y = 90
        title = self.big_font.render("Top Frags", True, (245, 245, 250))
        self.screen.blit(title, (10, y))
        y += 34
        for s in sorted_scores:
            label = f"#{s.idx + 1}{' (H)' if s.is_human else ''} T{s.team + 1}: {s.score}"
            line = self.font.render(label, True, TEAM_COLORS[s.team % len(TEAM_COLORS)])
            self.screen.blit(line, (14, y))
            y += 20


def main() -> None:
    try:
        Game().run()
    except KeyboardInterrupt:
        pygame.quit()
        sys.exit(0)


if __name__ == "__main__":
    main()
