import { useEffect, useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cropToDataUrl(image, rect, maxSide = 1200) {
  const x = Math.round(rect.x);
  const y = Math.round(rect.y);
  const w = Math.max(1, Math.round(rect.w));
  const h = Math.max(1, Math.round(rect.h));
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(image, x, y, w, h, 0, 0, outW, outH);
  return canvas.toDataURL("image/jpeg", 0.86);
}

export default function ImageCropModal({ src, title, onCancel, onApply }) {
  const stageRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [display, setDisplay] = useState({ w: 0, h: 0, left: 0, top: 0 });
  const [rect, setRect] = useState(null);
  const [splits, setSplits] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function measure() {
      const img = imgRef.current;
      const stage = stageRef.current;
      if (!img || !stage || !img.naturalWidth) return;
      const bounds = stage.getBoundingClientRect();
      const maxW = Math.max(240, bounds.width - 24);
      const maxH = Math.min(520, Math.max(220, window.innerHeight * 0.55));
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setDisplay({ w, h, left: (bounds.width - w) / 2, top: 12 });
      setRect((prev) => {
        if (prev) return prev;
        const slice = Math.round(img.naturalWidth / 4);
        return {
          x: Math.max(0, Math.round((img.naturalWidth - slice) / 2)),
          y: 0,
          w: slice,
          h: img.naturalHeight,
        };
      });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [src]);

  function toNatural(clientX, clientY) {
    const stage = stageRef.current.getBoundingClientRect();
    const scaleX = natural.w / display.w;
    const scaleY = natural.h / display.h;
    const x = (clientX - stage.left - display.left) * scaleX;
    const y = (clientY - stage.top - display.top) * scaleY;
    return {
      x: clamp(x, 0, natural.w),
      y: clamp(y, 0, natural.h),
    };
  }

  function onPointerDown(event) {
    if (!natural.w) return;
    event.preventDefault();
    const point = toNatural(event.clientX, event.clientY);
    dragRef.current = { x: point.x, y: point.y };
    setSplits(0);
    setRect({ x: point.x, y: point.y, w: 1, h: 1 });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    const start = dragRef.current;
    if (!start) return;
    const point = toNatural(event.clientX, event.clientY);
    const x = Math.min(start.x, point.x);
    const y = Math.min(start.y, point.y);
    const w = Math.max(1, Math.abs(point.x - start.x));
    const h = Math.max(1, Math.abs(point.y - start.y));
    setRect({ x, y, w, h });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function applySplit(count, index) {
    if (!natural.w) return;
    const w = natural.w / count;
    setSplits(count);
    setRect({
      x: Math.round(w * index),
      y: 0,
      w: Math.round(w),
      h: natural.h,
    });
  }

  function useFull() {
    setSplits(0);
    setRect({ x: 0, y: 0, w: natural.w, h: natural.h });
  }

  async function apply() {
    if (!rect || rect.w < 8 || rect.h < 8) return;
    setBusy(true);
    try {
      const source = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not load picture to crop"));
        img.src = src;
      });
      onApply(cropToDataUrl(source, rect));
    } catch (err) {
      console.error(err);
      // Fall back to the on-screen image if a fresh load fails.
      if (imgRef.current) onApply(cropToDataUrl(imgRef.current, rect));
    } finally {
      setBusy(false);
    }
  }

  const scaleX = display.w / Math.max(1, natural.w);
  const scaleY = display.h / Math.max(1, natural.h);
  const box = rect
    ? {
        left: display.left + rect.x * scaleX,
        top: display.top + rect.y * scaleY,
        width: Math.max(2, rect.w * scaleX),
        height: Math.max(2, rect.h * scaleY),
      }
    : null;

  const preview =
    rect && rect.w >= 8 && rect.h >= 8 && natural.w
      ? {
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${(natural.w / rect.w) * 100}% ${(natural.h / rect.h) * 100}%`,
          backgroundPosition: `${(-rect.x / rect.w) * 100}% ${(-rect.y / rect.h) * 100}%`,
        }
      : null;

  return (
    <div className="crop-modal" role="dialog" aria-modal="true" aria-label="Crop picture">
      <div className="crop-modal-card">
        <div className="crop-modal-head">
          <div>
            <p className="admin-kicker">Crop colour</p>
            <h3>{title || "Pick one item"}</h3>
            <p className="muted">
              Frame <strong>one</strong> item only. Use Quick split for side-by-side lineups, then tap the column you want.
            </p>
          </div>
          <button type="button" className="btn-ghost-ink" onClick={onCancel}>
            Cancel
          </button>
        </div>

        <div className="crop-split-bar">
          <span>Quick split</span>
          {[2, 3, 4, 5, 6].map((count) => (
            <button
              key={count}
              type="button"
              className={splits === count ? "btn-dark" : "btn-ghost-ink"}
              onClick={() => applySplit(count, 0)}
            >
              {count}
            </button>
          ))}
          <button type="button" className="btn-ghost-ink" onClick={useFull}>
            Full
          </button>
        </div>

        <div
          ref={stageRef}
          className="crop-stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            ref={imgRef}
            src={src}
            alt=""
            style={{ width: display.w || "auto", height: display.h || "auto", left: display.left, top: display.top }}
            onLoad={() => {
              const img = imgRef.current;
              const stage = stageRef.current;
              if (!img || !stage) return;
              const bounds = stage.getBoundingClientRect();
              const maxW = Math.max(240, bounds.width - 24);
              const maxH = Math.min(520, Math.max(220, window.innerHeight * 0.55));
              const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
              const w = Math.round(img.naturalWidth * scale);
              const h = Math.round(img.naturalHeight * scale);
              setNatural({ w: img.naturalWidth, h: img.naturalHeight });
              setDisplay({ w, h, left: (bounds.width - w) / 2, top: 12 });
              const slice = Math.round(img.naturalWidth / 4);
              setRect({
                x: Math.max(0, Math.round((img.naturalWidth - slice) / 2)),
                y: 0,
                w: slice,
                h: img.naturalHeight,
              });
              setSplits(4);
            }}
            draggable={false}
          />
          {box ? <div className="crop-box" style={box} /> : null}
          {splits > 1
            ? Array.from({ length: splits }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  className="crop-slice"
                  style={{
                    left: display.left + (display.w / splits) * index,
                    top: display.top,
                    width: display.w / splits,
                    height: display.h,
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    applySplit(splits, index);
                  }}
                  aria-label={`Use column ${index + 1}`}
                />
              ))
            : null}
        </div>

        {preview ? (
          <div className="crop-preview-row">
            <span>Result preview</span>
            <div className="crop-preview" style={preview} aria-hidden="true" />
          </div>
        ) : null}

        <div className="crop-modal-actions">
          <button type="button" className="btn-ghost-ink" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-lime" onClick={apply} disabled={busy || !rect || rect.w < 8}>
            {busy ? "Cropping…" : "Use cropped picture"}
          </button>
        </div>
      </div>
    </div>
  );
}
