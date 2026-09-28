import { BEAR, type RoadRunnerConfig } from './config';
import type { Sprites } from './assets';
import type { GameState } from './types';

/**
 * Кэш спрайтов, заранее уменьшенных до реального размера на экране (в пикселях canvas).
 * Рисовать 300-px картинку в 70-px кадр каждый кадр — дорого; уменьшаем один раз.
 */
const scaledCache = new WeakMap<object, Map<string, HTMLCanvasElement>>();
function scaled(img: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const wp = Math.max(1, Math.round(w));
  const hp = Math.max(1, Math.round(h));
  let m = scaledCache.get(img);
  if (!m) scaledCache.set(img, (m = new Map()));
  const key = `${wp}x${hp}`;
  let c = m.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = wp;
    c.height = hp;
    const cx = c.getContext('2d')!;
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(img, 0, 0, wp, hp); // единожды, с качественным сглаживанием
    m.set(key, c);
  }
  return c;
}

/**
 * Рисует один кадр. Ничего не знает про React/DOM, кроме контекста canvas.
 * Ctx уже отмасштабирован так, что рисуем в логических координатах cfg.width × cfg.height.
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  cfg: RoadRunnerConfig,
  sprites: Sprites,
) {
  const { width: W, height: H } = cfg;
  ctx.clearRect(0, 0, W, H);

  // 1. Бесшовная лента дороги: рисуем в пикселях canvas, целыми числами, из предмасштабированной картинки
  const sc = ctx.getTransform().a;
  const road = sprites.road as HTMLImageElement | undefined;
  if (road) {
    const tw = Math.round(W * sc);
    const th = Math.round(road.naturalHeight * (tw / road.naturalWidth));
    const tile = scaled(road, tw, th);
    const off = Math.floor(s.distance * sc) % th;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let y = off - th; y < Math.round(H * sc); y += th) ctx.drawImage(tile, 0, y);
    ctx.restore();
  } else {
    ctx.fillStyle = '#4b5060';
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Объекты (сортировка не нужна: всё лежит на дороге)
  for (const e of s.entities) {
    const img = sprites[e.kind];
    if (!img) continue;
    if (e.kind === 'coin') {
      const k = 1 + Math.sin(s.time * 7 + e.id * 1.7) * 0.06; // лёгкая «пульсация»
      ctx.drawImage(scaled(img, e.w * sc, e.h * sc), e.x - (e.w * k) / 2, e.y - (e.h * k) / 2, e.w * k, e.h * k);
    } else if (e.kind === 'magnet' || e.kind === 'shield' || e.kind === 'double' || e.kind === 'heart') {
      const pulse = 1 + Math.sin(s.time * 6) * 0.08;
      ctx.fillStyle = 'rgba(255,255,255,.35)'; // дешёвое свечение вместо shadowBlur
      ctx.beginPath();
      ctx.arc(e.x, e.y, (Math.max(e.w, e.h) / 2 + 6) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(scaled(img, e.w * sc, e.h * sc), e.x - (e.w * pulse) / 2, e.y - (e.h * pulse) / 2, e.w * pulse, e.h * pulse);
    } else {
      // мягкая тень под препятствием — кроме ям (яма вдавлена в асфальт, тени у неё быть не должно)
      if (e.kind !== 'hole-small' && e.kind !== 'hole-big') {
        ctx.fillStyle = 'rgba(0,0,0,.22)';
        ctx.beginPath();
        ctx.ellipse(e.x + 3, e.y + e.h * 0.42, e.w * 0.48, e.h * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.drawImage(scaled(img, e.w * sc, e.h * sc), e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
    }
  }

  // 3. Мишка
  const bear = sprites.bear;
  if (bear) {
    const blink = s.invulnLeft > 0 && Math.floor(s.invulnLeft * 12) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = blink ? 0.45 : 1;
    // тень
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath();
    ctx.ellipse(s.bearX + 4, cfg.bearY + BEAR.h * 0.05, BEAR.w * 0.5, BEAR.h * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(s.bearX, cfg.bearY);
    ctx.rotate(s.tilt * 0.22); // наклон в сторону поворота
    ctx.drawImage(scaled(bear, BEAR.w * sc, BEAR.h * sc), -BEAR.w / 2, -BEAR.h / 2, BEAR.w, BEAR.h);
    ctx.restore();

    if (s.shieldLeft > 0) {
      const fade = s.shieldLeft < 2 ? (Math.sin(s.time * 20) > 0 ? 1 : 0.35) : 1;
      ctx.save();
      ctx.globalAlpha = 0.55 * fade;
      const g = ctx.createRadialGradient(s.bearX, cfg.bearY, 20, s.bearX, cfg.bearY, 88);
      g.addColorStop(0, 'rgba(120,190,255,0)');
      g.addColorStop(0.85, 'rgba(120,190,255,.5)');
      g.addColorStop(1, 'rgba(255,255,255,.9)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(s.bearX, cfg.bearY, 62, 92, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (s.magnetLeft > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,90,90,.35)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -s.time * 40;
      ctx.beginPath();
      ctx.arc(s.bearX, cfg.bearY, cfg.magnetRadius * (0.9 + 0.05 * Math.sin(s.time * 5)), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
