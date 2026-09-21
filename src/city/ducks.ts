import type { TownDuck } from '../lib/ducks';
import { project } from '../lib/world';

export function drawDuck(ctx: CanvasRenderingContext2D, duck: TownDuck, night: boolean) {
  const point = project(duck.position.x, duck.position.y);
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.globalAlpha *= duck.opacity;
  ctx.scale(duck.adult ? 1 : 0.65, duck.adult ? 1 : 0.65);
  if (duck.swimming) {
    ctx.strokeStyle = night ? '#8BAFB7' : '#E0EEEE';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 1, 13, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#23341B25';
    ctx.beginPath();
    ctx.ellipse(0, 1, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.scale(duck.left ? -1 : 1, 1);
  const antic = duck.antic;
  const scurry = antic?.kind === 'scurry';
  const paused = antic?.kind === 'peck' || antic?.kind === 'notice' || antic?.kind === 'hop';
  const hop = antic?.kind === 'hop' ? Math.sin(antic.progress * Math.PI) : 0;
  const bustle = scurry ? Math.sin(antic.progress * Math.PI * 2) ** 2 : 0;
  if (scurry) {
    // Tiny dust puffs stay at ground level while the duckling bounces above them.
    ctx.fillStyle = night ? '#A9B5A0' : '#F5E9C6';
    for (let i = 0; i < 3; i++) {
      const puff = (antic.progress * 8 + i / 3) % 1;
      ctx.globalAlpha = duck.opacity * (1 - puff) * bustle;
      ctx.fillRect(-12 - puff * 15, -2 - puff * 4 + (i % 2), 3 + puff * 2, 2);
    }
    ctx.globalAlpha = duck.opacity;
  }
  if (antic?.kind === 'notice' || antic?.kind === 'hop') {
    // A readable pixel exclamation mark: "Wait for me!"
    ctx.fillStyle = night ? '#FFE6A3' : '#B77B42';
    ctx.fillRect(0, -36 - hop * 6, 3, 7);
    ctx.fillRect(0, -27 - hop * 6, 3, 2);
  }
  if (antic?.kind === 'proud') {
    ctx.fillStyle = '#FFF4C5';
    for (const side of [-1, 1]) {
      const x = side * (12 + antic.progress * 7),
        y = -23 - antic.progress * 8;
      ctx.globalAlpha = duck.opacity * Math.sin(antic.progress * Math.PI);
      ctx.fillRect(x - 3, y, 7, 1);
      ctx.fillRect(x, y - 3, 1, 7);
    }
    ctx.globalAlpha = duck.opacity;
  }
  // Leave the shadow grounded, and lift the entire duck (including its feet) for the hop.
  ctx.translate(0, -hop * 11 - (scurry ? Math.abs(duck.stride) * 2 * bustle : 0));
  if (scurry) ctx.rotate((0.14 + duck.stride * 0.08) * Math.sin(antic.progress * Math.PI));
  if (antic?.kind === 'hop') ctx.scale(1 - hop * 0.1, 1 + hop * 0.12);
  if (!duck.swimming) {
    const step = paused ? 0 : Math.round(duck.stride * (scurry ? 3 : 2));
    ctx.fillStyle = '#BC7739';
    ctx.fillRect(-5 + step, -2, 4, 3);
    ctx.fillRect(3 - step, -2, 4, 3);
  }
  ctx.translate(0, duck.swimming ? 2 : paused ? 0 : -Math.round(Math.abs(duck.stride)));
  ctx.fillStyle = duck.adult ? '#D2B17B' : '#F3D66D';
  ctx.fillRect(-10, -10, 18, 8);
  ctx.fillRect(-8, -12, 14, 4);
  ctx.fillRect(-13, -12, 5, 5);
  ctx.fillStyle = duck.adult ? '#A17D53' : '#DDB652';
  if (scurry || antic?.kind === 'hop') {
    const flap = scurry ? Math.sin(antic.progress * Math.PI * 18) : hop;
    ctx.fillRect(-7, -11 - flap * 4, 9, 4);
    ctx.fillRect(-10, -12 - flap * 5, 5, 3);
  } else {
    ctx.fillRect(-6, -9, 9, 4);
    ctx.fillRect(-4, -5, 6, 2);
  }
  ctx.save();
  if (antic?.kind === 'peck') {
    const dip = Math.sin(antic.progress * Math.PI * 2) ** 2;
    ctx.translate(3, -9);
    ctx.rotate(dip * 0.85);
    ctx.translate(-3, 9 + dip * 6);
  }
  if (antic?.kind === 'notice') ctx.translate(0, -2 * Math.sin(antic.progress * Math.PI));
  ctx.fillStyle = duck.adult ? '#D2B17B' : '#F3D66D';
  ctx.fillRect(3, -18, 9, 12);
  ctx.fillRect(5, -20, 6, 3);
  ctx.fillStyle = duck.adult ? '#EEE0B8' : '#FFF0AC';
  ctx.fillRect(5, -11, 5, 4);
  ctx.fillStyle = '#DF9446';
  ctx.fillRect(11, -14, 6, 3);
  ctx.fillStyle = '#29392F';
  ctx.fillRect(9, -17, 2, 2);
  ctx.restore();
  ctx.restore();
}
