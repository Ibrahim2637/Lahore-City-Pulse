import React, { useEffect, useRef } from 'react';

export default function CanvasRain({ isActive }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles = [];
    const maxParticles = 120;

    // Track mouse position and scroll velocity
    let mouse = { x: -1000, y: -1000 };
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      scrollVelocity = (currentScroll - lastScrollY) * 0.4;
      lastScrollY = currentScroll;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Initialize rain drops
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        length: Math.random() * 20 + 10,
        speed: Math.random() * 8 + 6,
        opacity: Math.random() * 0.4 + 0.1,
        weight: Math.random() * 1.5 + 0.5,
      });
    }

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Dampen scroll velocity back to 0
      scrollVelocity *= 0.95;

      // Adjust rain angle and speed based on scroll velocity
      const angle = (scrollVelocity * Math.PI) / 180;
      const speedModifier = 1 + Math.abs(scrollVelocity) * 0.1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Basic physics
        let dx = Math.sin(angle) * p.speed * speedModifier;
        let dy = Math.cos(angle) * p.speed * speedModifier + p.weight;

        // Interactive deflection from cursor
        const distToMouse = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (distToMouse < 80) {
          const force = (80 - distToMouse) / 80;
          const angleToMouse = Math.atan2(p.y - mouse.y, p.x - mouse.x);
          dx += Math.cos(angleToMouse) * force * 15;
          dy += Math.sin(angleToMouse) * force * 5;
        }

        p.x += dx;
        p.y += dy;

        // Reset particle when it goes off screen
        if (p.y > height || p.x < 0 || p.x > width) {
          p.y = -20;
          p.x = Math.random() * width;
          p.speed = Math.random() * 8 + 6;
          p.opacity = Math.random() * 0.4 + 0.1;
        }

        // Draw drop as a line
        ctx.beginPath();
        ctx.strokeStyle = `rgba(131, 238, 140, ${p.opacity * (isActive ? 1 : 0.2)})`; // Lahore Green rain drops!
        ctx.lineWidth = p.weight;
        ctx.lineCap = 'round';
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + dx * 0.5, p.y + dy * 0.5);
        ctx.stroke();

        // Draw splash at mouse cursor
        if (distToMouse < 80 && Math.random() > 0.85) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.random() * 2 + 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 1.5})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 1,
      }}
    />
  );
}
