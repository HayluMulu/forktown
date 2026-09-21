import type { CinemaFilm, CinemaSlot } from '../lib/cinema';

type Ctx = CanvasRenderingContext2D;
const W = 320,
  H = 180;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};
function box(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
function oval(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function words(ctx: Ctx, text: string, y: number, size = 10, color = '#FFF2D0') {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px "Space Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
}
function star(ctx: Ctx, x: number, y: number, color = '#FFE4A0', size = 2) {
  box(ctx, x - size, y, size * 2 + 1, 1, color);
  box(ctx, x, y - size, 1, size * 2 + 1, color);
}
function nightSky(ctx: Ctx, seconds: number) {
  box(ctx, 0, 0, W, H, '#202D48');
  for (let i = 0; i < 28; i++)
    star(
      ctx,
      (i * 73 + 17) % W,
      (i * 31 + 9) % 100,
      i % 3 ? '#8B9AAE' : '#FFE5AC',
      1 + Math.round((Math.sin(seconds * 0.4 + i) + 1) / 2),
    );
}
function heart(ctx: Ctx, x: number, y: number, color = '#ED9B9E') {
  box(ctx, x - 4, y - 2, 3, 2, color);
  box(ctx, x + 1, y - 2, 3, 2, color);
  box(ctx, x - 5, y, 10, 3, color);
  box(ctx, x - 3, y + 3, 6, 2, color);
  box(ctx, x - 1, y + 5, 2, 2, color);
}
function kernel(ctx: Ctx, x: number, y: number, size = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  box(ctx, -6, -7, 12, 10, '#FFF0BE');
  box(ctx, -3, -11, 7, 7, '#FFF5D7');
  box(ctx, -9, -5, 5, 7, '#FFF5D7');
  box(ctx, 4, -6, 5, 7, '#E6C58F');
  box(ctx, -3, 1, 7, 4, '#D4A963');
  box(ctx, -3, -4, 2, 2, '#4C4B41');
  box(ctx, 3, -4, 2, 2, '#4C4B41');
  ctx.restore();
}
function popcorn(ctx: Ctx, p: number, seconds: number) {
  box(ctx, 0, 0, W, H, '#674856');
  box(ctx, 22, 16, 276, 111, '#BC7773');
  for (let x = 0; x < W; x += 18) box(ctx, x, 0, 9, 28 + (x % 3) * 4, '#823C50');
  box(ctx, 0, 133, W, 47, '#493D4D');
  box(ctx, 0, 126, W, 7, '#E1B285');
  box(ctx, 31, 91, 45, 35, '#8DA4A0');
  box(ctx, 27, 92, 53, 5, '#D3DDD0');
  box(ctx, 39, 119, 28, 6, '#556F71');
  const rumble = p < 0.25 ? Math.sin(seconds * 10) * p * 5 : 0;
  const lidLift = Math.sin(clamp(p / 0.32) * Math.PI) * 32;
  box(ctx, 29 + rumble, 87 - lidLift, 49, 5, '#D4DED0');
  box(ctx, 47 + rumble, 82 - lidLift, 13, 5, '#637E7C');
  // The runaway's arc ends back inside the bucket, rather than resetting mid-story.
  const escape = ease((p - 0.18) / 0.52);
  const x = 55 + escape * 197;
  const bounce =
    p < 0.2 ? 0 : Math.abs(Math.sin((p - 0.2) * Math.PI * 8)) * (1 - ease((p - 0.72) / 0.15)) * 32;
  const y = p < 0.2 ? 106 - ease(p / 0.2) * 40 : 119 - bounce - ease((p - 0.68) / 0.2) * 32;
  for (let i = 0; i < 5; i++) kernel(ctx, 238 + (i % 3) * 11, 101 - Math.floor(i / 3) * 9, 0.7);
  box(ctx, 230, 101, 45, 25, '#FFF0D0');
  for (let i = 0; i < 4; i++) box(ctx, 232 + i * 12, 103, 5, 21, '#D46466');
  box(ctx, 229, 99, 48, 4, '#F7D699');
  kernel(ctx, x, y, 1.1);
  if (p > 0.87) {
    heart(ctx, 252, 67 - Math.sin(seconds) * 2);
    words(ctx, 'EVERY POP BELONGS.', 162, 10);
  } else
    words(ctx, p < 0.24 ? 'A very small beginning...' : '...and a very big adventure.', 162, 9);
}
function cat(ctx: Ctx, x: number, y: number, curled = false) {
  ctx.save();
  ctx.translate(x, y);
  box(ctx, -15, -15, 26, 13, '#D4A573');
  box(ctx, -10, -18, 19, 5, '#D4A573');
  box(ctx, 5, -27, 15, 15, '#D4A573');
  box(ctx, 5, -32, 4, 7, '#D4A573');
  box(ctx, 16, -32, 4, 7, '#D4A573');
  box(ctx, -20, -22, 6, 15, '#B38059');
  box(ctx, -24, -24, 10, 5, '#B38059');
  box(ctx, -7, -15, 3, 9, '#A77852');
  box(ctx, 0, -15, 3, 9, '#A77852');
  box(ctx, 9, -22, 2, curled ? 1 : 3, '#35434A');
  box(ctx, 16, -22, 2, curled ? 1 : 3, '#35434A');
  box(ctx, 14, -17, 3, 2, '#F2D2B0');
  if (!curled) {
    box(ctx, -11, -3, 5, 4, '#B38059');
    box(ctx, 5, -3, 5, 4, '#B38059');
  }
  ctx.restore();
}
function moon(ctx: Ctx, p: number, seconds: number) {
  nightSky(ctx, seconds);
  for (let i = 0; i < 6; i++) {
    const top = 115 + (i % 3) * 9;
    box(ctx, i * 60 - 9, top, 54, H - top, '#394760');
    box(ctx, i * 60 - 13, top - 6, 62, 7, '#657186');
    box(ctx, i * 60 + 10, top + 12, 7, 9, '#E7C47D');
  }
  const adventure = Math.sin(clamp((p - 0.15) / 0.7) * Math.PI);
  const moonX = 248 - adventure * 65,
    moonY = 40 + adventure * 20;
  oval(ctx, moonX, moonY, 23, 23, '#FFE5A0');
  oval(ctx, moonX - 9, moonY - 7, 21, 21, '#202D48');
  for (let i = 0; i < 3; i++) {
    const x = 106 + i * 39,
      y = 110 - i * 23;
    box(ctx, x, y + Math.sin(seconds + i) * 2, 30, 6, '#78899F');
    box(ctx, x + 6, y - 3 + Math.sin(seconds + i) * 2, 17, 5, '#B3BCC4');
  }
  const jump = Math.sin(clamp((p - 0.16) / 0.65) * Math.PI);
  cat(ctx, 72 + jump * 117, 113 - jump * 46, p > 0.86);
  if (p > 0.56 && p < 0.87)
    for (let i = 0; i < 8; i++) {
      const fall = clamp((p - 0.56) / 0.31);
      star(ctx, moonX - 12 + i * 8 - fall * 30, moonY + 22 + fall * (30 + i * 4), '#FFE8AC', 2);
    }
  words(
    ctx,
    p < 0.2
      ? 'Some friends are a little farther away.'
      : p > 0.86
        ? 'GOODNIGHT, LITTLE MOON.'
        : 'Almost... almost...',
    166,
    p < 0.2 ? 8 : 10,
  );
  if (p > 0.86) heart(ctx, 100, 66);
}
function filmDuck(ctx: Ctx, x: number, y: number, size: number, seconds: number, surprise = false) {
  ctx.save();
  ctx.translate(x, y - Math.abs(Math.sin(seconds * 5)) * 2);
  ctx.scale(size, size);
  box(ctx, -12, -13, 23, 11, '#F4D078');
  box(ctx, 7, -24, 12, 17, '#F4D078');
  box(ctx, 17, -17, 8, 4, '#DE9350');
  box(ctx, 14, -21, 2, 2, '#374D46');
  box(ctx, -7, -10, 12, 5, '#D8AD59');
  box(ctx, -9, -1, 6, 3, '#C18848');
  box(ctx, 5, -1, 6, 3, '#C18848');
  if (surprise) {
    box(ctx, 6, -39, 3, 7, '#927157');
    box(ctx, 6, -29, 3, 2, '#927157');
  }
  ctx.restore();
}
function duckling(ctx: Ctx, p: number, seconds: number) {
  box(ctx, 0, 0, W, H, '#C8DCC3');
  box(ctx, 0, 89, W, 91, '#95B4A1');
  box(ctx, 0, 117, W, 26, '#E4D8AC');
  box(ctx, 0, 148, W, 32, '#71A5AA');
  for (let i = 0; i < 12; i++)
    box(ctx, (i * 43 + seconds * 2) % W, 154 + (i % 3) * 7, 13, 1, '#B5D6CC');
  for (let i = 0; i < 6; i++) {
    const x = i * 63 + 7;
    box(ctx, x, 91, 2, 24, '#5C826A');
    box(ctx, x - 4, 89, 10, 4, '#DBA18D');
  }
  const family = 140 + ease(p / 0.72) * 120;
  filmDuck(ctx, family, 128, 1.05, seconds);
  for (let i = 1; i <= 3; i++) filmDuck(ctx, family - i * 25, 130, 0.6, seconds - i * 0.2);
  const lag =
    p < 0.2 ? 0 : p < 0.58 ? ease((p - 0.2) / 0.38) * 57 : (1 - ease((p - 0.58) / 0.32)) * 57;
  const x = family - 100 - lag;
  filmDuck(
    ctx,
    x,
    131 - (p > 0.58 && p < 0.68 ? Math.sin(((p - 0.58) / 0.1) * Math.PI) * 10 : 0),
    0.6,
    p > 0.58 ? seconds * 1.7 : p > 0.2 ? 0 : seconds,
    p > 0.55 && p < 0.7,
  );
  if (p < 0.7) {
    const bx = x + 17 + Math.sin(seconds * 1.3) * 12,
      by = 88 + Math.sin(seconds) * 8;
    const flap = 3 + Math.abs(Math.sin(seconds * 8)) * 4;
    box(ctx, bx - flap, by - 4, flap, 7, '#C28CB5');
    box(ctx, bx + 2, by - 4, flap, 7, '#E6ABBC');
    box(ctx, bx, by - 3, 2, 8, '#6D607A');
  }
  if (p > 0.9) heart(ctx, x, 93);
  words(
    ctx,
    p < 0.25
      ? 'Ooh. A butterfly!'
      : p < 0.58
        ? 'Just one more look...'
        : p < 0.9
          ? 'WAIT FOR ME!'
          : 'TOGETHER IS BETTER.',
    28,
    11,
    '#365C57',
  );
}

/** Original silent shorts, drawn locally at any point in their own timeline. */
export function drawCinemaFilm(ctx: Ctx, film: CinemaFilm, elapsed: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  const p = clamp((elapsed - 3) / (film.duration - 6));
  ({ popcorn, moon, duckling })[film.artwork](ctx, p, elapsed);
  if (elapsed < 3 || elapsed >= film.duration - 3) {
    box(ctx, 12, 52, 296, 63, '#293A48');
    words(ctx, elapsed < 3 ? 'FORKTOWN PICTURE HOUSE' : 'THE END', 70, 8, '#E5B97D');
    words(ctx, film.title, 92, 12);
    words(
      ctx,
      elapsed < 3 ? 'an original little story' : 'made for a little town',
      106,
      7,
      '#ADBFBA',
    );
  }
  ctx.restore();
}

export function drawCinemaCard(ctx: Ctx, slot?: CinemaSlot, seconds = 0) {
  nightSky(ctx, seconds);
  for (let i = 0; i < 4; i++)
    box(
      ctx,
      146 - i * 5,
      51 + i * 7,
      28 + i * 10,
      6,
      ['#92AD8D', '#ABC29B', '#789D80', '#567E6C'][i],
    );
  box(ctx, 157, 77, 6, 12, '#C7B68C');
  words(ctx, 'forktown.', 111, 21);
  words(ctx, 'STARLIGHT CINEMA', 128, 8, '#DBBF89');
  words(
    ctx,
    !slot
      ? 'THREE LITTLE FILMS · TONIGHT 20:30'
      : slot.kind === 'closing'
        ? 'THANK YOU. GET HOME UNDER THE STARS.'
        : slot.kind === 'opening'
          ? 'SETTLE IN. THE SHOW IS ABOUT TO BEGIN.'
          : 'A LITTLE BREATHER. ONE MORE STORY.',
    151,
    7,
    '#ADBFBA',
  );
  if (slot?.nextFilm) words(ctx, `NEXT: ${slot.nextFilm.title}`, 167, 8);
}
