import {
  DEFAULT_CONFIG,
  OBSTACLES,
  PICKUPS,
  type RoadRunnerConfig,
} from './config';
import type {
  Entity,
  GameEventType,
  GameResult,
  GameState,
  Lane,
  ObstacleKind,
} from './types';

export type GameListener = (event: GameEventType, state: GameState) => void;

const OBSTACLE_KINDS = Object.keys(OBSTACLES) as ObstacleKind[];
/** Дыры и камни встречаются чаще, чем громоздкие барьеры. */
const OBSTACLE_WEIGHTS: Record<ObstacleKind, number> = {
  box: 1,
  crate: 1,
  barrier: 1,
  cones: 1,
  'hole-small': 1.2,
  'hole-big': 0.8,
  concrete: 0.8,
  rocks: 1.2,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Чистая игровая логика без DOM/React: легко тестировать и переиспользовать.
 * Мишка стоит на месте по высоте, двигается только между 3 полосами;
 * «движется» мир: объекты едут вниз, distance крутит фон.
 */
export class RoadRunnerEngine {
  readonly cfg: RoadRunnerConfig;
  state: GameState;
  private rng: () => number;
  private listeners = new Set<GameListener>();
  private nextId = 1;
  private sinceRow = 0;
  private nextGap = 0;
  /** Свободные полосы предыдущего ряда — чтобы соседние ряды всегда проходились одним перестроением. */
  private prevFree: Lane[] = [0, 1, 2];
  private freeStreak = 0;

  constructor(cfg: RoadRunnerConfig = DEFAULT_CONFIG, rng: () => number = Math.random) {
    this.cfg = { ...cfg };
    this.rng = rng;
    this.state = this.initialState();
  }

  /** Подгоняет высоту мира под реальные пропорции экрана (мишка остаётся на том же расстоянии от низа). */
  fitHeight(worldHeight: number, base: RoadRunnerConfig = DEFAULT_CONFIG) {
    this.cfg.height = worldHeight;
    this.cfg.bearY = worldHeight - (base.height - base.bearY);
  }

  on(fn: GameListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(e: GameEventType) {
    this.listeners.forEach((l) => l(e, this.state));
  }

  private initialState(): GameState {
    return {
      phase: 'ready',
      time: 0,
      distance: 0,
      speed: this.cfg.baseSpeed,
      lives: this.cfg.lives,
      coins: 0,
      lane: 1,
      bearX: this.cfg.laneCenters[1],
      tilt: 0,
      magnetLeft: 0,
      shieldLeft: 0,
      doubleLeft: 0,
      invulnLeft: 0,
      entities: [],
    };
  }

  reset() {
    this.state = this.initialState();
    this.sinceRow = 0;
    this.nextGap = 0;
    this.nextId = 1;
    this.prevFree = [0, 1, 2];
    this.freeStreak = 0;
  }

  start() {
    this.reset();
    this.state.phase = 'playing';
    this.nextGap = this.rollGap();
    this.sinceRow = this.nextGap * 0.6; // первый ряд появится быстро, но не мгновенно
    this.emit('start');
  }

  moveLeft() {
    this.setLane((this.state.lane - 1) as Lane);
  }
  moveRight() {
    this.setLane((this.state.lane + 1) as Lane);
  }
  setLane(lane: Lane) {
    if (this.state.phase !== 'playing') return;
    if (lane < 0 || lane > 2 || lane === this.state.lane) return;
    this.state.lane = lane;
    this.emit('lane');
  }

  /** 0..1 — растёт с пройденной дистанцией: скорость, плотность и «двойные» ряды. */
  get difficulty() {
    return Math.max(0, Math.min(1, this.state.distance / this.cfg.pxPerMeter / this.cfg.difficultyMeters));
  }

  /** Доля рядов с препятствиями сейчас: 20% на старте, +1% за каждые 5 м, максимум 70%. */
  get obstacleShare() {
    const c = this.cfg;
    const steps = Math.floor(this.meters / c.obstacleShareEveryMeters);
    return Math.min(c.obstacleShareMax, c.obstacleShareStart + steps * c.obstacleShareStep);
  }

  /** Шаг до следующего ряда: гуще с ростом сложности, но не меньше времени на реакцию. */
  private rollGap(): number {
    const c = this.cfg;
    const base = lerp(c.rowGapStart, c.rowGapEnd, this.difficulty);
    const gap = base * lerp(c.rowGapJitter[0], c.rowGapJitter[1], this.rng());
    return Math.max(c.minRowGap, this.state.speed * c.reactionTime, gap);
  }

  get meters() {
    return Math.floor(this.state.distance / this.cfg.pxPerMeter);
  }

  result(): GameResult {
    return { coins: this.state.coins, meters: this.meters, seconds: Math.round(this.state.time) };
  }

  /** Один шаг симуляции. dt — секунды. */
  update(dtRaw: number) {
    const s = this.state;
    const c = this.cfg;
    if (s.phase !== 'playing') return;
    const dt = Math.min(dtRaw, 0.05);

    s.time += dt;
    // Скорость нарастает со временем; после удара временно падает и плавно восстанавливается.
    // Ускорение зависит от длительности раунда (а не от пройденной дистанции)
    const target = lerp(c.baseSpeed, c.maxSpeed, Math.min(1, s.time / c.speedRampSeconds));
    s.speed = s.speed < target ? Math.min(target, s.speed + 160 * dt) : target;
    const dy = s.speed * dt;
    s.distance += dy;

    // Плавное перестроение
    const tx = c.laneCenters[s.lane];
    s.bearX += (tx - s.bearX) * (1 - Math.exp(-c.laneSmooth * dt));
    s.tilt = Math.max(-1, Math.min(1, (tx - s.bearX) / 60));

    s.magnetLeft = Math.max(0, s.magnetLeft - dt);
    s.shieldLeft = Math.max(0, s.shieldLeft - dt);
    s.doubleLeft = Math.max(0, s.doubleLeft - dt);
    s.invulnLeft = Math.max(0, s.invulnLeft - dt);

    // Спавн рядов
    this.sinceRow += dy;
    if (this.sinceRow >= this.nextGap) {
      this.spawnRow(-120 + (this.sinceRow - this.nextGap));
      this.sinceRow = 0;
      this.nextGap = this.rollGap();
    }

    // Движение объектов + магнит
    const bearY = c.bearY;
    for (const e of s.entities) {
      e.y += dy;
      if (!e.isObstacle && e.kind === 'coin' && s.magnetLeft > 0) {
        const ddx = s.bearX - e.x;
        const ddy = bearY - e.y;
        const d = Math.hypot(ddx, ddy);
        if (d < c.magnetRadius && d > 1) {
          const step = Math.min(d, c.magnetPull * dt);
          e.x += (ddx / d) * step;
          e.y += (ddy / d) * step;
        }
      }
    }

    this.collide();
    s.entities = s.entities.filter((e) => e.y < c.height + 200);
  }

  private collide() {
    const s = this.state;
    const c = this.cfg;
    const bx = s.bearX;
    const by = c.bearY;
    const hw = c.bearHitW / 2;
    const hh = c.bearHitH / 2;
    const remove = new Set<number>();

    for (const e of s.entities) {
      const ew = (e.w * e.hit) / 2;
      const eh = (e.h * e.hit) / 2;
      const overlap =
        Math.abs(e.x - bx) < hw + ew && Math.abs(e.y - by) < hh + eh;
      if (!overlap) continue;

      if (!e.isObstacle) {
        remove.add(e.id);
        if (e.kind === 'coin') {
          s.coins += s.doubleLeft > 0 ? 2 : 1;
          this.emit('coin');
        } else if (e.kind === 'magnet') {
          s.magnetLeft = c.magnetDuration;
          this.emit('powerup');
        } else if (e.kind === 'shield') {
          s.shieldLeft = c.shieldDuration;
          this.emit('powerup');
        } else if (e.kind === 'heart') {
          if (s.lives < c.lives) s.lives += 1;
          this.emit('heal');
        } else if (e.kind === 'double') {
          s.doubleLeft = c.doubleDuration;
          this.emit('powerup');
        }
        continue;
      }

      if (s.invulnLeft > 0) continue; // проезжаем «сквозь» после удара
      remove.add(e.id);
      if (s.shieldLeft > 0) {
        s.shieldLeft = 0;
        s.invulnLeft = 0.4;
        this.emit('shield-block');
      } else {
        s.lives -= 1;
        s.coins -= Math.ceil(s.coins * c.coinLossOnHit); // удар стоит части монет заезда
        s.invulnLeft = c.invulnAfterHit;
        s.speed *= c.hitSlowdown;
        if (s.lives <= 0) {
          s.phase = 'over';
          this.emit('hit');
          this.emit('gameover');
          break;
        }
        this.emit('hit');
      }
    }
    if (remove.size) s.entities = s.entities.filter((e) => !remove.has(e.id));
  }

  private pickWeighted(): ObstacleKind {
    const total = OBSTACLE_KINDS.reduce((a, k) => a + OBSTACLE_WEIGHTS[k], 0);
    let r = this.rng() * total;
    for (const k of OBSTACLE_KINDS) {
      r -= OBSTACLE_WEIGHTS[k];
      if (r <= 0) return k;
    }
    return OBSTACLE_KINDS[0];
  }

  private makeObstacle(kind: ObstacleKind, lane: Lane, y: number): Entity {
    const o = OBSTACLES[kind];
    return {
      id: this.nextId++,
      kind,
      isObstacle: true,
      lane,
      x: this.cfg.laneCenters[lane],
      y,
      w: o.w,
      h: o.w * o.aspect,
      hit: o.hit,
    };
  }

  private makePickup(kind: 'coin' | 'magnet' | 'shield' | 'double' | 'heart', lane: Lane, y: number): Entity {
    const p = PICKUPS[kind];
    return {
      id: this.nextId++,
      kind,
      isObstacle: false,
      lane,
      x: this.cfg.laneCenters[lane],
      y,
      w: p.w,
      h: p.h,
      hit: 1,
    };
  }

  /**
   * Ряд: 1–2 препятствия (всегда остаётся хотя бы одна свободная полоса),
   * в свободных полосах — дорожка монет или редкий бонус.
   */
  private spawnRow(y: number) {
    const c = this.cfg;
    const s = this.state;
    const lanes: Lane[] = [0, 1, 2];
    const shuffled = lanes.sort(() => this.rng() - 0.5);
    const pDouble = lerp(c.doubleObstacleChance[0], c.doubleObstacleChance[1], this.difficulty);

    let obstacleLanes: Lane[];
    // Два ряда без препятствий подряд не бывает — иначе на дороге образуются длинные пустые участки
    if (this.freeStreak < 1 && this.rng() >= this.obstacleShare) obstacleLanes = [];
    else obstacleLanes = shuffled.slice(0, this.rng() < pDouble ? 2 : 1);

    if (obstacleLanes.length === 2) {
      // единственная свободная полоса должна быть в 1 перестроении от ЛЮБОЙ свободной полосы прошлого ряда,
      // где бы ни стоял игрок — двойной прыжок через две полосы не требуется
      const okFree = lanes.filter((l) => this.prevFree.every((p) => Math.abs(p - l) <= 1));
      const chosen = okFree[Math.floor(this.rng() * okFree.length)];
      obstacleLanes = lanes.filter((l) => l !== chosen);
    }
    this.freeStreak = obstacleLanes.length === 0 ? this.freeStreak + 1 : 0;
    this.prevFree = lanes.filter((l) => !obstacleLanes.includes(l));

    for (const l of obstacleLanes) s.entities.push(this.makeObstacle(this.pickWeighted(), l, y));

    const free = lanes.filter((l) => !obstacleLanes.includes(l));
    const target = free[Math.floor(this.rng() * free.length)];

    if (s.lives < c.lives && this.rng() < c.heartChance) {
      s.entities.push(this.makePickup('heart', target, y));
    } else if (this.rng() < c.powerupChance) {
      // не выдаём бонус, который уже активен
      const options = (['magnet', 'shield', 'double'] as const).filter(
        (k) => (k === 'magnet' ? s.magnetLeft : k === 'shield' ? s.shieldLeft : s.doubleLeft) <= 0,
      );
      const pool = options.length ? options : (['magnet', 'shield', 'double'] as const);
      const kind = pool[Math.floor(this.rng() * pool.length)];
      s.entities.push(this.makePickup(kind, target, y));
    } else if (this.rng() < c.coinTrailChance * lerp(1, c.coinTrailLateFactor, this.difficulty)) {
      const n = obstacleLanes.length === 0 ? c.coinsInFreeRow : c.coinsInMixedRow;
      const bait = obstacleLanes.length > 0 && this.rng() < c.baitChance;
      if (bait) {
        // приманка: монеты лежат в полосе с препятствием, сразу за ним (по ходу движения)
        const lane = obstacleLanes[Math.floor(this.rng() * obstacleLanes.length)];
        for (let i = 0; i < n; i++) s.entities.push(this.makePickup('coin', lane, y - 105 - i * 56));
      } else {
        for (let i = 0; i < n; i++) s.entities.push(this.makePickup('coin', target, y - i * 56));
      }
    }
  }
}
