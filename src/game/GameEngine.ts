import { ArenaId, DragonConfig, MatchResult } from '../types/game';
import { DragonPainter, DragonRenderState } from './DragonPainter';
import { sound } from '../services/sound';

export interface FoodItem {
  id: number;
  x: number;
  y: number;
  type: 'orb' | 'apple' | 'berry' | 'golden' | 'coin' | 'gem';
  weightValue: number;
  scoreValue: number;
  radius: number;
  color: string;
}

export interface HazardItem {
  x: number;
  y: number;
  radius: number;
  type: 'thorn' | 'quicksand' | 'lava_pool' | 'pillar';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface DragonEntity {
  id: string;
  name: string;
  isPlayer: boolean;
  config: DragonConfig;
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  speed: number;
  weight: number;
  score: number;
  stamina: number;
  isBoosting: boolean;
  shieldActive: boolean;
  magnetTimer: number;
  speedTimer: number;
  fireBreathTimer: number;
  segments: { x: number; y: number; angle: number }[];
  history: { x: number; y: number }[];
  wingPhase: number;
  kills: number;
  isDead: boolean;
  applesEaten: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private arenaId: ArenaId;
  private playerConfig: DragonConfig;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  // World geometry
  public readonly worldRadius: number = 2400;

  // Entities
  private player: DragonEntity;
  private bots: DragonEntity[] = [];
  private foods: FoodItem[] = [];
  private hazards: HazardItem[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Input states
  private joystickVector = { x: 0, y: 0 };
  private mousePos: { x: number; y: number } | null = null;
  private keysPressed: Record<string, boolean> = {};

  // Camera
  private camera = { x: 0, y: 0, zoom: 1.0, targetZoom: 1.0 };
  private matchStartTime: number = 0;
  private longestLength: number = 10;

  // Callbacks to React HUD
  public onUpdateHud?: (state: {
    score: number;
    weight: number;
    applesEaten: number;
    stamina: number;
    topPlayers: { name: string; score: number; isPlayer: boolean }[];
    playerRank: number;
    powerupTimers: { magnet: number; speed: number; shield: boolean };
    minimapData: { player: { x: number; y: number }; bots: { x: number; y: number }[]; radius: number };
  }) => void;

  public onGameOverCallback?: (result: MatchResult) => void;

  constructor(canvas: HTMLCanvasElement, arenaId: ArenaId, playerConfig: DragonConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.arenaId = arenaId;
    this.playerConfig = playerConfig;

    // Create player dragon
    this.player = this.createDragon('player', 'Jigar', true, playerConfig, 0, 0);

    this.initWorld();
    this.initInputListeners();
  }

  private createDragon(
    id: string,
    name: string,
    isPlayer: boolean,
    config: DragonConfig,
    x: number,
    y: number
  ): DragonEntity {
    const segments: { x: number; y: number; angle: number }[] = [];
    const history: { x: number; y: number }[] = [];
    // Start with small dragon (10 segments), grows steadily as food is devoured
    const initialSegments = isPlayer ? 10 : 14 + Math.floor(Math.random() * 16);
    const spacing = 11;

    for (let i = 0; i < initialSegments * spacing; i++) {
      history.push({ x: x - i, y });
    }

    for (let i = 0; i < initialSegments; i++) {
      segments.push({ x: x - (i + 1) * spacing, y, angle: 0 });
    }

    return {
      id,
      name,
      isPlayer,
      config,
      x,
      y,
      angle: 0,
      targetAngle: 0,
      speed: 190,
      // Start with small weight (40), starts with 0 score
      weight: isPlayer ? 40 : 60 + (initialSegments - 14) * 10,
      score: 0,
      stamina: 100,
      isBoosting: false,
      shieldActive: false,
      magnetTimer: 0,
      speedTimer: 0,
      fireBreathTimer: 0,
      segments,
      history,
      wingPhase: Math.random() * 10,
      kills: 0,
      isDead: false,
      applesEaten: 0,
    };
  }

  private initWorld() {
    this.foods = [];
    this.hazards = [];
    this.particles = [];
    this.floatingTexts = [];
    this.bots = [];
    this.matchStartTime = Date.now();

    // Spawn ~450 initial food items in arena circle
    for (let i = 0; i < 480; i++) {
      this.spawnFoodItem();
    }

    // Spawn Hazards according to arena
    const hazardCount = this.arenaId === 'lava' ? 24 : this.arenaId === 'desert' ? 20 : 15;
    for (let i = 0; i < hazardCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * (this.worldRadius - 500);
      const hx = Math.cos(angle) * dist;
      const hy = Math.sin(angle) * dist;

      const type =
        this.arenaId === 'lava'
          ? Math.random() > 0.4
            ? 'lava_pool'
            : 'pillar'
          : this.arenaId === 'desert'
          ? Math.random() > 0.5
            ? 'quicksand'
            : 'pillar'
          : 'thorn';

      this.hazards.push({
        x: hx,
        y: hy,
        radius: type === 'lava_pool' ? 90 + Math.random() * 40 : 65 + Math.random() * 30,
        type,
      });
    }

    // Spawn 22 AI Bot dragons with distinct colors & placements
    const botNames = [
      'SnakeKing', 'CoolDude', 'QueenSnek', 'Frosty', 'Blaze', 'Shadow',
      'Speedy', 'Vortex', 'Ignis', 'Titan', 'Draco', 'Hydra', 'Slyther',
      'Smaug', 'Fang', 'Glimmer', 'Onyx', 'Storm', 'Pyro', 'Zephyr',
      'Venom', 'Basilisk',
    ];

    botNames.forEach((name, idx) => {
      const angle = (idx / botNames.length) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 600 + Math.random() * (this.worldRadius - 900);
      const bx = Math.cos(angle) * dist;
      const by = Math.sin(angle) * dist;

      // Give bot random dragon colors
      const botConfig: DragonConfig = {
        ...this.playerConfig,
        id: 'bot_' + idx,
        name,
        primaryColor: ['#ef4444', '#3b82f6', '#ec4899', '#8b5cf6', '#eab308', '#06b6d4', '#10b981'][idx % 7],
        secondaryColor: ['#b91c1c', '#1d4ed8', '#be185d', '#6d28d9', '#a16207', '#0891b2', '#047857'][idx % 7],
        bellyColor: '#fef08a',
        eyeColor: '#f59e0b',
        pattern: (['stripes', 'dots', 'scales', 'flames'] as const)[idx % 4],
        horns: 2,
        spikes: 3,
        wings: idx % 2 === 0 ? 'bat' : 'fin',
        tail: 'fan',
      };

      const bot = this.createDragon('bot_' + idx, name, false, botConfig, bx, by);
      bot.angle = Math.random() * Math.PI * 2;
      bot.targetAngle = bot.angle;
      this.bots.push(bot);
    });
  }

  private spawnFoodItem(nearX?: number, nearY?: number): FoodItem {
    let fx = 0;
    let fy = 0;
    if (nearX !== undefined && nearY !== undefined) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 120;
      fx = nearX + Math.cos(angle) * dist;
      fy = nearY + Math.sin(angle) * dist;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (this.worldRadius - 150);
      fx = Math.cos(angle) * dist;
      fy = Math.sin(angle) * dist;
    }

    const rand = Math.random();
    let type: FoodItem['type'] = 'orb';
    let weightValue = 4;
    let scoreValue = 10;
    let radius = 6;
    let color = '#38bdf8';

    if (rand < 0.55) {
      type = 'orb';
      color = ['#38bdf8', '#4ade80', '#f472b6', '#facc15', '#a78bfa'][Math.floor(Math.random() * 5)];
    } else if (rand < 0.8) {
      type = 'apple';
      weightValue = 15;
      scoreValue = 35;
      radius = 11;
      color = '#ef4444';
    } else if (rand < 0.92) {
      type = 'berry';
      weightValue = 25;
      scoreValue = 60;
      radius = 12;
      color = '#8b5cf6';
    } else if (rand < 0.97) {
      type = 'golden';
      weightValue = 50;
      scoreValue = 120;
      radius = 14;
      color = '#f59e0b';
    } else {
      type = 'coin';
      weightValue = 18;
      scoreValue = 75;
      radius = 11;
      color = '#fbbf24';
    }

    const food: FoodItem = {
      id: Math.random() * 1000000,
      x: fx,
      y: fy,
      type,
      weightValue,
      scoreValue,
      radius,
      color,
    };
    this.foods.push(food);
    return food;
  }

  // Input Handling
  public setJoystickVector(vx: number, vy: number) {
    this.joystickVector = { x: vx, y: vy };
  }

  public setBoost(active: boolean) {
    if (this.player.isDead) return;
    this.player.isBoosting = active && this.player.stamina > 5;
    if (this.player.isBoosting) {
      sound.playBoost();
    }
  }

  public activateFireBreath(): boolean {
    if (this.player.isDead || this.player.fireBreathTimer > 0) return false;
    this.player.fireBreathTimer = 2.0; // 2 seconds of cone fire
    sound.playFireBreath();

    // Spawn fire particles and destroy rivals or foods in front cone
    const coneAngle = Math.PI / 3;
    const coneDist = 320;

    this.bots.forEach((bot) => {
      if (bot.isDead) return;
      const dx = bot.x - this.player.x;
      const dy = bot.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < coneDist) {
        const angleToBot = Math.atan2(dy, dx);
        let diff = angleToBot - this.player.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < coneAngle / 2) {
          // Burned by fire breath!
          this.killDragon(bot, true);
        }
      }
    });

    return true;
  }

  public activatePowerUp(type: 'magnet' | 'speed' | 'shield' | 'zoom_in' | 'zoom_out'): boolean {
    if (this.player.isDead) return false;
    sound.playPowerUp();

    if (type === 'magnet') {
      this.player.magnetTimer = 8.0;
      this.addFloatingText(this.player.x, this.player.y - 40, 'MAGNET ACTIVE!', '#38bdf8');
    } else if (type === 'speed') {
      this.player.speedTimer = 6.0;
      this.player.stamina = 100;
      this.addFloatingText(this.player.x, this.player.y - 40, 'SPEED SURGE!', '#4ade80');
    } else if (type === 'shield') {
      this.player.shieldActive = true;
      this.addFloatingText(this.player.x, this.player.y - 40, 'SHIELD ARMED!', '#fbbf24');
    } else if (type === 'zoom_in') {
      this.camera.targetZoom = Math.min(1.4, this.camera.targetZoom + 0.15);
    } else if (type === 'zoom_out') {
      this.camera.targetZoom = Math.max(0.65, this.camera.targetZoom - 0.15);
    }
    return true;
  }

  private initInputListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysPressed[e.key.toLowerCase()] = true;
    if (e.code === 'Space') {
      this.setBoost(true);
    } else if (e.key.toLowerCase() === 'f') {
      this.activateFireBreath();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.key.toLowerCase()] = false;
    if (e.code === 'Space') {
      this.setBoost(false);
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - this.canvas.width / 2;
    const my = e.clientY - rect.top - this.canvas.height / 2;
    this.mousePos = { x: mx, y: my };
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.setBoost(true);
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.setBoost(false);
    }
  };

  // Main Loop
  public start() {
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public pause() {
    this.isPaused = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resume() {
    if (this.isPaused && !this.isGameOver) {
      this.isPaused = false;
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  public destroy() {
    this.pause();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
  }

  private loop = (now: number) => {
    if (this.isPaused) return;

    const dt = Math.min(0.06, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.isGameOver) return;

    // 1. Process Player Input & Target Angle
    let steerX = 0;
    let steerY = 0;

    // Virtual Joystick priority
    if (Math.hypot(this.joystickVector.x, this.joystickVector.y) > 0.15) {
      steerX = this.joystickVector.x;
      steerY = this.joystickVector.y;
    }
    // Keyboard WASD / Arrows
    else if (
      this.keysPressed['w'] || this.keysPressed['arrowup'] ||
      this.keysPressed['s'] || this.keysPressed['arrowdown'] ||
      this.keysPressed['a'] || this.keysPressed['arrowleft'] ||
      this.keysPressed['d'] || this.keysPressed['arrowright']
    ) {
      if (this.keysPressed['w'] || this.keysPressed['arrowup']) steerY -= 1;
      if (this.keysPressed['s'] || this.keysPressed['arrowdown']) steerY += 1;
      if (this.keysPressed['a'] || this.keysPressed['arrowleft']) steerX -= 1;
      if (this.keysPressed['d'] || this.keysPressed['arrowright']) steerX += 1;
    }
    // Mouse relative to screen center
    else if (this.mousePos && Math.hypot(this.mousePos.x, this.mousePos.y) > 30) {
      steerX = this.mousePos.x;
      steerY = this.mousePos.y;
    }

    if (Math.hypot(steerX, steerY) > 0.05) {
      this.player.targetAngle = Math.atan2(steerY, steerX);
    }

    // 2. Update Dragon Entities
    this.updateDragon(this.player, dt);

    // AI Bots update
    this.bots.forEach((bot) => {
      if (!bot.isDead) {
        this.updateBotAi(bot, dt);
        this.updateDragon(bot, dt);
      }
    });

    // 3. Magnet Power-up logic
    if (this.player.magnetTimer > 0) {
      const magnetRange = 340;
      this.foods.forEach((food) => {
        const dx = this.player.x - food.x;
        const dy = this.player.y - food.y;
        const dist = Math.hypot(dx, dy);
        if (dist < magnetRange && dist > 5) {
          food.x += (dx / dist) * 380 * dt;
          food.y += (dy / dist) * 380 * dt;
        }
      });
    }

    // 4. Food Collisions
    const allDragons = [this.player, ...this.bots.filter((b) => !b.isDead)];
    for (let fIdx = this.foods.length - 1; fIdx >= 0; fIdx--) {
      const food = this.foods[fIdx];
      for (const dragon of allDragons) {
        const headRadius = (12.5 + Math.min(39.5, Math.sqrt(Math.max(0, dragon.weight - 35)) * 0.98)) * 1.25;
        const dist = Math.hypot(dragon.x - food.x, dragon.y - food.y);
        if (dist < headRadius + food.radius) {
          // Eat!
          dragon.weight += food.weightValue;
          dragon.score += food.scoreValue;
          if (food.type === 'apple') {
            dragon.applesEaten += 1;
          }

          // Expand length smoothly as dragon devours food and grows ("sammly big big")
          const targetSegments = Math.min(260, 10 + Math.floor(Math.max(0, dragon.weight - 40) / 10));
          if (dragon.segments.length < targetSegments) {
            const lastSeg = dragon.segments[dragon.segments.length - 1];
            dragon.segments.push({ ...lastSeg });
          }

          if (dragon.isPlayer) {
            this.longestLength = Math.max(this.longestLength, dragon.segments.length);
            if (food.type === 'coin') {
              sound.playCoin();
            } else if (food.type === 'gem') {
              sound.playGem();
            } else {
              sound.playEat();
            }
            this.addFloatingText(food.x, food.y, `+${food.scoreValue}`, food.color);
          }

          // Spawn particle sparkle
          this.spawnBurstParticles(food.x, food.y, food.color, 6);

          // Remove food & respawn replacement
          this.foods.splice(fIdx, 1);
          this.spawnFoodItem();
          break;
        }
      }
    }

    // Maintain food density
    while (this.foods.length < 460) {
      this.spawnFoodItem();
    }

    // 5. Dragon-to-Dragon & Hazard Collisions
    this.checkDragonCollisions();

    // 6. Update Particles & Floating Text
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 35 * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 7. Camera follow with smooth weight-based auto-zoom
    const baseWeightZoom = Math.max(0.58, 1.18 - Math.max(0, this.player.weight - 40) * 0.00035);
    const effectiveZoom = baseWeightZoom * this.camera.targetZoom;
    this.camera.zoom += (effectiveZoom - this.camera.zoom) * 0.05;
    this.camera.x += (this.player.x - this.camera.x) * 0.12;
    this.camera.y += (this.player.y - this.camera.y) * 0.12;

    // 8. Push HUD state to React
    if (this.onUpdateHud) {
      const sortedDragons = [this.player, ...this.bots.filter((b) => !b.isDead)].sort(
        (a, b) => b.score - a.score
      );
      const playerRank = sortedDragons.findIndex((d) => d.id === this.player.id) + 1;

      this.onUpdateHud({
        score: this.player.score,
        weight: Math.round(this.player.weight),
        applesEaten: this.player.applesEaten,
        stamina: Math.round(this.player.stamina),
        topPlayers: sortedDragons.slice(0, 5).map((d) => ({
          name: d.name,
          score: d.score,
          isPlayer: d.isPlayer,
        })),
        playerRank,
        powerupTimers: {
          magnet: Math.max(0, Math.ceil(this.player.magnetTimer)),
          speed: Math.max(0, Math.ceil(this.player.speedTimer)),
          shield: this.player.shieldActive,
        },
        minimapData: {
          player: { x: this.player.x, y: this.player.y },
          bots: this.bots.filter((b) => !b.isDead).map((b) => ({ x: b.x, y: b.y })),
          radius: this.worldRadius,
        },
      });
    }

    // Check Objective Victory (e.g. Weight >= 1000 and apples >= 10 in Forest)
    const targetWeight = this.arenaId === 'lava' ? 2000 : this.arenaId === 'desert' ? 1500 : 1000;
    if (this.player.weight >= targetWeight && !this.isGameOver) {
      this.triggerGameOver(true);
    }
  }

  private updateDragon(dragon: DragonEntity, dt: number) {
    // Timers
    if (dragon.magnetTimer > 0) dragon.magnetTimer -= dt;
    if (dragon.speedTimer > 0) dragon.speedTimer -= dt;
    if (dragon.fireBreathTimer > 0) dragon.fireBreathTimer -= dt;

    // Turn rate limit for natural serpentine curves
    let angleDiff = dragon.targetAngle - dragon.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const maxTurnSpeed = 4.5;
    dragon.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxTurnSpeed * dt);

    // Boost & Speed
    let baseSpeed = 195;
    if (dragon.speedTimer > 0) baseSpeed *= 1.5;

    if (dragon.isBoosting && dragon.stamina > 0) {
      dragon.speed = baseSpeed * 1.8;
      dragon.stamina = Math.max(0, dragon.stamina - 30 * dt);
      dragon.weight = Math.max(35, dragon.weight - 2 * dt); // Slight burn
      dragon.wingPhase += dt * 18;

      // Spawn boost trail embers
      if (Math.random() < 0.6) {
        this.particles.push({
          x: dragon.x - Math.cos(dragon.angle) * 20,
          y: dragon.y - Math.sin(dragon.angle) * 20,
          vx: (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40,
          life: 0.35,
          maxLife: 0.35,
          color: dragon.config.primaryColor,
          size: 4 + Math.random() * 3,
        });
      }

      if (dragon.stamina <= 0) {
        dragon.isBoosting = false;
      }
    } else {
      dragon.speed = baseSpeed;
      dragon.stamina = Math.min(100, dragon.stamina + 20 * dt);
      dragon.wingPhase += dt * 7;
    }

    // Move Head
    dragon.x += Math.cos(dragon.angle) * dragon.speed * dt;
    dragon.y += Math.sin(dragon.angle) * dragon.speed * dt;

    // Record position in history
    dragon.history.unshift({ x: dragon.x, y: dragon.y });
    if (dragon.history.length > 3000) {
      dragon.history.pop();
    }

    // Segments follow history trail with dynamic smooth spacing
    const segmentSpacing = Math.min(
      18,
      Math.max(10, Math.round(11 + Math.sqrt(Math.max(0, dragon.weight - 40)) * 0.16))
    );
    for (let i = 0; i < dragon.segments.length; i++) {
      const historyIndex = Math.min((i + 1) * segmentSpacing, dragon.history.length - 1);
      const histPos = dragon.history[historyIndex];
      const prevPos = i === 0 ? { x: dragon.x, y: dragon.y } : dragon.segments[i - 1];

      const seg = dragon.segments[i];
      seg.x = histPos.x;
      seg.y = histPos.y;
      seg.angle = Math.atan2(prevPos.y - seg.y, prevPos.x - seg.x);
    }
  }

  private updateBotAi(bot: DragonEntity, dt: number) {
    // 1. Boundary check: steer back towards center if getting close to edge
    const distToCenter = Math.hypot(bot.x, bot.y);
    if (distToCenter > this.worldRadius - 400) {
      bot.targetAngle = Math.atan2(-bot.y, -bot.x);
      return;
    }

    // 2. Hazard avoidance
    for (const hazard of this.hazards) {
      const dist = Math.hypot(bot.x - hazard.x, bot.y - hazard.y);
      if (dist < hazard.radius + 150) {
        bot.targetAngle = Math.atan2(bot.y - hazard.y, bot.x - hazard.x);
        return;
      }
    }

    // 3. Flee larger nearby dragons, hunt smaller dragons
    const nearbyDragons = [this.player, ...this.bots.filter((b) => !b.isDead && b.id !== bot.id)];
    let dangerThreat = false;

    for (const other of nearbyDragons) {
      const dist = Math.hypot(bot.x - other.x, bot.y - other.y);
      if (dist < 260) {
        if (other.weight > bot.weight * 1.15) {
          // Flee!
          bot.targetAngle = Math.atan2(bot.y - other.y, bot.x - other.x);
          bot.isBoosting = bot.stamina > 40;
          dangerThreat = true;
          break;
        } else if (bot.weight > other.weight * 1.25 && dist < 180) {
          // Hunt!
          bot.targetAngle = Math.atan2(other.y - bot.y, other.x - bot.x);
          bot.isBoosting = bot.stamina > 30;
          dangerThreat = true;
          break;
        }
      }
    }

    if (dangerThreat) return;
    bot.isBoosting = false;

    // 4. Seek nearest food item
    let nearestFood: FoodItem | null = null;
    let minDist = 400;

    for (let i = 0; i < Math.min(60, this.foods.length); i++) {
      const food = this.foods[i];
      const dist = Math.hypot(bot.x - food.x, bot.y - food.y);
      if (dist < minDist) {
        minDist = dist;
        nearestFood = food;
      }
    }

    if (nearestFood) {
      bot.targetAngle = Math.atan2(nearestFood.y - bot.y, nearestFood.x - bot.x);
    } else {
      // Gentle wander
      if (Math.random() < 0.03) {
        bot.targetAngle += (Math.random() - 0.5) * 1.5;
      }
    }
  }

  private checkDragonCollisions() {
    const activeDragons = [this.player, ...this.bots.filter((b) => !b.isDead)];

    for (let i = 0; i < activeDragons.length; i++) {
      const attacker = activeDragons[i];
      if (attacker.isDead) continue;

      const headRadius = 18 + Math.sqrt(attacker.weight) * 0.4;

      // Arena boundary collision
      const distFromCenter = Math.hypot(attacker.x, attacker.y);
      if (distFromCenter > this.worldRadius) {
        this.killDragon(attacker, false);
        continue;
      }

      // Arena hazards collision
      for (const hazard of this.hazards) {
        const hDist = Math.hypot(attacker.x - hazard.x, attacker.y - hazard.y);
        if (hDist < hazard.radius + headRadius) {
          if (hazard.type === 'lava_pool' || hazard.type === 'thorn') {
            this.killDragon(attacker, false);
            break;
          } else if (hazard.type === 'quicksand') {
            attacker.speed *= 0.5; // slow down in quicksand
          }
        }
      }
      if (attacker.isDead) continue;

      // Collisions against other dragons
      for (let j = 0; j < activeDragons.length; j++) {
        if (i === j) continue;
        const target = activeDragons[j];
        if (target.isDead) continue;

        // Head-to-Head collision
        const headDist = Math.hypot(attacker.x - target.x, attacker.y - target.y);
        const targetHeadRadius = 18 + Math.sqrt(target.weight) * 0.4;
        if (headDist < headRadius + targetHeadRadius) {
          if (attacker.weight < target.weight) {
            this.killDragon(attacker, false, target);
          } else {
            this.killDragon(target, false, attacker);
          }
          break;
        }

        // Head-to-Body segment collision (attacker hits target's body)
        for (let segIdx = 2; segIdx < target.segments.length; segIdx++) {
          const seg = target.segments[segIdx];
          const segRadius = (16 + Math.sqrt(target.weight) * 0.4) * (1 - (segIdx / target.segments.length) * 0.55);
          const segDist = Math.hypot(attacker.x - seg.x, attacker.y - seg.y);

          if (segDist < headRadius + segRadius) {
            // Shield blocks 1 collision!
            if (attacker.shieldActive) {
              attacker.shieldActive = false;
              this.addFloatingText(attacker.x, attacker.y - 30, 'SHIELD BROKEN!', '#fbbf24');
              sound.playClick();
              // Bounce back
              attacker.x -= Math.cos(attacker.angle) * 35;
              attacker.y -= Math.sin(attacker.angle) * 35;
              break;
            } else {
              this.killDragon(attacker, false, target);
              break;
            }
          }
        }
      }
    }
  }

  private killDragon(victim: DragonEntity, isFireKill: boolean, killer?: DragonEntity) {
    if (victim.isDead) return;
    victim.isDead = true;

    // Burst body segments into high-value food orbs
    const numOrbs = Math.min(45, Math.floor(victim.segments.length * 0.7));
    for (let i = 0; i < numOrbs; i++) {
      const segIndex = Math.min(i * 2, victim.segments.length - 1);
      const pos = victim.segments[segIndex] || { x: victim.x, y: victim.y };
      const food = this.spawnFoodItem(pos.x, pos.y);
      food.scoreValue = 80;
      food.weightValue = 25;
      food.radius = 12;
      food.color = victim.config.primaryColor;
    }

    // Explosion particles
    this.spawnBurstParticles(victim.x, victim.y, victim.config.primaryColor, 35);
    this.spawnBurstParticles(victim.x, victim.y, '#f59e0b', 25);

    if (killer) {
      killer.kills += 1;
      killer.score += 250;
      if (killer.isPlayer) {
        this.addFloatingText(victim.x, victim.y, `ELIMINATED ${victim.name}! +250`, '#4ade80');
      }
    }

    if (victim.isPlayer) {
      sound.playDeath();
      this.triggerGameOver(false);
    } else {
      // Respawn bot after 5 seconds to keep arena lively
      setTimeout(() => {
        if (!this.isGameOver) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 600 + Math.random() * (this.worldRadius - 800);
          victim.x = Math.cos(angle) * dist;
          victim.y = Math.sin(angle) * dist;
          victim.weight = 120;
          victim.score = 50;
          victim.isDead = false;
          victim.history = [];
          victim.segments = [];
          for (let i = 0; i < 20 * 14; i++) victim.history.push({ x: victim.x - i, y: victim.y });
          for (let i = 0; i < 20; i++) victim.segments.push({ x: victim.x - (i + 1) * 14, y: victim.y, angle: 0 });
        }
      }, 5000);
    }
  }

  private triggerGameOver(won: boolean) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (won) {
      sound.playVictory();
    }

    const durationSec = Math.max(10, Math.floor((Date.now() - this.matchStartTime) / 1000));
    const coinsEarned = Math.min(500, Math.floor(this.player.score * 0.08) + (won ? 80 : 20));
    const gemsEarned = 0; // Strictly no free gems in arena
    const xpEarned = Math.min(800, Math.floor(this.player.score * 0.12) + (won ? 150 : 50));

    const arenaName =
      this.arenaId === 'lava'
        ? 'Magma Flow'
        : this.arenaId === 'desert'
        ? 'Desert Sands'
        : 'Enchanted Forest';

    const result: MatchResult = {
      won,
      finalScore: this.player.score,
      bestScore: Math.max(this.player.score, 3240),
      foodCollected: Math.floor(this.player.score / 15),
      timeSurvivedSeconds: durationSec,
      longestLength: this.longestLength,
      coinsEarned,
      gemsEarned,
      xpEarned,
      arenaName,
      kills: this.player.kills,
      maxWeight: Math.round(this.player.weight),
      isNewBest: this.player.score > 3240,
    };

    if (this.onGameOverCallback) {
      this.onGameOverCallback(result);
    }
  }

  private spawnBurstParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.6,
        color,
        size: 3 + Math.random() * 5,
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 1.1,
      maxLife: 1.1,
    });
  }

  // 2.5D Canvas Rendering
  private render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw Arena Ground
    this.renderArenaGround(ctx);

    // 2. Draw Hazards
    this.renderHazards(ctx);

    // 3. Draw Foods
    this.renderFoods(ctx);

    // 4. Draw Dragons (Depth sorted by Y-position)
    const renderList: { y: number; render: () => void }[] = [];

    // Bots
    this.bots.forEach((bot) => {
      if (!bot.isDead) {
        renderList.push({
          y: bot.y,
          render: () => {
            const state: DragonRenderState = {
              x: bot.x,
              y: bot.y,
              angle: bot.angle,
              weight: bot.weight,
              segments: bot.segments,
              isBoosting: bot.isBoosting,
              wingFlapPhase: bot.wingPhase,
            };
            DragonPainter.drawDragon(ctx, bot.config, state, 1.0);

            // Bot name & score tag
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.font = 'bold 12px "Fredoka", sans-serif';
            ctx.textAlign = 'center';
            const nameWidth = ctx.measureText(bot.name).width;
            ctx.fillRect(bot.x - nameWidth / 2 - 8, bot.y - 42, nameWidth + 16, 18);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(bot.name, bot.x, bot.y - 29);
          },
        });
      }
    });

    // Player
    if (!this.player.isDead) {
      renderList.push({
        y: this.player.y,
        render: () => {
          const state: DragonRenderState = {
            x: this.player.x,
            y: this.player.y,
            angle: this.player.angle,
            weight: this.player.weight,
            segments: this.player.segments,
            isBoosting: this.player.isBoosting,
            wingFlapPhase: this.player.wingPhase,
          };
          DragonPainter.drawDragon(ctx, this.player.config, state, 1.0);

          // Player Shield Bubble
          if (this.player.shieldActive) {
            ctx.save();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
            ctx.beginPath();
            ctx.arc(this.player.x, this.player.y, 45, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          // Player Fire Breath Cone
          if (this.player.fireBreathTimer > 0) {
            ctx.save();
            ctx.translate(this.player.x, this.player.y);
            ctx.rotate(this.player.angle);
            const coneGrad = ctx.createRadialGradient(0, 0, 20, 260, 0, 320);
            coneGrad.addColorStop(0, 'rgba(255, 240, 100, 0.85)');
            coneGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.7)');
            coneGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = coneGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 320, -Math.PI / 6, Math.PI / 6);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          // Player Name Tag with Crown indicator
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.font = 'bold 13px "Fredoka", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillRect(this.player.x - 38, this.player.y - 48, 76, 20);
          ctx.fillStyle = '#facc15';
          ctx.fillText(`★ ${this.player.name}`, this.player.x, this.player.y - 34);
        },
      });
    }

    renderList.sort((a, b) => a.y - b.y);
    renderList.forEach((item) => item.render());

    // 5. Draw Particles
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 6. Draw Floating Texts
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 16px "Lilita One", cursive, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();
  }

  private renderArenaGround(ctx: CanvasRenderingContext2D) {
    const r = this.worldRadius;

    // Void / abyss background outside island
    ctx.save();
    ctx.fillStyle = '#050a14';
    ctx.fillRect(this.camera.x - 2000, this.camera.y - 2000, 4000, 4000);

    // Floating Island Cliff Base (Drop shadow & depth rim)
    ctx.fillStyle = '#0b192e';
    ctx.beginPath();
    ctx.arc(0, 45, r + 25, 0, Math.PI * 2);
    ctx.fill();

    // Arena Floor
    let floorGrad: CanvasGradient;
    if (this.arenaId === 'lava') {
      // Dark Volcanic Stone
      floorGrad = ctx.createRadialGradient(0, 0, 100, 0, 0, r);
      floorGrad.addColorStop(0, '#2b1029');
      floorGrad.addColorStop(0.7, '#1b0821');
      floorGrad.addColorStop(1, '#7c1e10');
    } else if (this.arenaId === 'desert') {
      // Golden Sand Dunes
      floorGrad = ctx.createRadialGradient(0, 0, 100, 0, 0, r);
      floorGrad.addColorStop(0, '#d97706');
      floorGrad.addColorStop(0.7, '#b45309');
      floorGrad.addColorStop(1, '#78350f');
    } else {
      // Emerald Forest Grass
      floorGrad = ctx.createRadialGradient(0, 0, 100, 0, 0, r);
      floorGrad.addColorStop(0, '#22c55e');
      floorGrad.addColorStop(0.7, '#15803d');
      floorGrad.addColorStop(1, '#0f5132');
    }

    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Decorative Ground Grid Tiles
    ctx.strokeStyle = this.arenaId === 'lava' ? 'rgba(249, 115, 22, 0.12)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    const tileSize = 200;
    const minGrid = -r;
    const maxGrid = r;

    ctx.beginPath();
    for (let x = minGrid; x <= maxGrid; x += tileSize) {
      for (let y = minGrid; y <= maxGrid; y += tileSize) {
        if (Math.hypot(x, y) < r - 50) {
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }
    }

    // Outer Perimeter Border Ring
    ctx.lineWidth = 28;
    ctx.strokeStyle =
      this.arenaId === 'lava'
        ? '#ea580c'
        : this.arenaId === 'desert'
        ? '#d97706'
        : '#15803d';
    ctx.beginPath();
    ctx.arc(0, 0, r - 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private renderHazards(ctx: CanvasRenderingContext2D) {
    this.hazards.forEach((h) => {
      ctx.save();
      if (h.type === 'lava_pool') {
        // Glowing animated molten pool
        const grad = ctx.createRadialGradient(h.x, h.y, h.radius * 0.2, h.x, h.y, h.radius);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.5, '#ea580c');
        grad.addColorStop(1, '#7c2d12');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();

        // Dark crust floating
        ctx.fillStyle = '#3c0d03';
        ctx.beginPath();
        ctx.arc(h.x - h.radius * 0.3, h.y - h.radius * 0.2, h.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (h.type === 'quicksand') {
        // Swirling golden dust pool
        const grad = ctx.createRadialGradient(h.x, h.y, h.radius * 0.2, h.x, h.y, h.radius);
        grad.addColorStop(0, '#fde68a');
        grad.addColorStop(1, '#92400e');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (h.type === 'thorn') {
        // Dense briar patch
        ctx.fillStyle = '#064e3b';
        ctx.strokeStyle = '#022c22';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Sandstone pillar / Rock
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(h.x + 10, h.y + 15, h.radius * 1.1, h.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  private renderFoods(ctx: CanvasRenderingContext2D) {
    this.foods.forEach((food) => {
      // Cull foods far outside camera view for 60fps performance
      const dx = food.x - this.camera.x;
      const dy = food.y - this.camera.y;
      if (Math.abs(dx) > 1300 || Math.abs(dy) > 1300) return;

      ctx.save();

      // Soft drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(food.x + 3, food.y + 5, food.radius, food.radius * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shaded edible sphere with specular highlight
      const grad = ctx.createRadialGradient(
        food.x - food.radius * 0.3,
        food.y - food.radius * 0.3,
        food.radius * 0.1,
        food.x,
        food.y,
        food.radius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, food.color);
      grad.addColorStop(1, '#0f172a');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
      ctx.fill();

      // Apple leaf / Coin icon / Gem glow details
      if (food.type === 'apple') {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(food.x + 2, food.y - food.radius * 0.9, 4, 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (food.type === 'coin') {
        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 9px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', food.x, food.y + 3);
      } else if (food.type === 'gem') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();
    });
  }
}
