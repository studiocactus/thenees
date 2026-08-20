import { useEffect, type RefObject } from "react";
import type { AsciiParticle } from "../types";

export function useAsciiEffect(portraitRef: RefObject<HTMLElement | null>, asciiCanvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const container = portraitRef.current;
    const canvas = asciiCanvasRef.current;
    if (!container || !canvas) return;

    const context = canvas.getContext("2d", { desynchronized: true });
    if (!context) return;

    const source = new Image();
    source.src = "/thenees-ascii-source.jpg";
    const offscreen = document.createElement("canvas");
    const sampleContext = offscreen.getContext("2d", { willReadFrequently: true });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const symbols = " .,:;i1tfLCG08@";
    let particles: AsciiParticle[] = [];
    let cell = 8;
    let frame = 0;
    let idleTimer = 0;
    let hovering = false;
    let visible = true;
    let lastPaint = 0;
    let pointerX = -999;
    let pointerY = -999;

    const draw = (time = 0) => {
      const rect = container.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      context.font = `${Math.max(7, cell * 1.04)}px "Silkscreen", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      for (const particle of particles) {
        let x = particle.x;
        let y = particle.y;
        const dx = x - pointerX;
        const dy = y - pointerY;
        const distance = Math.hypot(dx, dy) || 1;
        const radius = 118;
        let force = 0;

        if (hovering && !reducedMotion && distance < radius) {
          force = Math.pow(1 - distance / radius, 2);
          x += (dx / distance) * force * 34 + Math.sin(time * 0.006 + particle.seed) * force * 11;
          y += (dy / distance) * force * 34 + Math.cos(time * 0.005 + particle.seed) * force * 8;
        }

        context.fillStyle = force > 0.42
          ? `rgba(197,255,0,${Math.min(1, particle.alpha + 0.2)})`
          : `rgba(245,245,239,${particle.alpha})`;
        context.fillText(particle.char, x, y);
      }
    };

    const animate = (time: number) => {
      if (time - lastPaint < 1000 / 30) {
        frame = window.requestAnimationFrame(animate);
        return;
      }
      lastPaint = time;
      draw(time);
      if (hovering && visible && !reducedMotion) frame = window.requestAnimationFrame(animate);
    };

    const rebuild = () => {
      if (!source.complete || !source.naturalWidth || !sampleContext) return;
      const rect = container.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      cell = rect.width < 520 ? 11 : 10;
      const columns = Math.max(1, Math.floor(rect.width / cell));
      const rows = Math.max(1, Math.floor(rect.height / cell));
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      offscreen.width = columns;
      offscreen.height = rows;

      sampleContext.clearRect(0, 0, columns, rows);
      const coverScale = Math.max(columns / source.naturalWidth, rows / source.naturalHeight);
      const visibleWidth = columns / coverScale;
      const visibleHeight = rows / coverScale;
      const focusX = source.naturalWidth * 0.58;
      const sourceX = Math.max(0, Math.min(source.naturalWidth - visibleWidth, focusX - visibleWidth * 0.58));
      const sourceY = Math.max(0, (source.naturalHeight - visibleHeight) * 0.5);
      sampleContext.drawImage(source, sourceX, sourceY, visibleWidth, visibleHeight, 0, 0, columns, rows);
      const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
      const next: AsciiParticle[] = [];

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const index = (row * columns + column) * 4;
          const normalizedX = column / Math.max(1, columns - 1);
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
          const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
          if (saturation < 11 && luminance > 92) continue;
          const contrast = Math.max(0, Math.min(255, (luminance - 105) * 1.65 + 105));
          if (contrast < 48) continue;
          const normalized = contrast / 255;
          const symbolIndex = Math.min(symbols.length - 1, Math.floor(normalized * (symbols.length - 1)));
          const fadeProgress = Math.max(0, Math.min(1, (normalizedX - 0.015) / 0.34));
          const horizontalFade = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
          next.push({
            x: column * cell + cell / 2,
            y: row * cell + cell / 2,
            char: symbols[symbolIndex],
            alpha: (0.22 + normalized * 0.78) * horizontalFade,
            seed: column * 0.77 + row * 1.31,
          });
        }
      }

      particles = next;
      draw();
    };

    const onMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      if (!hovering) {
        hovering = true;
        window.cancelAnimationFrame(frame);
        if (visible) frame = window.requestAnimationFrame(animate);
      }
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        hovering = false;
        window.cancelAnimationFrame(frame);
        draw();
      }, 500);
    };
    const onLeave = () => {
      hovering = false;
      window.clearTimeout(idleTimer);
      pointerX = -999;
      pointerY = -999;
      window.cancelAnimationFrame(frame);
      draw();
    };

    source.addEventListener("load", rebuild);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    const observer = new ResizeObserver(rebuild);
    observer.observe(container);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        window.cancelAnimationFrame(frame);
      } else {
        draw();
      }
    }, { threshold: 0.01 });
    visibilityObserver.observe(container);
    if (source.complete) rebuild();

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      observer.disconnect();
      visibilityObserver.disconnect();
      source.removeEventListener("load", rebuild);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, [portraitRef, asciiCanvasRef]);
}
