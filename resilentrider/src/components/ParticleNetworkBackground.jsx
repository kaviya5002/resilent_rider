import { useCallback, useEffect, useState } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import './ParticleNetworkBackground.css';

function ParticleNetworkBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile devices
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize particles engine
  const particlesInit = useCallback(async (engine) => {
    console.log('🧠 Initializing Neural Network...');
    await loadSlim(engine);
    console.log('✅ Neural Network Active!');
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    console.log('🌐 Neural Network Loaded:', container);
  }, []);

  // Neural network configuration
  const particlesConfig = {
    background: {
      color: {
        value: 'transparent',
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: !isMobile, // Disable on mobile for performance
          mode: ['grab', 'repulse', 'bubble'],
        },
        onClick: {
          enable: true,
          mode: 'push',
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 200,
          links: {
            opacity: 0.8,
            color: '#E0B88F',
            blink: true,
          },
        },
        repulse: {
          distance: 120,
          duration: 0.4,
          factor: 100,
          speed: 1,
          maxSpeed: 50,
          easing: 'ease-out-quad',
        },
        bubble: {
          distance: 200,
          size: 8,
          duration: 2,
          opacity: 0.9,
          speed: 3,
        },
        push: {
          quantity: 3,
        },
      },
    },
    particles: {
      color: {
        value: ['#112250', '#3C5070', '#E0B88F'],
      },
      links: {
        color: '#3C5070',
        distance: 150,
        enable: true,
        opacity: 0.25,
        width: 1.5,
        triangles: {
          enable: true,
          color: '#E0B88F',
          opacity: 0.05,
        },
        blink: false,
        consent: false,
        shadow: {
          enable: true,
          color: '#E0B88F',
          blur: 5,
        },
      },
      move: {
        enable: true,
        speed: 0.6,
        direction: 'none',
        random: true,
        straight: false,
        outModes: {
          default: 'bounce',
        },
        attract: {
          enable: true,
          rotateX: 600,
          rotateY: 1200,
        },
        trail: {
          enable: false,
        },
      },
      number: {
        value: isMobile ? 50 : 75,
        density: {
          enable: true,
          area: 1000,
        },
      },
      opacity: {
        value: { min: 0.3, max: 0.7 },
        animation: {
          enable: true,
          speed: 0.5,
          minimumValue: 0.2,
          sync: false,
        },
      },
      shape: {
        type: 'circle',
      },
      size: {
        value: { min: 2, max: 5 },
        animation: {
          enable: true,
          speed: 2,
          minimumValue: 1,
          sync: false,
        },
      },
      shadow: {
        enable: true,
        color: '#E0B88F',
        blur: 10,
        offset: {
          x: 0,
          y: 0,
        },
      },
      stroke: {
        width: 0,
      },
      twinkle: {
        particles: {
          enable: true,
          frequency: 0.05,
          opacity: 1,
        },
      },
      life: {
        duration: {
          sync: false,
          value: 0,
        },
        count: 0,
      },
    },
    detectRetina: true,
    smooth: true,
    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
    responsive: [
      {
        maxWidth: 768,
        options: {
          particles: {
            number: {
              value: 40,
            },
            move: {
              speed: 0.4,
            },
            links: {
              distance: 120,
            },
          },
          interactivity: {
            events: {
              onHover: {
                enable: false,
              },
            },
          },
        },
      },
    ],
  };

  return (
    <div className="particle-network-background">
      <Particles
        id="neuralNetwork"
        init={particlesInit}
        loaded={particlesLoaded}
        options={particlesConfig}
      />
      <div className="network-overlay"></div>
    </div>
  );
}

export default ParticleNetworkBackground;
