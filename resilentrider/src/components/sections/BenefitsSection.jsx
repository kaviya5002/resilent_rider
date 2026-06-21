import { motion } from 'framer-motion';
import './BenefitsSection.css';

function BenefitsSection() {
  const benefits = [
    {
      icon: '💰',
      title: 'Affordable Premiums',
      description: 'Pay-as-you-ride pricing that fits your budget',
    },
    {
      icon: '⚡',
      title: 'Instant Claims',
      description: 'Fast claim processing with AI verification',
    },
    {
      icon: '📊',
      title: 'Safety Analytics',
      description: 'Detailed insights to improve your riding',
    },
    {
      icon: '🛡️',
      title: 'Full Coverage',
      description: 'Comprehensive protection for every ride',
    },
    {
      icon: '🎯',
      title: 'Personalized Plans',
      description: 'Coverage tailored to your riding habits',
    },
    {
      icon: '🌟',
      title: 'Rewards Program',
      description: 'Earn rewards for safe riding behavior',
    },
  ];

  return (
    <section className="benefits-section section" data-aos="fade-up">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Why Choose ResilientRider?</h2>
          <p>Benefits designed for modern delivery riders</p>
        </motion.div>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="benefit-card"
              data-aos="flip-left"
              data-aos-delay={index * 50}
              whileHover={{ y: -10 }}
            >
              <div className="benefit-icon">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="insurance-illustration" data-aos="zoom-in" data-aos-delay="400">
          <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="150" r="100" fill="#E0B88F" opacity="0.2"/>
            <path d="M 200 80 L 250 120 L 250 180 L 200 220 L 150 180 L 150 120 Z" fill="#112250"/>
            <circle cx="200" cy="150" r="30" fill="#E0B88F"/>
            <path d="M 190 150 L 197 157 L 210 140" stroke="#112250" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="200" cy="150" r="70" stroke="#3C5070" strokeWidth="2" fill="none" strokeDasharray="5,5">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 200 150"
                to="360 200 150"
                dur="15s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>
      </div>
    </section>
  );
}

export default BenefitsSection;
