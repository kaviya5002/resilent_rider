import { motion } from 'framer-motion';
import './WorkflowSection.css';

function WorkflowSection() {
  const steps = [
    { number: '01', title: 'Sign Up', description: 'Create your account in minutes', icon: '📝' },
    { number: '02', title: 'Install App', description: 'Download and set up the mobile app', icon: '📱' },
    { number: '03', title: 'Start Riding', description: 'AI monitors your safety in real-time', icon: '🏍️' },
    { number: '04', title: 'Stay Protected', description: 'Automatic coverage on every delivery', icon: '🛡️' },
  ];

  return (
    <section className="workflow-section section" data-aos="fade-up">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>How It Works</h2>
          <p>Get started in 4 simple steps</p>
        </motion.div>

        <div className="workflow-steps">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="workflow-step"
              data-aos="fade-up"
              data-aos-delay={index * 100}
              whileHover={{ scale: 1.05 }}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="workflow-cta" data-aos="zoom-in" data-aos-delay="400">
          <h3>Ready to ride with confidence?</h3>
          <button className="btn btn-primary">Get Started Now</button>
        </div>
      </div>
    </section>
  );
}

export default WorkflowSection;
