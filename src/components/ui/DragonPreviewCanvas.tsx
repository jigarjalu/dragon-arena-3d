import React, { useEffect, useRef, useState } from 'react';
import { DragonConfig } from '../../types/game';
import { DragonPainter, DragonRenderState } from '../../game/DragonPainter';

interface DragonPreviewCanvasProps {
  config: DragonConfig;
  width?: number;
  height?: number;
  scale?: number;
  manualRotation?: number; // radians offset
  autoRotate?: boolean;
  interactiveRotate?: boolean;
}

export const DragonPreviewCanvas: React.FC<DragonPreviewCanvasProps> = ({
  config,
  width = 240,
  height = 240,
  scale = 1.0,
  manualRotation = 0,
  autoRotate = true,
  interactiveRotate = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const dragOffsetRef = useRef<number>(0);

  // Sync ref with state
  dragOffsetRef.current = dragOffset;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const numSegments = 30;
    const spacing = 12 * scale;

    const render = () => {
      time += 0.035;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Base angle with rotation and interactive drag
      const rot = manualRotation + dragOffsetRef.current + (autoRotate && !isDraggingRef.current ? Math.sin(time * 0.8) * 0.35 : 0);

      // Generate graceful S-curve serpentine body positions with realistic undulation
      const segments: { x: number; y: number; angle: number }[] = [];
      for (let i = 0; i < numSegments; i++) {
        const segDist = (i + 1) * spacing;
        const wave = Math.sin(time * 2.4 + i * 0.32) * (14 * scale);
        // Angled curve around stone pedestal
        const sx = cx - Math.cos(rot) * segDist + Math.sin(rot) * wave;
        const sy = cy - Math.sin(rot) * segDist - Math.cos(rot) * wave + 16 * scale;
        segments.push({
          x: sx,
          y: sy,
          angle: rot + Math.cos(time * 2.4 + i * 0.32) * 0.35,
        });
      }

      // Draw stone pedestal shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 52 * scale, 90 * scale, 38 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ancient Carved Stone Pedestal
      const pedGrad = ctx.createRadialGradient(cx, cy + 46 * scale, 12, cx, cy + 46 * scale, 82 * scale);
      pedGrad.addColorStop(0, '#64748b');
      pedGrad.addColorStop(0.7, '#334155');
      pedGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = pedGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 46 * scale, 80 * scale, 32 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3.5 * scale;
      ctx.stroke();

      // Pedestal runic ring
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 46 * scale, 65 * scale, 24 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Draw Photorealistic Dragon
      const state: DragonRenderState = {
        x: cx,
        y: cy,
        angle: rot,
        weight: 240,
        segments,
        wingFlapPhase: time * 3.2,
      };

      DragonPainter.drawDragon(ctx, config, state, scale);

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [config, width, height, scale, manualRotation, autoRotate]);

  // Touch & Mouse drag rotation
  const handlePointerDown = (clientX: number) => {
    if (!interactiveRotate) return;
    isDraggingRef.current = true;
    startXRef.current = clientX;
  };

  const handlePointerMove = (clientX: number) => {
    if (!interactiveRotate || !isDraggingRef.current) return;
    const delta = clientX - startXRef.current;
    startXRef.current = clientX;
    setDragOffset((prev) => prev + delta * 0.018);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="relative inline-block select-none cursor-grab active:cursor-grabbing">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-w-full drop-shadow-2xl select-none"
        onMouseDown={(e) => handlePointerDown(e.clientX)}
        onMouseMove={(e) => handlePointerMove(e.clientX)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
        onTouchEnd={handlePointerUp}
      />
    </div>
  );
};
