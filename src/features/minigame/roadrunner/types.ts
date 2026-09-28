export type Lane = 0 | 1 | 2;
export type ObstacleKind =
  | 'box'
  | 'crate'
  | 'barrier'
  | 'cones'
  | 'hole-small'
  | 'hole-big'
  | 'concrete'
  | 'rocks';
export type PickupKind = 'coin' | 'magnet' | 'shield' | 'double' | 'heart';
export type EntityKind = ObstacleKind | PickupKind;
export type Phase = 'ready' | 'playing' | 'over';

export interface Entity {
  id: number;
  kind: EntityKind;
  isObstacle: boolean;
  lane: Lane;
  /** Центр объекта. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Доля размера, участвующая в столкновении. */
  hit: number;
}

export interface GameState {
  phase: Phase;
  time: number;
  /** Пройденный путь (логические px) — им двигается фон. */
  distance: number;
  speed: number;
  lives: number;
  coins: number;
  lane: Lane;
  bearX: number;
  /** -1..1, наклон мишки при смене полосы (для анимации). */
  tilt: number;
  magnetLeft: number;
  shieldLeft: number;
  doubleLeft: number;
  invulnLeft: number;
  entities: Entity[];
}

export type GameEventType =
  | 'start'
  | 'lane'
  | 'coin'
  | 'hit'
  | 'shield-block'
  | 'powerup'
  | 'heal'
  | 'gameover';

export interface GameResult {
  coins: number;
  meters: number;
  seconds: number;
}
