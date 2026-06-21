import { motion } from 'framer-motion';
import { useState } from 'react';
import './AnimatedWorkflow.css';

function AnimatedWorkflow() {
  const [activeStep, setActiveStep] = useState(null);

  const steps = [
    {
      id: 1,
      title: 'Rider Registers',
      description: 'Sign up in minutes with basic information and start your journey with ResilientRider',
      icon: '📝',
      color: '#3B82F6',
      details: 'Quick onboarding process with instant verification',
    },
    {
      id: 2,
      title: 'Pays Weekly Premium',
      description: 'Affordable pay-as-you-ride insurance premiums deducted automatically',
      icon: '💳',
      color: '#10B981',
      details: 'Flexible payment options starting from $12.50/week',
    },
    {
      id: 3,
      title: 'AI Monitors Conditions',
      description: 'Real-time AI tracking of riding behavior, weather, and road conditions',
      icon: '🤖',
      color: '#8B5CF6',
      details: 'Machine learning algorithms ensure your safety',
    },
    {
      id: 4,
      title: 'Demand Prediction',
      description: 'AI predicts high-demand areas to maximize your earning potential',
      icon: '📊',
      color: '#F59E0B',
      details: 'Smart analytics powered by historical data',
    },
    {
      id: 5,
      title: 'Smart Relocation',
      description: 'Get real-time suggestions to move to profitable zones nearby',
      icon: '📍',
      color: '#EC4899',
      details: 'Increase earnings by up to 45% with AI guidance',
    },
    {
      id: 6,
      title: 'Parametric Trigger',
      description: 'Automatic claim detection when accidents or incidents occur',
      icon: '⚡',
      color: '#EF4444',
      details: 'No paperwork needed - instant claim processing',
    },
    {
      id: 7,
      title: 'Automatic Payout',
      description: 'Claims are processed and paid out automatically within 24 hours',
      icon: '💰',
      color: '#10B981',
      details: 'Fast, transparent, and hassle-free payouts',
    },
    {
      id: 8,
      title: 'Micro Loan Support',
      description: 'Access instant micro-loans for emergencies or vehicle repairs',
      icon: '🏦',
      color: '#6366F1',
      details: 'Low interest rates with flexible repayment',
    },
  ];

  return (
    <section className="animated-workflow-section">
      <div className="container">
        <motion.div
          className="workflow-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>How ResilientRider Works</h2>
          <p>A seamless journey from registration to protection</p>
        </motion.div>

        {/* Desktop Flow */}
        <div className="workflow-flow desktop-flow">
          <svg className="connection-lines" viewBox="0 0 1200 800">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
            
            {/* Animated path connecting all steps */}
            <motion.path
              d="M 150 100 L 450 100 L 450 250 L 150 250 L 150 400 L 450 400 L 450 550 L 150 550"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="10 5"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.3 }}
              viewport={{ once: true }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
          </svg>

          <div className="steps-grid">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`workflow-step ${activeStep === step.id ? 'active' : ''}`}
                style={{ '--step-color': step.color }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -10 }}
                onHoverStart={() => setActiveStep(step.id)}
                onHoverEnd={() => setActiveStep(null)}
              >
                <div className="step-number">{step.id}</div>
                
                <motion.div 
                  className="step-icon-wrapper"
                  animate={activeStep === step.id ? { rotate: [0, -10, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <span className="step-icon">{step.icon}</span>
                </motion.div>

                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>

                <motion.div
                  className="step-details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={activeStep === step.id ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p>{step.details}</p>
                </motion.div>

                <div className="step-arrow">→</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile Timeline */}
        <div className="workflow-timeline mobile-timeline">
          <div className="timeline-line">
            <motion.div
              className="timeline-progress"
              initial={{ height: 0 }}
              whileInView={{ height: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>

          <div className="timeline-steps">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className="timeline-step"
                style={{ '--step-color': step.color }}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="timeline-marker">
                  <motion.div
                    className="marker-dot"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                  >
                    <span className="marker-icon">{step.icon}</span>
                  </motion.div>
                </div>

                <div className="timeline-content">
                  <div className="timeline-number">{step.id}</div>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                  <span className="timeline-detail">{step.details}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          className="workflow-cta"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <h3>Ready to experience the future of rider insurance?</h3>
          <div className="cta-buttons">
            <motion.button
              className="btn btn-primary btn-large"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Now
            </motion.button>
            <motion.button
              className="btn btn-outline btn-large"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Watch Demo
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default AnimatedWorkflow;
