/**
 * Настройки мини-игры «Дорога». Все «магические числа» — здесь,
 * чтобы баланс можно было крутить, не трогая логику.
 *
 * Логические координаты: мир 470 × 835 (ровно половина размера фона 941 × 1672).
 * Рендер масштабируется под реальный размер canvas.
 */
export interface RoadRunnerConfig {
  width: number;
  height: number;
  /** X-центры трёх полос (посчитаны по фону: разметка на 351 и 588 из 941 px). */
  laneCenters: [number, number, number];
  /** Фиксированная Y-позиция мишки (центр). */
  bearY: number;
  bearHitW: number;
  bearHitH: number;
  /** Скорость сглаживания перехода между полосами (чем больше — тем резче). */
  laneSmooth: number;

  lives: number;
  baseSpeed: number; // px/s в логических координатах
  maxSpeed: number;
  /** За сколько секунд раунда скорость линейно разгоняется от baseSpeed до maxSpeed. */
  speedRampSeconds: number;
  /** Дистанция (м), на которой сложность достигает максимума. Сложность = distance / difficultyMeters. */
  difficultyMeters: number;
  hitSlowdown: number; // множитель скорости после удара
  pxPerMeter: number;

  invulnAfterHit: number; // сек. неуязвимости после удара
  /** Доля собранных за заезд монет, которая теряется при каждом ударе (без щита). */
  coinLossOnHit: number;
  /** Шанс «приманки»: дорожка монет лежит в полосе с препятствием сразу ЗА ним — чтобы забрать, надо объехать и вернуться. */
  baitChance: number;
  magnetDuration: number;
  shieldDuration: number;
  doubleDuration: number;
  magnetRadius: number;
  magnetPull: number; // px/s

  /** Средний шаг между рядами (px): в начале забега → на максимальной сложности (ряды идут гуще). */
  rowGapStart: number;
  rowGapEnd: number;
  /** Случайный разброс шага. */
  rowGapJitter: [number, number];
  /** Минимум времени (сек) на реакцию: шаг между рядами никогда не меньше speed * reactionTime. */
  reactionTime: number;
  /** Абсолютный минимум шага (px). */
  minRowGap: number;
  powerupChance: number;
  /** Шанс сердечка (+1 жизнь) на ряд — выпадает только если жизни не полные. */
  heartChance: number;
  /**
   * Процент рядов с препятствиями: на старте obstacleShareStart, +obstacleShareStep за каждые
   * obstacleShareEveryMeters метров, но не больше obstacleShareMax. Остальные ряды — без препятствий (монеты).
   * По умолчанию: минимум 50% → +1% за каждые 5 м → максимум 85% (достигается на 175-м метре).
   */
  obstacleShareStart: number;
  obstacleShareMax: number;
  obstacleShareStep: number;
  obstacleShareEveryMeters: number;
  /** Шанс, что в свободной полосе ряда будет дорожка монет. */
  coinTrailChance: number;
  /** Во сколько раз реже дорожки монет на максимальной сложности (1 = не реже). Долгий заезд не должен быть «фермой». */
  coinTrailLateFactor: number;
  coinsInFreeRow: number; // монет в ряду без препятствий
  coinsInMixedRow: number; // монет в ряду с препятствиями
  /** Шанс двух препятствий в ряду: растёт вместе со сложностью (по дистанции) вместе со скоростью. */
  doubleObstacleChance: [number, number];
}

export const DEFAULT_CONFIG: RoadRunnerConfig = {
  width: 470,
  height: 835,
  laneCenters: [128, 235, 342],
  bearY: 650,
  bearHitW: 44,
  bearHitH: 92,
  laneSmooth: 18,

  lives: 3,
  baseSpeed: 300,
  maxSpeed: 680,
  speedRampSeconds: 120,
  difficultyMeters: 1200,
  hitSlowdown: 0.7,
  pxPerMeter: 60,

  invulnAfterHit: 0.9,
  coinLossOnHit: 0.25,
  baitChance: 0.4,
  magnetDuration: 5,
  shieldDuration: 10,
  doubleDuration: 6,
  magnetRadius: 190,
  magnetPull: 760,

  rowGapStart: 400,
  rowGapEnd: 300,
  rowGapJitter: [0.85, 1.15],
  reactionTime: 0.55,
  minRowGap: 280,
  powerupChance: 0.05,
  heartChance: 0.04,
  obstacleShareStart: 0.5,
  obstacleShareMax: 0.85,
  obstacleShareStep: 0.01,
  obstacleShareEveryMeters: 5,
  coinTrailChance: 0.7,
  coinTrailLateFactor: 0.6,
  coinsInFreeRow: 3,
  coinsInMixedRow: 2,
  doubleObstacleChance: [0.08, 0.65],
};

/**
 * Размеры объектов на дороге. w — ширина спрайта в логических px (полоса ≈ 107),
 * h считается по пропорциям картинки. hit — доля спрайта, участвующая в столкновении
 * (меньше 1 — прощаем «по краю», дети не должны злиться).
 */
export const OBSTACLES = {
  box: { w: 70, aspect: 292 / 300, hit: 0.82 },
  crate: { w: 70, aspect: 279 / 300, hit: 0.82 },
  barrier: { w: 98, aspect: 157 / 300, hit: 0.85 },
  cones: { w: 100, aspect: 95 / 300, hit: 0.85 },
  'hole-small': { w: 78, aspect: 275 / 300, hit: 0.65 },
  'hole-big': { w: 90, aspect: 281 / 300, hit: 0.65 },
  concrete: { w: 98, aspect: 155 / 300, hit: 0.85 },
  rocks: { w: 82, aspect: 260 / 300, hit: 0.75 },
} as const;

export const PICKUPS = {
  coin: { w: 40, h: 39 },
  magnet: { w: 52, h: 50 },
  shield: { w: 48, h: 52 },
  double: { w: 54, h: 43 },
  heart: { w: 46, h: 46 },
} as const;

/** Мишка на велосипеде: спрайт 204 × 420. */
export const BEAR = { w: 72, h: 148 } as const;
