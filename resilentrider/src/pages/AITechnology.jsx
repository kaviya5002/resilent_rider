import { motion } from 'framer-motion';
import ScrollReveal from '../components/ScrollReveal';
import './AITechnology.css';

function AITechnology() {
  const features = [
    {
      icon: '🤖',
      title: 'Machine Learning',
      description: 'Advanced ML algorithms analyze riding patterns and predict risks in real-time.',
    },
    {
      icon: '🧠',
      title: 'Neural Networks',
      description: 'Deep learning models process millions of data points to ensure your safety.',
    },
    {
      icon: '📊',
      title: 'Predictive Analytics',
      description: 'AI forecasts demand, earnings, and optimal routes for maximum efficiency.',
    },
    {
      icon: '🔍',
      title: 'Fraud Detection',
      description: 'Intelligent systems identify suspicious patterns and prevent fraudulent claims.',
    },
    {
      icon: '⚡',
      title: 'Real-time Processing',
      description: 'Instant data analysis and decision-making for immediate protection.',
    },
    {
      icon: '🛡️',
      title: 'Risk Assessment',
      description: 'Continuous monitoring and evaluation of safety factors on every ride.',
    },
  ];

  return (
    <div className="ai-technology-page">
      <ScrollReveal variant="fadeIn">
        <div className="page-hero">
          <h1>AI Technology</h1>
          <p>Cutting-edge artificial intelligence protecting riders worldwide</p>
        </div>
      </ScrollReveal>

      <div className="container section">
        <ScrollReveal variant="slideUp">
          <div className="tech-intro">
            <h2>Powered by Advanced AI</h2>
            <p>
              ResilientRider leverages state-of-the-art artificial intelligence and machine learning
              to provide unparalleled protection and optimization for delivery riders. Our AI systems
              work 24/7 to keep you safe and maximize your earnings.
            </p>
          </div>
        </ScrollReveal>

        <div className="features-grid">
          {features.map((feature, index) => (
            <ScrollReveal key={index} variant="scaleIn" delay={index * 0.1}>
              <motion.div
                className="tech-card"
                whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(17, 34, 80, 0.15)' }}
              >
                <div className="tech-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal variant="slideUp" delay={0.3}>
          <div className="tech-stats">
            <div className="stat-item">
              <h3>99.9%</h3>
              <p>Accuracy Rate</p>
            </div>
            <div className="stat-item">
              <h3>&lt;100ms</h3>
              <p>Response Time</p>
            </div>
            <div className="stat-item">
              <h3>1M+</h3>
              <p>Data Points Analyzed</p>
            </div>
            <div className="stat-item">
              <h3>24/7</h3>
              <p>Continuous Monitoring</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default AITechnology;
