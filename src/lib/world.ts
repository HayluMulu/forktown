export type Point = { x: number; y: number };
export type Plot = { id: string; col: number; row: number; x: number; y: number };
export const TILE_W = 76;
export const TILE_H = 38;
export const WORLD_SIZE = 19;
export const PLOTS: Plot[] = Array.from({ length: 25 }, (_, i) => ({
  id: `${String.fromCharCode(65 + Math.floor(i / 5))}${(i % 5) + 1}`,
  col: i % 5,
  row: Math.floor(i / 5),
  x: 2 + (i % 5) * 3,
  y: 2 + Math.floor(i / 5) * 3,
}));
export const getPlot = (id: string) => PLOTS.find((plot) => plot.id === id);
export const project = (x: number, y: number): Point => ({
  x: ((x - y) * TILE_W) / 2,
  y: ((x + y) * TILE_H) / 2,
});
export const unproject = (x: number, y: number): Point => ({
  x: x / TILE_W + y / TILE_H,
  y: y / TILE_H - x / TILE_W,
});
export const plotCenter = (plot: Plot): Point => project(plot.x + 0.5, plot.y + 0.5);
export const isRoad = (x: number, y: number) =>
  x >= 1 && x <= 16 && y >= 1 && y <= 16 && (x % 3 === 1 || y % 3 === 1);
export function findPlotAt(x: number, y: number): Plot | undefined {
  return PLOTS.find(
    (plot) => x >= plot.x - 0.1 && x <= plot.x + 1.4 && y >= plot.y - 0.1 && y <= plot.y + 1.4,
  );
}
export function hash(value: string): number {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return result >>> 0;
}
