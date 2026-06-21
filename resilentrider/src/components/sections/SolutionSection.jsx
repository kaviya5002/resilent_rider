import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './SolutionSection.css';

function SolutionSection() {
  const navigate = useNavigate();
  return (
    <section className="solution-section section" data-aos="fade-up">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>ResilientRider: Your Safety Partner</h2>
          <p>AI-powered insurance and safety monitoring for delivery riders</p>
        </motion.div>

        <div className="solution-content">
          <motion.div 
            className="solution-text"
            data-aos="fade-right"
          >
            <h3>Smart Protection for Modern Riders</h3>
            <p>
              ResilientRider combines cutting-edge AI technology with comprehensive 
              insurance coverage to protect delivery riders on every journey.
            </p>
            <ul className="solution-features">
              <li>✓ Real-time safety monitoring</li>
              <li>✓ Instant accident detection</li>
              <li>✓ Personalized risk assessment</li>
              <li>✓ Affordable premium rates</li>
            </ul>
            <button className="btn btn-primary" onClick={() => navigate('/how-it-works')}>Learn More</button>
          </motion.div>

          <motion.div 
            className="solution-illustration"
            data-aos="fade-left"
          >
            <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="200" r="150" fill="#E0B88F" opacity="0.2"/>
              <circle cx="200" cy="200" r="100" fill="#3C5070" opacity="0.3"/>
              <rect x="150" y="150" width="100" height="100" rx="15" fill="#112250"/>
              <circle cx="200" cy="180" r="20" fill="#E0B88F"/>
              <path d="M 180 200 L 220 200 L 200 240 Z" fill="#E0B88F"/>
              <circle cx="200" cy="200" r="80" stroke="#E0B88F" strokeWidth="3" fill="none" strokeDasharray="5,5">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 200 200"
                  to="360 200 200"
                  dur="10s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default SolutionSection;
