import { useRef, useState } from "react";
import { clampCrop, MAX_ZOOM, MIN_ZOOM, type PortraitCrop } from "@/lib/card-data";

// The badge's portrait frame, from HackerCard. The cropper mirrors this ratio
// so what you drag here is exactly what lands on the card.
const FRAME_W = 372;
const FRAME_H = 452;

type Props = {
  src: string;
  crop: PortraitCrop;
  onChange: (crop: PortraitCrop) => void;
};

type Gesture =
  | { kind: "drag"; pointerId: number; startX: number; startY: number; from: PortraitCrop }
  | { kind: "pinch"; startDist: number; startZoom: number };

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Drag-to-reposition / pinch-to-zoom over the portrait, matching the badge's
 * frame. Offsets are stored as a fraction of the image's overflow rather than
 * pixels, so a gesture here means the same thing at export resolution.
 */
export function PortraitCropper({ src, crop, onChange }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const points = useRef(new Map<number, { x: number; y: number }>());
  const [active, setActive] = useState(false);

  // A drag of the full frame width should sweep the whole overflow, so convert
  // pixels to overflow-fractions using the frame size and current zoom. Guard
  // against zoom==1, where there is no overflow to pan into.
  function pxToFraction(dx: number, dy: number, zoom: number) {
    const box = boxRef.current;
    const w = box?.clientWidth || FRAME_W;
    const h = box?.clientHeight || FRAME_H;
    return { fx: dx / (w * zoom), fy: dy / (h * zoom) };
  }

  function onPointerDown(e: React.PointerEvent) {
    points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(true);

    const pts = [...points.current.values()];
    if (pts.length >= 2) {
      gesture.current = {
        kind: "pinch",
        startDist: distance(pts[0]!, pts[1]!),
        startZoom: crop.zoom,
      };
    } else {
      gesture.current = {
        kind: "drag",
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        from: crop,
      };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!points.current.has(e.pointerId)) return;
    points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;

    if (g.kind === "pinch") {
      const pts = [...points.current.values()];
      if (pts.length < 2) return;
      const ratio = distance(pts[0]!, pts[1]!) / (g.startDist || 1);
      onChange(clampCrop({ ...crop, zoom: g.startZoom * ratio }));
      return;
    }

    if (g.pointerId !== e.pointerId) return;
    const { fx, fy } = pxToFraction(e.clientX - g.startX, e.clientY - g.startY, g.from.zoom);
    onChange(clampCrop({ ...g.from, x: g.from.x + fx, y: g.from.y + fy }));
  }

  function endPointer(e: React.PointerEvent) {
    points.current.delete(e.pointerId);
    if (points.current.size === 0) {
      gesture.current = null;
      setActive(false);
    } else if (points.current.size === 1 && gesture.current?.kind === "pinch") {
      // Second finger lifted mid-pinch — restart as a drag from where the
      // remaining finger is, so the image doesn't jump.
      const [id, pt] = [...points.current.entries()][0]!;
      gesture.current = { kind: "drag", pointerId: id, startX: pt.x, startY: pt.y, from: crop };
    }
  }

  return (
    <div className="space-y-2">
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        style={{ aspectRatio: `${FRAME_W} / ${FRAME_H}`, touchAction: "none" }}
        className={`relative mx-auto w-full max-w-[220px] cursor-grab overflow-hidden rounded-t-full rounded-b-xl border-2 bg-muted active:cursor-grabbing ${
          active ? "border-primary" : "border-border"
        }`}
      >
        <img
          src={src}
          alt="Adjust your portrait"
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-cover"
          style={{
            transform: `scale(${crop.zoom}) translate(${crop.x * 100}%, ${crop.y * 100}%)`,
            transformOrigin: "center",
          }}
        />
        {/* Rule-of-thirds guides, only while a gesture is in flight. */}
        {active ? (
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="border border-white/25" />
            ))}
          </div>
        ) : null}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Drag to reposition · pinch or use the slider to zoom
      </p>

      <input
        type="range"
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={0.01}
        value={crop.zoom}
        onChange={(e) => onChange(clampCrop({ ...crop, zoom: Number(e.target.value) }))}
        className="w-full accent-primary"
        aria-label="Portrait zoom"
      />
    </div>
  );
}
