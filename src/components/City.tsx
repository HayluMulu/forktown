import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Crosshair, Minus, Plus, MapPin } from 'lucide-react';
import { buildingHit, renderCity, type Camera } from '../city/render';
import { findPlotAt, getPlot, plotCenter, unproject } from '../lib/world';
import type { Place } from '../lib/schema';

export type CityHandle = { focus: (plotId: string) => void; reset: () => void };
type Props = {
  places: Place[];
  selectedPlot: string | null;
  onSelect: (plotId: string) => void;
  night: boolean;
  showPlots: boolean;
};

const City = forwardRef<CityHandle, Props>(function City(
  { places, selectedPlot, onSelect, night, showPlots },
  ref,
) {
  const wrapper = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 900, height: 580 });
  const [camera, setCamera] = useState<Camera>({ x: 450, y: 40, zoom: 0.57 });
  const [hover, setHover] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [tip, setTip] = useState({ x: 0, y: 0 });
  const pointer = useRef<{
    id: number;
    x: number;
    y: number;
    cx: number;
    cy: number;
    moved: boolean;
  } | null>(null);
  const fit = useRef(0.57);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const defaultCamera = useCallback((width: number, height: number): Camera => {
    const zoom = Math.max(0.3, Math.min((width - 52) / 1480, (height - 85) / 820));
    fit.current = zoom;
    return { x: width / 2, y: (height - 722 * zoom) / 2 + 28, zoom };
  }, []);
  const reset = useCallback(
    () => setCamera(defaultCamera(size.width, size.height)),
    [defaultCamera, size],
  );
  useImperativeHandle(
    ref,
    () => ({
      reset,
      focus: (id) => {
        const plot = getPlot(id);
        if (!plot) return;
        const pt = plotCenter(plot);
        const zoom = Math.max(fit.current, Math.min(0.85, fit.current * 1.35));
        setCamera({
          x: size.width / 2 - pt.x * zoom,
          y: size.height / 2 - (pt.y - 35) * zoom,
          zoom,
        });
      },
    }),
    [reset, size],
  );
  useEffect(() => {
    if (!wrapper.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width,
        height = entry.contentRect.height;
      setSize({ width, height });
      setCamera(defaultCamera(width, height));
    });
    observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, [defaultCamera]);
  const zoomBy = useCallback(
    (factor: number, anchor?: { x: number; y: number }) => {
      setCamera((old) => {
        const zoom = Math.max(fit.current * 0.65, Math.min(fit.current * 3.5, old.zoom * factor));
        const a = anchor ?? { x: size.width / 2, y: size.height / 2 };
        return {
          x: a.x - ((a.x - old.x) * zoom) / old.zoom,
          y: a.y - ((a.y - old.y) * zoom) / old.zoom,
          zoom,
        };
      });
    },
    [size],
  );
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = el.getBoundingClientRect();
      zoomBy(Math.exp(-event.deltaY * 0.0015), {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [zoomBy]);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    el.width = size.width * ratio;
    el.height = size.height * ratio;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = false;
    renderCity({
      ctx,
      width: size.width,
      height: size.height,
      camera,
      places,
      selectedPlot,
      hoveredPlot: hover,
      night,
      showPlots,
    });
  }, [size, camera, places, selectedPlot, hover, night, showPlots]);
  const hit = (clientX: number, clientY: number) => {
    const bounds = canvas.current!.getBoundingClientRect();
    const local = { x: clientX - bounds.left, y: clientY - bounds.top };
    const current = cameraRef.current;
    const world = {
      x: (local.x - current.x) / current.zoom,
      y: (local.y - current.y) / current.zoom,
    };
    const ground = unproject(world.x, world.y);
    return { id: buildingHit(world, places) ?? findPlotAt(ground.x, ground.y)?.id ?? null, local };
  };
  const hoveredPlace = places.find((place) => place.plot === hover);
  return (
    <div
      ref={wrapper}
      className={`city-stage ${night ? 'is-night' : ''} ${dragging ? 'is-dragging' : ''}`}
    >
      <canvas
        ref={canvas}
        role="img"
        tabIndex={0}
        aria-label="Interactive Forktown map. Drag to pan, scroll or use plus and minus to zoom. Arrow keys move the map; Home resets it. Use the neighborhood list to select places with a keyboard."
        onKeyDown={(event) => {
          const moves: Record<string, [number, number]> = {
            ArrowLeft: [35, 0],
            ArrowRight: [-35, 0],
            ArrowUp: [0, 35],
            ArrowDown: [0, -35],
          };
          if (moves[event.key]) {
            event.preventDefault();
            const [x, y] = moves[event.key];
            setCamera((old) => ({ ...old, x: old.x + x, y: old.y + y }));
          }
          if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            zoomBy(1.2);
          }
          if (event.key === '-') {
            event.preventDefault();
            zoomBy(1 / 1.2);
          }
          if (event.key === 'Home') {
            event.preventDefault();
            reset();
          }
        }}
        onPointerDown={(event) => {
          if (pointer.current || event.button !== 0) return;
          pointer.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            cx: camera.x,
            cy: camera.y,
            moved: false,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (pointer.current && pointer.current.id === event.pointerId) {
            const p = pointer.current,
              dx = event.clientX - p.x,
              dy = event.clientY - p.y;
            if (Math.abs(dx) + Math.abs(dy) > 5) p.moved = true;
            if (p.moved) {
              setDragging(true);
              setHover(null);
              setCamera((old) => ({ ...old, x: p.cx + dx, y: p.cy + dy }));
            }
          } else {
            const { id, local } = hit(event.clientX, event.clientY);
            setHover(id);
            setTip(local);
          }
        }}
        onPointerUp={(event) => {
          const p = pointer.current;
          if (!p || p.id !== event.pointerId) return;
          if (!p.moved) {
            const { id } = hit(event.clientX, event.clientY);
            if (id) onSelect(id);
          }
          pointer.current = null;
          setDragging(false);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          pointer.current = null;
          setDragging(false);
        }}
        onPointerLeave={() => setHover(null)}
      />
      <div className="map-location">
        <span className="live-dot" /> The founding neighborhood{' '}
        <span className="map-location-divider">/</span> <span>01</span>
      </div>
      <div className="compass" aria-hidden="true">
        <span>N</span>
        <div>↑</div>
      </div>
      {hover && !dragging && (
        <div
          className="map-tooltip"
          style={{
            left: Math.max(10, Math.min(size.width - 205, tip.x + 14)),
            top: Math.max(55, Math.min(size.height - 90, tip.y - 60)),
          }}
        >
          <MapPin size={13} />
          <span>{hoveredPlace?.name ?? `Plot ${hover} · Make it yours`}</span>
        </div>
      )}
      <div className="map-help">
        <span className="mouse-mark" aria-hidden="true" /> Drag to wander <span>·</span> Scroll to
        zoom
      </div>
      <div className="map-controls">
        <button aria-label="Zoom in" onClick={() => zoomBy(1.2)}>
          <Plus size={17} />
        </button>
        <span aria-label={`Zoom ${Math.round((camera.zoom / fit.current) * 100)} percent`}>
          {Math.round((camera.zoom / fit.current) * 100)}%
        </span>
        <button aria-label="Zoom out" onClick={() => zoomBy(1 / 1.2)}>
          <Minus size={17} />
        </button>
        <span className="control-divider" />
        <button aria-label="Reset map view" onClick={reset}>
          <Crosshair size={17} />
        </button>
      </div>
    </div>
  );
});
export default City;
