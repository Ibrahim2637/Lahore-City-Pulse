import React, { useEffect, useRef, useState } from 'react';

export default function CanvasStethoscope({ scrollProgress }) {
  const canvasRef = useRef(null);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    // Pulse animation timer
    const interval = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    ctx.clearRect(0, 0, width, height);

    // Stethoscope points definition (relative to canvas width & height)
    // We'll draw: Earpieces at top -> tube running down -> chestpiece at bottom center
    const cx = width / 2;
    const topY = height * 0.15;
    const chestpieceX = cx;
    const chestpieceY = height * 0.75;

    // We draw parts based on progress
    const progress = Math.min(Math.max(scrollProgress, 0), 1);

    // Set styling
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Draw Earpieces (inverted metal U and tips)
    const drawEarpieces = (prog) => {
      const scale = Math.min(prog / 0.3, 1); // earpieces take first 30% of scroll
      if (scale <= 0) return;

      ctx.strokeStyle = '#8E8E93'; // Metal grey
      ctx.lineWidth = 3;

      // Left metal arch
      ctx.beginPath();
      // Draw from center bridge out and up
      ctx.arc(cx - 30, topY, 20, Math.PI, Math.PI * 1.5, false);
      ctx.arc(cx - 30, topY - 30, 20, Math.PI * 0.5, Math.PI * 1.8, false);
      ctx.stroke();

      // Right metal arch
      ctx.beginPath();
      ctx.arc(cx + 30, topY, 20, 0, Math.PI * 1.5, true);
      ctx.arc(cx + 30, topY - 30, 20, Math.PI * 0.5, Math.PI * 1.2, true);
      ctx.stroke();

      // Left earbud
      ctx.fillStyle = '#1C1C1E';
      ctx.beginPath();
      ctx.arc(cx - 42, topY - 45, 6, 0, Math.PI * 2);
      ctx.fill();

      // Right earbud
      ctx.beginPath();
      ctx.arc(cx + 42, topY - 45, 6, 0, Math.PI * 2);
      ctx.fill();

      // Central metallic spring bridge
      ctx.beginPath();
      ctx.moveTo(cx - 20, topY + 10);
      ctx.lineTo(cx + 20, topY + 10);
      ctx.stroke();
    };

    // 2. Draw flexible rubber tube (bezier curve running from earpiece junction to chestpiece)
    const drawTube = (prog) => {
      if (prog <= 0.3) return;
      const tubeProg = Math.min((prog - 0.3) / 0.5, 1); // Tube takes next 50% (from 30% to 80%)

      ctx.strokeStyle = '#4CAF50'; // Lahore Green flexible tubing!
      ctx.lineWidth = 6;

      const startX = cx;
      const startY = topY + 10;
      
      // Control points for a beautiful double-bend stethoscope wire
      const cp1x = cx - 90;
      const cp1y = topY + (chestpieceY - topY) * 0.3;
      const cp2x = cx + 90;
      const cp2y = topY + (chestpieceY - topY) * 0.7;

      // Custom drawing based on bezier interpolation (De Casteljau's or segment approximation)
      // To draw partial bezier, we approximate with points
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      const steps = 100;
      const limit = Math.floor(steps * tubeProg);
      for (let i = 0; i <= limit; i++) {
        const t = i / steps;
        // Cubic bezier formula
        const mt = 1 - t;
        const x = mt * mt * mt * startX + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * chestpieceX;
        const y = mt * mt * mt * startY + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * chestpieceY;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // 3. Draw chestpiece (metal diaphragm with heartbeat waves)
    const drawChestpiece = (prog) => {
      if (prog <= 0.8) return;
      const chestProg = Math.min((prog - 0.8) / 0.2, 1); // Chestpiece takes final 20%

      const r = 24 * chestProg;

      // Diaphragm metallic outer rim
      ctx.strokeStyle = '#8E8E93';
      ctx.lineWidth = 5;
      ctx.fillStyle = '#2C2C2E';
      ctx.beginPath();
      ctx.arc(chestpieceX, chestpieceY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner details
      ctx.strokeStyle = '#E2E2E7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(chestpieceX, chestpieceY, r * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      // Core green/gold sensor point
      ctx.fillStyle = '#FFD700'; // Gold pulse center
      ctx.beginPath();
      ctx.arc(chestpieceX, chestpieceY, r * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // 4. Pulsing heart rings (active when chestpiece is fully drawn)
      if (chestProg >= 1) {
        const time = (Date.now() % 1200) / 1200; // loop 0 to 1
        const maxPulseRadius = 80;
        
        // Pulse ring 1
        const pulseR1 = r + (maxPulseRadius - r) * time;
        const opacity1 = 1 - time;
        ctx.strokeStyle = `rgba(76, 175, 80, ${opacity1 * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(chestpieceX, chestpieceY, pulseR1, 0, Math.PI * 2);
        ctx.stroke();

        // Pulse ring 2 (offset)
        const time2 = (time + 0.5) % 1;
        const pulseR2 = r + (maxPulseRadius - r) * time2;
        const opacity2 = 1 - time2;
        ctx.strokeStyle = `rgba(255, 215, 0, ${opacity2 * 0.4})`; // Gold sub-pulse
        ctx.beginPath();
        ctx.arc(chestpieceX, chestpieceY, pulseR2, 0, Math.PI * 2);
        ctx.stroke();

        // Small medical heartbeat ECG wave on chestpiece
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const startW = chestpieceX - 12;
        ctx.moveTo(startW, chestpieceY);
        ctx.lineTo(startW + 4, chestpieceY);
        ctx.lineTo(startW + 6, chestpieceY - 6);
        ctx.lineTo(startW + 8, chestpieceY + 8);
        ctx.lineTo(startW + 10, chestpieceY - 3);
        ctx.lineTo(startW + 12, chestpieceY + 1);
        ctx.lineTo(startW + 14, chestpieceY);
        ctx.lineTo(startW + 24, chestpieceY);
        ctx.stroke();
      }
    };

    // Execute drawing sequence
    drawEarpieces(progress);
    drawTube(progress);
    drawChestpiece(progress);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [scrollProgress, pulseCount]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}
