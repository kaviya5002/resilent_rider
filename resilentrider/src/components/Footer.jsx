import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-column">
            <h3 className="footer-brand">ResilientRider</h3>
            <p>AI-powered insurance and safety monitoring for delivery riders.</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook">📘</a>
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="Instagram">📷</a>
              <a href="#" aria-label="LinkedIn">💼</a>
            </div>
          </div>

          <div className="footer-column">
            <h4>Product</h4>
            <ul>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/ai-technology">AI Technology</Link></li>
              <li><Link to="/benefits">Benefits</Link></li>
              <li><Link to="/user-dashboard">Dashboard</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Legal</h4>
            <ul>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/insurance">Insurance Terms</Link></li>
              <li><Link to="/cookies">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 ResilientRider. All rights reserved.</p>
          <p>Made with ❤️ for delivery riders everywhere</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
