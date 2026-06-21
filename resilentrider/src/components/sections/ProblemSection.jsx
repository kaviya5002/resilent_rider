import { motion } from 'framer-motion';
import './ProblemSection.css';

function ProblemSection() {
  return (
    <section className="problem-section section" data-aos="fade-up">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>The Challenge Delivery Riders Face</h2>
          <p>Every day, delivery riders risk their safety on the road</p>
        </motion.div>

        <div className="problem-grid">
          <motion.div 
            className="problem-card"
            data-aos="fade-right"
            data-aos-delay="100"
          >
            <div className="problem-icon">⚠️</div>
            <h3>High Risk</h3>
            <p>Delivery riders face constant danger from traffic, weather, and road conditions.</p>
          </motion.div>

          <motion.div 
            className="problem-card"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <div className="problem-icon">💰</div>
            <h3>Limited Coverage</h3>
            <p>Traditional insurance often doesn't cover the unique risks of gig economy workers.</p>
          </motion.div>

          <motion.div 
            className="problem-card"
            data-aos="fade-left"
            data-aos-delay="300"
          >
            <div className="problem-icon">📊</div>
            <h3>No Safety Insights</h3>
            <p>Riders lack real-time data and feedback to improve their safety on the road.</p>
          </motion.div>
        </div>

        <div className="illustration-container" data-aos="zoom-in" data-aos-delay="400">
          <div className="delivery-rider-illustration">
            <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="150" r="120" fill="transparent" opacity="0.5"/>
              <rect x="150" y="100" width="100" height="120" rx="10" fill="#3C5070"/>
              <circle cx="200" cy="80" r="25" fill="#E0B88F"/>
              <rect x="180" y="180" width="15" height="40" fill="#112250"/>
              <rect x="205" y="180" width="15" height="40" fill="#112250"/>
              <circle cx="160" cy="230" r="15" fill="#112250"/>
              <circle cx="240" cy="230" r="15" fill="#112250"/>
              <path d="M 220 100 L 280 120 L 280 180 L 220 160 Z" fill="#E0B88F" opacity="0.7"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProblemSection;
