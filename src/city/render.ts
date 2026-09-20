import type { Place, BuildingType } from '../lib/schema';
import { PLOTS, WORLD_SIZE, hash, isRoad, plotCenter, project, type Point } from '../lib/world';

type Ctx = CanvasRenderingContext2D;
type Palette = {
  grass: string;
  grassAlt: string;
  earth: string;
  edge: string;
  road: string;
  roadEdge: string;
  water: string;
  waterLight: string;
  leaf: string;
  leafLight: string;
  ink: string;
};
export type Camera = { x: number; y: number; zoom: number };
export const DAY: Palette = {
  grass: '#B9CF9B',
  grassAlt: '#B4CA94',
  earth: '#A99C70',
  edge: '#879B68',
  road: '#E4D9B9',
  roadEdge: '#C3BD95',
  water: '#A1C9C9',
  waterLight: '#C1DCDC',
  leaf: '#688F59',
  leafLight: '#87A66A',
  ink: '#4C6445',
};
export const NIGHT: Palette = {
  grass: '#526E63',
  grassAlt: '#4D685E',
  earth: '#3B514B',
  edge: '#344C43',
  road: '#829080',
  roadEdge: '#596F63',
  water: '#466E7B',
  waterLight: '#668F9B',
  leaf: '#365A4F',
  leafLight: '#507569',
  ink: '#C3D4C2',
};

function poly(ctx: Ctx, points: number[][], fill: string, stroke?: string) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
function rect(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  // Keep the result in hex: night colors receive another shading pass on roof faces.
  return (
    '#' +
    [n >> 16, (n >> 8) & 255, n & 255]
      .map((v) =>
        Math.max(0, Math.min(255, v + amount))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
function diamond(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string) {
  poly(
    ctx,
    [
      [x, y - ry],
      [x + rx, y],
      [x, y + ry],
      [x - rx, y],
    ],
    fill,
  );
}
function tree(ctx: Ctx, x: number, y: number, s: number, p: Palette, variant = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  diamond(ctx, 4, 3, 16, 7, '#23341B20');
  rect(ctx, -2, -12, 4, 15, '#867459');
  if (variant % 2) {
    poly(
      ctx,
      [
        [0, -43],
        [10, -28],
        [6, -28],
        [15, -15],
        [10, -15],
        [18, -4],
        [-18, -4],
        [-10, -15],
        [-15, -15],
        [-6, -28],
        [-10, -28],
      ],
      p.leaf,
    );
    poly(
      ctx,
      [
        [0, -43],
        [0, -4],
        [-18, -4],
        [-10, -15],
        [-15, -15],
        [-6, -28],
        [-10, -28],
      ],
      p.leafLight,
    );
  } else {
    poly(
      ctx,
      [
        [-5, -39],
        [7, -39],
        [7, -35],
        [14, -35],
        [14, -29],
        [19, -29],
        [19, -16],
        [14, -16],
        [14, -10],
        [-12, -10],
        [-12, -14],
        [-18, -14],
        [-18, -29],
        [-13, -29],
        [-13, -35],
        [-5, -35],
      ],
      p.leaf,
    );
    poly(
      ctx,
      [
        [-5, -39],
        [7, -39],
        [7, -35],
        [4, -35],
        [4, -28],
        [-3, -28],
        [-3, -19],
        [-13, -19],
        [-13, -24],
        [-18, -24],
        [-18, -29],
        [-13, -29],
        [-13, -35],
        [-5, -35],
      ],
      p.leafLight,
    );
    rect(ctx, -7, -31, 5, 4, shade(p.leafLight, 14));
  }
  ctx.restore();
}
function flowers(ctx: Ctx, x: number, y: number, seed: number) {
  const colors = ['#F0E6B1', '#E3A39A', '#F8F2D8'];
  for (let i = 0; i < 6; i++) {
    const px = x + (i % 3) * 5,
      py = y + Math.floor(i / 3) * 4;
    rect(ctx, px, py, 1, 4, '#78965D');
    rect(ctx, px - 1, py - 1, 3, 2, colors[(seed + i) % 3]);
  }
}
function bench(ctx: Ctx, x: number, y: number) {
  poly(
    ctx,
    [
      [x - 11, y - 6],
      [x + 8, y + 4],
      [x + 8, y + 8],
      [x - 11, y - 2],
    ],
    '#A08460',
  );
  poly(
    ctx,
    [
      [x - 11, y],
      [x + 8, y + 10],
      [x + 13, y + 7],
      [x - 6, y - 3],
    ],
    '#C7A87A',
  );
  rect(ctx, x - 9, y + 1, 2, 6, '#66725A');
  rect(ctx, x + 7, y + 9, 2, 6, '#66725A');
}
function windowPane(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  side: number,
  night: boolean,
) {
  const s = side * 0.5;
  poly(
    ctx,
    [
      [x, y],
      [x + w, y + w * s],
      [x + w, y + w * s + h],
      [x, y + h],
    ],
    night ? '#EDCE85' : '#628B92',
  );
  poly(
    ctx,
    [
      [x + 1, y + 1],
      [x + w - 1, y + (w - 1) * s + 1],
      [x + w - 1, y + (w - 1) * s + 3],
      [x + 1, y + 3],
    ],
    night ? '#FFEDB8' : '#A8C5BB',
  );
  ctx.strokeStyle = '#F0E7CE';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + (w / 2) * s);
  ctx.lineTo(x + w / 2, y + (w / 2) * s + h);
  ctx.stroke();
}
export function drawBuilding(
  ctx: Ctx,
  place: Pick<Place, 'building' | 'color' | 'decoration' | 'id'>,
  x: number,
  y: number,
  night = false,
  scale = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const p = night ? NIGHT : DAY;
  const h = (
    {
      cottage: 29,
      cafe: 31,
      bookshop: 49,
      greenhouse: 27,
      studio: 35,
      observatory: 39,
    } satisfies Record<BuildingType, number>
  )[place.building];
  const roof = night ? shade(place.color, -30) : place.color;
  const wall = night ? '#B9B6A0' : '#F0E5C8';
  diamond(ctx, 5, 7, 43, 20, '#38582E25');
  diamond(ctx, 0, 5, 34, 18, night ? '#8C9682' : '#DDD3B0');
  poly(
    ctx,
    [
      [-29, -h],
      [0, 15 - h],
      [0, 17],
      [-29, 2],
    ],
    place.building === 'greenhouse' ? (night ? '#7AACA0' : '#AED1BE') : wall,
  );
  poly(
    ctx,
    [
      [0, 15 - h],
      [29, -h],
      [29, 2],
      [0, 17],
    ],
    place.building === 'greenhouse'
      ? night
        ? '#507F7B'
        : '#8EB9AA'
      : night
        ? '#9B9E8E'
        : '#D6CCAC',
  );
  poly(
    ctx,
    [
      [-29, 1],
      [0, 16],
      [0, 19],
      [-29, 4],
    ],
    '#A99474',
  );
  poly(
    ctx,
    [
      [0, 16],
      [29, 1],
      [29, 4],
      [0, 19],
    ],
    '#988767',
  );
  if (place.building === 'studio') {
    poly(
      ctx,
      [
        [0, -h - 18],
        [33, -h - 1],
        [0, 16 - h],
        [-33, -h - 1],
      ],
      shade(roof, 8),
    );
    poly(
      ctx,
      [
        [-33, -h - 1],
        [0, 16 - h],
        [0, 20 - h],
        [-33, 3 - h],
      ],
      roof,
    );
    poly(
      ctx,
      [
        [0, 16 - h],
        [33, -h - 1],
        [33, 3 - h],
        [0, 20 - h],
      ],
      shade(roof, -23),
    );
    poly(
      ctx,
      [
        [-12, -h - 12],
        [1, -h - 5],
        [13, -h - 11],
        [0, -h - 18],
      ],
      '#BDD0C4',
    );
    windowPane(ctx, -24, -h + 10, 17, 17, 1, night);
    windowPane(ctx, 9, -h + 15, 13, 12, -1, night);
    rect(ctx, 19, -h - 14, 4, 12, '#A6A392');
    rect(ctx, 17, -h - 16, 8, 3, '#D2CAB3');
  } else if (place.building === 'observatory') {
    poly(
      ctx,
      [
        [0, -h - 16],
        [32, -h],
        [0, 17 - h],
        [-32, -h],
      ],
      shade(roof, -10),
    );
    poly(
      ctx,
      [
        [-26, -h],
        [-26, -h - 14],
        [-20, -h - 14],
        [-20, -h - 25],
        [-10, -h - 25],
        [-10, -h - 30],
        [6, -h - 30],
        [6, -h - 26],
        [18, -h - 26],
        [18, -h - 17],
        [26, -h - 17],
        [26, -h],
        [13, -h + 7],
        [-9, -h + 7],
      ],
      roof,
    );
    poly(
      ctx,
      [
        [-26, -h],
        [-26, -h - 14],
        [-20, -h - 14],
        [-20, -h - 25],
        [-10, -h - 25],
        [-10, -h - 30],
        [0, -h - 30],
        [0, -h + 7],
        [-9, -h + 7],
      ],
      shade(roof, 20),
    );
    rect(ctx, 1, -h - 26, 4, 30, shade(roof, -25));
    poly(
      ctx,
      [
        [8, -h - 27],
        [30, -h - 44],
        [35, -h - 38],
        [14, -h - 20],
      ],
      '#CACFC3',
    );
    poly(
      ctx,
      [
        [29, -h - 45],
        [35, -h - 40],
        [38, -h - 43],
        [32, -h - 48],
      ],
      '#576F73',
    );
    windowPane(ctx, -24, -h + 13, 9, 12, 1, night);
    windowPane(ctx, 13, -h + 17, 8, 12, -1, night);
  } else {
    poly(
      ctx,
      [
        [-32, -h],
        [0, 17 - h],
        [17, 8 - h - 21],
        [-15, -9 - h - 21],
      ],
      shade(roof, 14),
    );
    poly(
      ctx,
      [
        [0, -17 - h],
        [32, -h],
        [17, 8 - h - 21],
        [-15, -9 - h - 21],
      ],
      shade(roof, -16),
    );
    poly(
      ctx,
      [
        [0, 17 - h],
        [32, -h],
        [17, 8 - h - 21],
      ],
      roof,
    );
    poly(
      ctx,
      [
        [-32, -h],
        [-32, 3 - h],
        [0, 20 - h],
        [0, 17 - h],
      ],
      shade(roof, -12),
    );
    ctx.strokeStyle = shade(roof, -5);
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      ctx.beginPath();
      ctx.moveTo(-32 + 17 * t, -h - 30 * t);
      ctx.lineTo(32 * t, -h + 17 - 30 * t);
      ctx.stroke();
    }
    if (place.building === 'greenhouse') {
      for (let i = 0; i < 3; i++) {
        windowPane(ctx, -26 + i * 9, -h + 8 + i * 4.5, 7, 17, 1, night);
        windowPane(ctx, 3 + i * 8, 15 - h - i * 4, 6, 17, -1, night);
      }
      for (let i = 0; i < 3; i++) {
        rect(ctx, -22 + i * 10, 2 + i * 4, 5, 4, '#AA8964');
        rect(ctx, -21 + i * 10, -3 + i * 4, 3, 5, '#769A59');
      }
    } else {
      windowPane(ctx, -24, -h + 11, 8, 10, 1, night);
      windowPane(ctx, 12, -h + 17, 10, 11, -1, night);
      if (place.building === 'bookshop') {
        windowPane(ctx, -24, -h + 28, 9, 10, 1, night);
        windowPane(ctx, 12, -h + 33, 10, 11, -1, night);
        poly(
          ctx,
          [
            [-30, -9],
            [-5, 4],
            [-5, 9],
            [-30, -4],
          ],
          roof,
        );
        for (let i = 0; i < 5; i++)
          rect(ctx, -26 + i * 4, -5 + i * 2, 2, 3, ['#D1BC87', '#8CA49A', '#BD8080'][i % 3]);
      }
      poly(
        ctx,
        [
          [-12, -2],
          [-4, 2],
          [-4, 15],
          [-12, 11],
        ],
        '#8B7960',
      );
      rect(ctx, -7, 6, 1, 2, '#F1DCAF');
      if (place.building === 'cafe') {
        for (let i = 0; i < 7; i++) {
          const ax = -31 + i * 4.6,
            ay = -10 + i * 2.3;
          poly(
            ctx,
            [
              [ax, ay],
              [ax + 4.6, ay + 2.3],
              [ax + 0.6, ay + 8.3],
              [ax - 4, ay + 6],
            ],
            i % 2 ? wall : roof,
          );
          poly(
            ctx,
            [
              [ax - 4, ay + 6],
              [ax + 0.6, ay + 8.3],
              [ax + 0.6, ay + 12.3],
              [ax - 4, ay + 10],
            ],
            i % 2 ? '#E4D7BA' : shade(roof, -10),
          );
        }
        diamond(ctx, -33, 19, 8, 4, '#BCAB85');
        rect(ctx, -34, 19, 2, 8, '#8C7A5B');
        rect(ctx, -43, 17, 4, 4, roof);
        rect(ctx, -29, 26, 4, 4, roof);
      }
      if (place.building === 'cottage') {
        poly(
          ctx,
          [
            [-16, -h - 22],
            [-10, -h - 19],
            [-10, -h - 35],
            [-16, -h - 38],
          ],
          '#C4A487',
        );
        poly(
          ctx,
          [
            [-10, -h - 19],
            [-5, -h - 22],
            [-5, -h - 38],
            [-10, -h - 35],
          ],
          '#AA8C74',
        );
        poly(
          ctx,
          [
            [-17, -h - 38],
            [-10, -h - 34],
            [-4, -h - 38],
            [-11, -h - 42],
          ],
          '#DBC5A1',
        );
      }
    }
  }
  if (place.decoration === 'tree') tree(ctx, 38, 15, 0.68, p, hash(place.id));
  if (place.decoration === 'flowers') {
    flowers(ctx, -27, 19, hash(place.id));
    flowers(ctx, 17, 15, hash(place.id) + 1);
  }
  if (place.decoration === 'bench') bench(ctx, 30, 24);
  if (place.decoration === 'mailbox') {
    rect(ctx, 31, 15, 2, 12, '#967957');
    poly(
      ctx,
      [
        [27, 12],
        [34, 15],
        [38, 12],
        [31, 9],
      ],
      roof,
    );
    poly(
      ctx,
      [
        [27, 12],
        [34, 15],
        [34, 20],
        [27, 17],
      ],
      shade(roof, -10),
    );
    rect(ctx, 34, 10, 1, 6, '#BD8170');
  }
  ctx.restore();
}

type RenderOptions = {
  ctx: Ctx;
  width: number;
  height: number;
  camera: Camera;
  places: Place[];
  selectedPlot: string | null;
  hoveredPlot: string | null;
  night: boolean;
  showPlots: boolean;
};
export function renderCity({
  ctx,
  width,
  height,
  camera,
  places,
  selectedPlot,
  hoveredPlot,
  night,
  showPlots,
}: RenderOptions) {
  ctx.clearRect(0, 0, width, height);
  const p = night ? NIGHT : DAY;
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  const byPlot = new Map(places.map((place) => [place.plot, place]));
  const terrainPoint = (x: number, y: number) => project(x, y);
  const b = terrainPoint(WORLD_SIZE, 0),
    c = terrainPoint(WORLD_SIZE, WORLD_SIZE),
    d = terrainPoint(0, WORLD_SIZE);
  poly(
    ctx,
    [
      [d.x, d.y],
      [c.x, c.y],
      [c.x, c.y + 16],
      [d.x, d.y + 16],
    ],
    p.earth,
  );
  poly(
    ctx,
    [
      [b.x, b.y],
      [c.x, c.y],
      [c.x, c.y + 16],
      [b.x, b.y + 16],
    ],
    p.edge,
  );
  diamond(ctx, 0, c.y / 2, WORLD_SIZE * 38, WORLD_SIZE * 19, p.grass);
  for (let x = 0; x < WORLD_SIZE; x++)
    for (let y = 0; y < WORLD_SIZE; y++) {
      const pt = project(x + 0.5, y + 0.5);
      const seed = hash(`${x},${y}`);
      if (seed % 4 === 0) diamond(ctx, pt.x, pt.y, 38, 19, p.grassAlt);
      if (x === 17 || (x === 18 && y < 8)) {
        diamond(ctx, pt.x, pt.y, 38, 19, p.water);
        rect(ctx, pt.x - 12 + (seed % 16), pt.y, 12, 1, p.waterLight);
        if (y % 3 === 0) rect(ctx, pt.x + 3, pt.y + 6, 7, 1, p.waterLight);
      } else if (isRoad(x, y)) {
        diamond(ctx, pt.x, pt.y, 38, 19, p.roadEdge);
        diamond(ctx, pt.x, pt.y - 1, 36, 18, p.road);
        if (seed % 3 === 0) rect(ctx, pt.x + (seed % 10) - 5, pt.y + 4, 2, 1, p.roadEdge);
      } else if (seed % 2) {
        for (let k = 0; k < 3; k++) {
          const gx = pt.x - 19 + ((seed >> (k * 3)) % 35),
            gy = pt.y - 5 + ((seed >> (k * 2)) % 10);
          rect(ctx, gx, gy, 2, 2, night ? '#638171' : '#A4BE81');
        }
      }
    }
  // Stable plot IDs keep existing contributions in place as the town grows.
  for (const plot of PLOTS) {
    const pt = plotCenter(plot);
    const occupied = byPlot.has(plot.id);
    const active = selectedPlot === plot.id;
    const hover = hoveredPlot === plot.id;
    if (active || hover) diamond(ctx, pt.x, pt.y + 3, 57, 28, night ? '#B5C59B70' : '#F4EDCD');
    if (!occupied) {
      const corners = [
        [pt.x, pt.y - 19],
        [pt.x + 38, pt.y],
        [pt.x, pt.y + 19],
        [pt.x - 38, pt.y],
      ];
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = active || hover ? p.ink : night ? '#ABC6B850' : '#69885A55';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      corners.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      if (showPlots || hover || active) {
        ctx.fillStyle = p.ink;
        ctx.font = '10px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(plot.id, pt.x, pt.y + 4);
      } else {
        rect(ctx, pt.x - 3, pt.y, 6, 1, night ? '#ABC6B870' : '#69885A70');
        rect(ctx, pt.x, pt.y - 3, 1, 6, night ? '#ABC6B870' : '#69885A70');
      }
    }
  }
  const objects: { depth: number; paint: () => void }[] = [];
  for (let x = 0; x < WORLD_SIZE; x++)
    for (let y = 0; y < WORLD_SIZE; y++) {
      const seed = hash(`tree${x},${y}`);
      const pt = project(x + 0.5, y + 0.5);
      if ((x === 0 || y === 0 || y >= 17 || (x === 18 && y >= 9)) && seed % 3 !== 0) {
        objects.push({
          depth: x + y,
          paint: () => tree(ctx, pt.x + (seed % 15) - 7, pt.y, 1 + (seed % 5) * 0.12, p, seed),
        });
      }
      if (x < 17 && y < 17 && !isRoad(x, y) && x % 3 === 0 && y % 3 === 0 && seed % 2) {
        objects.push({ depth: x + y, paint: () => tree(ctx, pt.x, pt.y, 0.65, p, seed) });
      }
    }
  for (const place of places) {
    const plot = PLOTS.find((v) => v.id === place.plot);
    if (!plot) continue;
    const pt = plotCenter(plot);
    objects.push({
      depth: plot.x + plot.y + 0.8,
      paint: () => drawBuilding(ctx, place, pt.x, pt.y, night, 1.12),
    });
  }
  for (const [x, y] of [
    [4, 7],
    [10, 4],
    [13, 10],
    [7, 13],
  ]) {
    const pt = project(x + 0.5, y + 0.5);
    objects.push({
      depth: x + y,
      paint: () => {
        rect(ctx, pt.x, pt.y - 29, 2, 30, night ? '#637266' : '#8B9073');
        rect(ctx, pt.x - 3, pt.y - 33, 8, 6, night ? '#F4D79A' : '#EDE5C1');
        rect(ctx, pt.x - 4, pt.y - 35, 10, 2, night ? '#7A8C7D' : '#748269');
        if (night) {
          const glow = ctx.createRadialGradient(pt.x + 1, pt.y - 30, 0, pt.x + 1, pt.y - 30, 24);
          glow.addColorStop(0, '#FFDA8030');
          glow.addColorStop(1, '#FFDA8000');
          ctx.fillStyle = glow;
          ctx.fillRect(pt.x - 24, pt.y - 55, 50, 50);
        }
      },
    });
  }
  // A few residents and objects make the founding neighborhood feel inhabited.
  for (const [x, y, color] of [
    [7.3, 5.1, '#B46F69'],
    [10.2, 9.5, '#8186AA'],
    [4.3, 9, '#D4AA64'],
    [12, 7.4, '#719199'],
  ] as const) {
    const pt = project(x, y);
    objects.push({
      depth: x + y,
      paint: () => {
        diamond(ctx, pt.x, pt.y + 1, 4, 2, '#31442E30');
        rect(ctx, pt.x - 2, pt.y - 8, 4, 6, color);
        rect(ctx, pt.x - 2, pt.y - 12, 4, 4, '#D9B68B');
        rect(ctx, pt.x - 2, pt.y - 13, 4, 2, '#675A48');
        rect(ctx, pt.x - 2, pt.y - 2, 1, 3, '#5C6554');
        rect(ctx, pt.x + 1, pt.y - 2, 1, 3, '#5C6554');
      },
    });
  }
  objects.sort((a, b) => a.depth - b.depth).forEach((object) => object.paint());
  ctx.restore();
}

export function buildingHit(point: Point, places: Place[]): string | undefined {
  // Frontmost buildings win when their silhouettes overlap.
  const ordered = places
    .map((place) => ({ place, plot: PLOTS.find((p) => p.id === place.plot)! }))
    .filter((v) => v.plot)
    .sort((a, b) => b.plot.x + b.plot.y - (a.plot.x + a.plot.y));
  for (const { place, plot } of ordered) {
    const p = plotCenter(plot);
    const tall = place.building === 'observatory' ? 104 : place.building === 'bookshop' ? 88 : 76;
    if (point.x >= p.x - 38 && point.x <= p.x + 38 && point.y >= p.y - tall && point.y <= p.y + 20)
      return plot.id;
  }
}
