import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X, ZoomIn, ZoomOut } from "lucide-react";

const OUTPUT_SIZE = 512;
const CONTAINER_SIZE = 256;
const MAX_ZOOM = 3;

export function PhotoCropModal({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (croppedBlob: Blob) => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
      const cover = Math.max(
        CONTAINER_SIZE / img.naturalWidth,
        CONTAINER_SIZE / img.naturalHeight
      );
      setMinZoom(cover);
      setZoom(cover);
      setImgLoaded(true);
    };
    img.src = url;
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clampOffset = useCallback(
    (ox: number, oy: number, z: number) => {
      const iw = naturalW * z;
      const ih = naturalH * z;
      const maxX = Math.max(0, (iw - CONTAINER_SIZE) / 2);
      const maxY = Math.max(0, (ih - CONTAINER_SIZE) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, ox)),
        y: Math.max(-maxY, Math.min(maxY, oy)),
      };
    },
    [naturalW, naturalH]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const clamped = clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom);
    setOffset(clamped);
  };

  const onPointerUp = () => setDragging(false);

  const handleZoom = (z: number) => {
    const clampedZ = Math.max(minZoom, Math.min(MAX_ZOOM, z));
    const clamped = clampOffset(offset.x, offset.y, clampedZ);
    setOffset(clamped);
    setZoom(clampedZ);
  };

  const doCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const iw = naturalW * zoom;
    const ih = naturalH * zoom;
    const imgLeft = (CONTAINER_SIZE - iw) / 2 + offset.x;
    const imgTop = (CONTAINER_SIZE - ih) / 2 + offset.y;

    const sourceX = (0 - imgLeft) / zoom;
    const sourceY = (0 - imgTop) / zoom;
    const sourceW = CONTAINER_SIZE / zoom;
    const sourceH = CONTAINER_SIZE / zoom;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );

    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob);
    }, "image/jpeg", 0.9);
  };

  if (!imgLoaded || !imgUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="rounded-2xl bg-white p-8">
          <p className="text-sm text-slate-600">Caricamento anteprima...</p>
        </div>
      </div>
    );
  }

  const dispW = naturalW * zoom;
  const dispH = naturalH * zoom;
  const imgLeft = (CONTAINER_SIZE - dispW) / 2 + offset.x;
  const imgTop = (CONTAINER_SIZE - dispH) / 2 + offset.y;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">Centra la tua foto</h3>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="mb-3 text-sm text-slate-500">
            Trascina l'immagine per posizionarla nel riquadro. Verrà ritagliata in formato quadrato.
          </p>

          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="relative mx-auto cursor-grab overflow-hidden rounded-2xl bg-slate-900 touch-none select-none active:cursor-grabbing"
            style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}
          >
            <img
              src={imgUrl}
              alt="Anteprima"
              draggable={false}
              className="pointer-events-none absolute select-none"
              style={{
                left: imgLeft,
                top: imgTop,
                width: dispW,
                height: dispH,
                maxWidth: "none",
                maxHeight: "none",
              }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-teal-400/70" />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <ZoomOut className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="range"
              min={minZoom}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoom(parseFloat(e.target.value))}
              className="flex-1 accent-teal-600"
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-slate-400" />
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Annulla
            </button>
            <button
              onClick={doCrop}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
            >
              <Check className="h-4 w-4" />
              Conferma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
