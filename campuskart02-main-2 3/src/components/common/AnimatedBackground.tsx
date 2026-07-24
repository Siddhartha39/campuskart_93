import React, { useEffect, useRef } from 'react';

const AnimatedBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string }> = [];
    const particleCount = 40;
    const maxTranslate = 20;
    const maxLineDistance = 100;

    const handlePointerMove = (event: MouseEvent) => {
      pointerRef.current.targetX = (event.clientX / canvas.width - 0.5) * maxTranslate;
      pointerRef.current.targetY = (event.clientY / canvas.height - 0.5) * maxTranslate;
    };

    const handlePointerLeave = () => {
      pointerRef.current.targetX = 0;
      pointerRef.current.targetY = 0;
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles.length = 0;
      for (let i = 0; i < particleCount; i += 1) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.9,
          vy: (Math.random() - 0.5) * 0.9,
          radius: 1.8 + Math.random() * 2.5,
          color: `hsla(${Math.round(Math.random() * 360)}, 90%, 78%, 0.95)`
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      pointerRef.current.x += (pointerRef.current.targetX - pointerRef.current.x) * 0.08;
      pointerRef.current.y += (pointerRef.current.targetY - pointerRef.current.y) * 0.08;

      const offsetX = pointerRef.current.x;
      const offsetY = pointerRef.current.y;

      particles.forEach((particle) => {
        particle.x += particle.vx + offsetX * 0.015;
        particle.y += particle.vy + offsetY * 0.015;

        if (particle.x <= -maxTranslate) particle.x = canvas.width + maxTranslate;
        if (particle.x >= canvas.width + maxTranslate) particle.x = -maxTranslate;
        if (particle.y <= -maxTranslate) particle.y = canvas.height + maxTranslate;
        if (particle.y >= canvas.height + maxTranslate) particle.y = -maxTranslate;

        ctx.beginPath();
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < maxLineDistance) {
            const alpha = (1 - distance / maxLineDistance) * 0.35;
            ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerout', handlePointerLeave);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerout', handlePointerLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
};

export default AnimatedBackground;
