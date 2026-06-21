import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function ParticleBackground() {

  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1
      }}
      options={{
        background: {
          color: "transparent"
        },
        fpsLimit: 60,
        particles: {
          number: {
            value: 70
          },
          color: {
            value: "#E0B88F"
          },
          links: {
            enable: true,
            color: "#3C5070",
            distance: 150
          },
          move: {
            enable: true,
            speed: 1
          },
          opacity: {
            value: 0.5
          },
          size: {
            value: 3
          }
        },
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "repulse"
            }
          },
          modes: {
            repulse: {
              distance: 100
            }
          }
        }
      }}
    />
  );
}