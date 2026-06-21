import { motion } from 'framer-motion';
import AnimatedWorkflow from '../components/sections/AnimatedWorkflow';
import ScrollReveal from '../components/ScrollReveal';
import './HowItWorks.css';

function HowItWorks() {
  return (
    <div className="how-it-works-page">
      <ScrollReveal variant="fadeIn">
        <div className="page-hero">
          <h1>How ResilientRider Works</h1>
          <p>A comprehensive guide to protecting delivery riders with AI-powered insurance</p>
        </div>
      </ScrollReveal>

      <AnimatedWorkflow />

      <ScrollReveal variant="slideUp" delay={0.2}>
        <div className="container section">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">🚀</div>
              <h3>Quick Setup</h3>
              <p>Get started in less than 5 minutes with our streamlined onboarding process.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">🤖</div>
              <h3>AI-Powered</h3>
              <p>Advanced machine learning monitors your safety and optimizes your earnings.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">💰</div>
              <h3>Flexible Payments</h3>
              <p>Pay-as-you-ride model with affordable weekly premiums starting at $12.50.</p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

export default HowItWorks;
