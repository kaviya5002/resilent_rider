import { motion } from 'framer-motion';
import './AITechnologySection.css';

function AITechnologySection() {
  return (
    <section className="ai-section section" data-aos="fade-up">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Powered by Advanced AI</h2>
          <p>Machine learning that keeps you safe on every ride</p>
        </motion.div>

        <div className="ai-content">
          <motion.div 
            className="ai-illustration"
            data-aos="fade-right"
          >
            <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <rect x="100" y="100" width="200" height="200" rx="20" fill="#112250"/>
              <circle cx="150" cy="150" r="15" fill="#E0B88F">
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="250" cy="150" r="15" fill="#E0B88F">
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" begin="0.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="200" cy="200" r="15" fill="#E0B88F">
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" begin="1s" repeatCount="indefinite"/>
              </circle>
              <circle cx="150" cy="250" r="15" fill="#E0B88F">
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" begin="1.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="250" cy="250" r="15" fill="#E0B88F">
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" begin="0.7s" repeatCount="indefinite"/>
              </circle>
              <line x1="150" y1="150" x2="200" y2="200" stroke="#3C5070" strokeWidth="2"/>
              <line x1="250" y1="150" x2="200" y2="200" stroke="#3C5070" strokeWidth="2"/>
              <line x1="200" y1="200" x2="150" y2="250" stroke="#3C5070" strokeWidth="2"/>
              <line x1="200" y1="200" x2="250" y2="250" stroke="#3C5070" strokeWidth="2"/>
            </svg>
          </motion.div>

          <motion.div 
            className="ai-features"
            data-aos="fade-left"
          >
            <div className="ai-feature-card" data-aos="fade-up" data-aos-delay="100">
              <div className="ai-icon">🧠</div>
              <h3>Behavior Analysis</h3>
              <p>AI learns your riding patterns and provides personalized safety recommendations.</p>
            </div>

            <div className="ai-feature-card" data-aos="fade-up" data-aos-delay="200">
              <div className="ai-icon">🚨</div>
              <h3>Accident Detection</h3>
              <p>Instant detection of accidents with automatic emergency response activation.</p>
            </div>

            <div className="ai-feature-card" data-aos="fade-up" data-aos-delay="300">
              <div className="ai-icon">📍</div>
              <h3>Route Optimization</h3>
              <p>Smart route suggestions based on safety data and traffic conditions.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default AITechnologySection;
