import { useCallback } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import './GlobalParticleBackground.css';

function GlobalParticleBackground() {
  const particlesInit = useCallback(async (engine) => {
    console.log('Initializing particles...');
    await loadSlim(engine);
    console.log('Particles engine loaded!');
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    console.log('✅ Particles container loaded successfully!', container);
  }, []);

  return (
    <div className="global-particle-background">
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          background: {
            color: {
              value: 'transparent',
            },
          },
          fpsLimit: 120,
          interactivity: {
            events: {
              onHover: {
                enable: true,
                mode: 'repulse',
              },
              onClick: {
                enable: true,
                mode: 'push',
              },
            },
            modes: {
              repulse: {
                distance: 100,
                duration: 0.4,
              },
              push: {
                quantity: 4,
              },
            },
          },
          particles: {
            color: {
              value: '#E0B88F',
            },
            links: {
              color: '#3C5070',
              distance: 150,
              enable: true,
              opacity: 0.3,
              width: 1,
            },
            move: {
              direction: 'none',
              enable: true,
              outModes: {
                default: 'bounce',
              },
              random: false,
              speed: 1,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 80,
            },
            opacity: {
              value: 0.5,
            },
            shape: {
              type: 'circle',
            },
            size: {
              value: { min: 1, max: 3 },
            },
          },
          detectRetina: true,
        }}
      />
    </div>
  );
}

export default GlobalParticleBackground;
