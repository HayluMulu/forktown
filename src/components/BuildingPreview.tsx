import { useEffect, useRef } from 'react';
import { drawBuilding } from '../city/render';
import type { Place } from '../lib/schema';

export default function BuildingPreview({
  place,
  size = 140,
  night = false,
}: {
  place: Pick<Place, 'id' | 'building' | 'color' | 'decoration'>;
  size?: number;
  night?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * ratio;
    canvas.height = size * ratio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.imageSmoothingEnabled = false;
    const top = {
      cottage: 71,
      cafe: 62,
      bookshop: 80,
      greenhouse: 58,
      studio: 55,
      observatory: 88,
    }[place.building];
    const bottom = place.decoration === 'bench' ? 40 : 30;
    const scale = size / Math.max(115, top + bottom + 14);
    const baseline = (size - (top + bottom) * scale) / 2 + top * scale;
    drawBuilding(ctx, place, size / 2, baseline, night, scale);
  }, [place, size, night]);
  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
