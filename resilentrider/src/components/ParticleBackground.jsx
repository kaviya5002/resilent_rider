import { useCallback, useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

function ParticleBackground() {
  const [engineReady, setEngineReady] = useState(false);
  const [isDark, setIsDark]           = useState(
    () => document.documentElement.classList.contains('dark-mode')
  );

  // ── Init engine once ──────────────────────────────────────────
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setEngineReady(true));
  }, []);

  // ── Watch dark-mode class on <html> ───────────────────────────
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark-mode'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const particleColor = isDark ? '#ffffff' : '#112250';
  const linkColor     = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(17,34,80,0.15)';

  const options = {
    background:  { color: 'transparent' },
    fpsLimit:    50,
    fullScreen:  { enable: true, zIndex: -1 },
    particles: {
      number:  { value: 55, density: { enable: true } },
      color:   { value: particleColor },
      opacity: { value: { min: 0.15, max: 0.45 } },
      size:    { value: { min: 1.5, max: 3.5 } },
      links: {
        enable:   true,
        color:    linkColor,
        distance: 145,
        opacity:  0.5,
        width:    1,
      },
      move: {
        enable:    true,
        speed:     0.65,
        direction: 'none',
        outModes:  { default: 'bounce' },
      },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'repulse' },
      },
      modes: {
        repulse: { distance: 90, duration: 0.4 },
      },
    },
    detectRetina: true,
  };

  const particlesLoaded = useCallback(() => {}, []);

  if (!engineReady) return null;

  return (
    <Particles
      id="tsparticles"
      particlesLoaded={particlesLoaded}
      options={options}
      style={{ pointerEvents: 'none' }}
    />
  );
}

export default ParticleBackground;
