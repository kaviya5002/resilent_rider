import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Hero from '../components/Hero';
import HomeFeatures from '../components/sections/HomeFeatures';
import ProblemSection from '../components/sections/ProblemSection';
import SolutionSection from '../components/sections/SolutionSection';
import AITechnologySection from '../components/sections/AITechnologySection';
import AnimatedWorkflow from '../components/sections/AnimatedWorkflow';
import BenefitsSection from '../components/sections/BenefitsSection';
import './Home.css';

function Home() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true, offset: 100 });
  }, []);

  return (
    <div className="home-page">
      <Hero />
      <HomeFeatures />
      <ProblemSection />
      <SolutionSection />
      <AITechnologySection />
      <AnimatedWorkflow />
      <BenefitsSection />
    </div>
  );
}

export default Home;
