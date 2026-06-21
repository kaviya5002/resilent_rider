import ScrollReveal from '../components/ScrollReveal';
import BenefitsSection from '../components/sections/BenefitsSection';
import './Benefits.css';

function Benefits() {
  return (
    <div className="benefits-page">
      <ScrollReveal variant="fadeIn">
        <div className="page-hero">
          <h1>Benefits</h1>
          <p>Discover why thousands of riders trust ResilientRider</p>
        </div>
      </ScrollReveal>

      <BenefitsSection />

      <div className="container section">
        <ScrollReveal variant="slideUp">
          <div className="cta-section">
            <h2>Ready to Experience These Benefits?</h2>
            <p>Join thousands of riders who are already protected by ResilientRider</p>
            <button className="btn btn-primary btn-large">Get Started Today</button>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default Benefits;
