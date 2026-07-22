import { useEffect, useRef } from "react";

export type ScrubSequenceProps = {
  framesPath: string;
  frameCount: number;
  ext?: "jpg" | "webp";
  className?: string;
  scrollTargetRef: React.RefObject<HTMLElement | null>;
  /** 0 = top-anchor, 0.5 = center (default), 1 = bottom-anchor */
  verticalAnchor?: number;
};

const pad4 = (n: number) => String(n).padStart(4, "0");

export function ScrubSequence({
  framesPath,
  frameCount,
  ext = "webp",
  className,
  scrollTargetRef,
  verticalAnchor = 0.4,
}: ScrubSequenceProps) {
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const imagesRef       = useRef<HTMLImageElement[]>([]);
  const rafRef          = useRef<number | null>(null);
  const visible         = useRef(true);
  const currentFrameRef = useRef(0);   // smoothed frame index (float)
  const prefersReduced  = useRef(
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Preload all frames
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    const urls = Array.from(
      { length: frameCount },
      (_, i) => `${framesPath}/frame_${pad4(i + 1)}.${ext}`
    );
    const first = new Image();
    first.src = urls[0];
    (first as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "high";
    imgs[0] = first;
    urls.slice(1).forEach((src, i) => {
      const img = new Image();
      img.src = src;
      imgs[i + 1] = img;
    });
    imagesRef.current = imgs;
  }, [framesPath, frameCount, ext]);

  // DPR-aware canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = "100%";
      canvas.style.height = "100%";
      drawFrame(Math.round(currentFrameRef.current));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection observer to pause RAF when off-screen
  useEffect(() => {
    const el = scrollTargetRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { visible.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scrollTargetRef]);

  // RAF loop with lerp smoothing
  useEffect(() => {
    const LERP = 0.12; // smoothing factor — lower = silkier but slower to catch up

    const tick = () => {
      if (visible.current && !prefersReduced.current) {
        const target = targetIndex();
        // Lerp toward target for smooth sub-frame interpolation
        currentFrameRef.current += (target - currentFrameRef.current) * LERP;
        drawFrame(Math.round(currentFrameRef.current));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reduced-motion: show middle frame statically
  useEffect(() => {
    if (prefersReduced.current) {
      const mid = Math.floor(frameCount / 2);
      const img = imagesRef.current[mid];
      if (img?.complete) drawImage(img);
      else img?.addEventListener("load", () => drawImage(img), { once: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount]);

  const targetIndex = (): number => {
    const el = scrollTargetRef.current;
    if (!el) return 0;
    const rect  = el.getBoundingClientRect();
    const total = el.offsetHeight - window.innerHeight;
    const progress = total > 0
      ? Math.min(1, Math.max(0, -rect.top / total))
      : 0;
    return progress * (frameCount - 1);
  };

  const drawFrame = (idx: number) => {
    const img = imagesRef.current[idx];
    if (img && img.complete && img.naturalWidth > 0) drawImage(img);
  };

  const drawImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cw = canvas.width, ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    // Cover-fit: scale so the image fills the canvas
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2;
    // verticalAnchor: 0 = top, 0.5 = center, 1 = bottom
    const dy = (ch - dh) * verticalAnchor;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  };

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ transform: "translateZ(0)", willChange: "contents" }}
    />
  );
}
