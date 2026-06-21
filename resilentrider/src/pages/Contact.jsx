import { useState } from 'react';
import { motion } from 'framer-motion';
import ScrollReveal from '../components/ScrollReveal';
import RippleButton from '../components/RippleButton';
import './Contact.css';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for contacting us! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="contact-page">
      <ScrollReveal variant="fadeIn">
        <div className="page-hero">
          <h1>Contact Us</h1>
          <p>Get in touch with the ResilientRider team</p>
        </div>
      </ScrollReveal>

      <div className="container section">
        <div className="contact-grid">
          <ScrollReveal variant="slideLeft">
            <div className="contact-info">
              <h2>Get In Touch</h2>
              <p>Have questions? We're here to help!</p>

              <div className="info-items">
                <div className="info-item">
                  <div className="info-icon">📧</div>
                  <div>
                    <h4>Email</h4>
                    <p>support@resilientrider.com</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">📞</div>
                  <div>
                    <h4>Phone</h4>
                    <p>+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">📍</div>
                  <div>
                    <h4>Address</h4>
                    <p>123 Innovation Street<br />San Francisco, CA 94105</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">⏰</div>
                  <div>
                    <h4>Hours</h4>
                    <p>Monday - Friday: 9AM - 6PM<br />Saturday - Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="slideRight">
            <motion.form 
              className="contact-form"
              onSubmit={handleSubmit}
            >
              <h3>Send Us a Message</h3>

              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="How can we help?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Your message..."
                />
              </div>

              <RippleButton type="submit" className="btn btn-primary btn-full">
                Send Message
              </RippleButton>
            </motion.form>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}

export default Contact;
