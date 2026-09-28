import bear from './assets/bear.png';
import road from './assets/road.jpg';
import crash from './assets/crash.jpg';

/** Картинка в окне «Заезд окончен». */
export const CRASH_IMAGE = crash;
import box from './assets/box.png';
import crate from './assets/crate.png';
import barrier from './assets/barrier.png';
import cones from './assets/cones.png';
import holeSmall from './assets/hole-small.png';
import holeBig from './assets/hole-big.png';
import concrete from './assets/concrete.png';
import rocks from './assets/rocks.png';
import double from './assets/double.png';
import coin from '../../../assets/icons/coin.png'; // обычная монета проекта
import heart from '../../../assets/icons/metrics/heart-3d.png'; // сердечко здоровья проекта
import magnet from './assets/magnet.png';
import shield from './assets/shield.png';

export type SpriteKey =
  | 'road'
  | 'bear'
  | 'box'
  | 'crate'
  | 'barrier'
  | 'cones'
  | 'hole-small'
  | 'hole-big'
  | 'concrete'
  | 'rocks'
  | 'coin'
  | 'magnet'
  | 'shield'
  | 'double'
  | 'heart';

export type SpriteUrls = Partial<Record<SpriteKey, string>>;
export type Sprites = Partial<Record<SpriteKey, CanvasImageSource>>;

/** Готовые ассеты. Обычная монета — из ассетов проекта (assets/coin.png); при необходимости подмена через `spriteUrls`. */
export const DEFAULT_SPRITE_URLS: SpriteUrls = {
  road,
  bear,
  box,
  crate,
  barrier,
  cones,
  'hole-small': holeSmall,
  'hole-big': holeBig,
  concrete,
  rocks,
  coin, // обычная монета проекта
  heart, // сердечко: +1 жизнь
  double, // две монеты — ТОЛЬКО бонус «x2»
  magnet,
  shield,
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`sprite load failed: ${url}`));
    img.src = url;
  });
}

function draw(size: number, fn: (c: CanvasRenderingContext2D, s: number) => void): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  fn(cv.getContext('2d')!, size);
  return cv;
}

/** Плейсхолдеры для того, чего ещё нет в ассетах. */
function placeholders(): Sprites {
  const coin = draw(96, (c, s) => {
    const g = c.createRadialGradient(s * 0.4, s * 0.35, 4, s / 2, s / 2, s / 2);
    g.addColorStop(0, '#fff3a0');
    g.addColorStop(0.55, '#ffc928');
    g.addColorStop(1, '#d98a00');
    c.fillStyle = g;
    c.beginPath();
    c.arc(s / 2, s / 2, s / 2 - 3, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 5;
    c.strokeStyle = '#b86e00';
    c.stroke();
    c.beginPath();
    c.arc(s / 2, s / 2, s * 0.32, 0, Math.PI * 2);
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(184,110,0,.55)';
    c.stroke();
  });
  const magnet = draw(96, (c, s) => {
    c.lineWidth = 16;
    c.lineCap = 'butt';
    c.strokeStyle = '#e53935';
    c.beginPath();
    c.arc(s / 2, s * 0.48, s * 0.3, Math.PI, 0);
    c.lineTo(s * 0.8, s * 0.82);
    c.moveTo(s * 0.2, s * 0.48);
    c.lineTo(s * 0.2, s * 0.82);
    c.stroke();
    c.fillStyle = '#eceff1';
    c.fillRect(s * 0.12, s * 0.74, 16, s * 0.16);
    c.fillRect(s * 0.72, s * 0.74, 16, s * 0.16);
  });
  const shield = draw(96, (c, s) => {
    c.beginPath();
    c.moveTo(s / 2, s * 0.08);
    c.lineTo(s * 0.86, s * 0.22);
    c.quadraticCurveTo(s * 0.86, s * 0.7, s / 2, s * 0.94);
    c.quadraticCurveTo(s * 0.14, s * 0.7, s * 0.14, s * 0.22);
    c.closePath();
    const g = c.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, '#64b5f6');
    g.addColorStop(1, '#1565c0');
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 5;
    c.strokeStyle = '#0d47a1';
    c.stroke();
    c.strokeStyle = '#fff';
    c.lineWidth = 7;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(s * 0.34, s * 0.5);
    c.lineTo(s * 0.46, s * 0.62);
    c.lineTo(s * 0.68, s * 0.36);
    c.stroke();
  });
  const double = draw(96, (c, s) => {
    const g = c.createRadialGradient(s * 0.4, s * 0.35, 4, s / 2, s / 2, s / 2);
    g.addColorStop(0, '#fff3a0');
    g.addColorStop(0.55, '#ffc928');
    g.addColorStop(1, '#d98a00');
    c.fillStyle = g;
    c.beginPath();
    c.arc(s * 0.4, s * 0.5, s * 0.34, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = '#b86e00';
    c.stroke();
    c.beginPath();
    c.arc(s * 0.62, s * 0.5, s * 0.3, 0, Math.PI * 2);
    c.fillStyle = g;
    c.fill();
    c.stroke();
    c.fillStyle = '#7a2fd0';
    c.strokeStyle = '#fff';
    c.lineWidth = 6;
    c.font = `900 ${s * 0.46}px system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.strokeText('x2', s / 2, s * 0.52);
    c.fillText('x2', s / 2, s * 0.52);
  });
  return { coin, magnet, shield, double };
}

/** Загружает все спрайты; при ошибке конкретного файла игра не падает, объект просто не рисуется. */
export async function loadSprites(urls: SpriteUrls = DEFAULT_SPRITE_URLS): Promise<Sprites> {
  const out: Sprites = { ...placeholders() };
  await Promise.all(
    (Object.entries(urls) as [SpriteKey, string][]).map(async ([k, u]) => {
      try {
        out[k] = await loadImage(u);
      } catch (e) {
        console.warn(e);
      }
    }),
  );
  return out;
}
