import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './Hero.css';

// Stagger container — children animate in sequence
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const STATS = [
  { value: '50K+', label: 'Riders Protected' },
  { value: '98%',  label: 'Claim Approval' },
  { value: '2.4s', label: 'Avg Response Time' },
  { value: '24/7', label: 'AI Monitoring' },
];

function Hero() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const featuresRef = useRef(null);

  // Smart CTA: logged-in users go to their dashboard
  const handleCTA = () => {
    if (!user) { navigate('/signup'); return; }
    navigate(user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
  };

  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="hero">
      {/* ── Decorative blobs ─────────────────────────────────────── */}
      <div className="hero-blob hero-blob--1" aria-hidden="true" />
      <div className="hero-blob hero-blob--2" aria-hidden="true" />
      <div className="hero-blob hero-blob--3" aria-hidden="true" />

      <div className="hero-content">
        {/* ── Badge ────────────────────────────────────────────────── */}
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="hero-badge__dot" />
          AI-Powered Gig Worker Protection
        </motion.div>

        {/* ── Headline + subtext ───────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hero-text"
        >
          <motion.h1 variants={itemVariants} className="hero-headline">
            Insurance that{' '}
            <span className="hero-headline__accent">moves with you.</span>
            <br />
            Protection that{' '}
            <span className="hero-headline__accent">understands you.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-subtext">
            AI-powered protection, income stability, and smart insights
            for gig workers — built for the road you actually ride.
          </motion.p>

          {/* ── Buttons ──────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="hero-buttons">
            <motion.button
              className="btn btn-primary hero-btn hero-btn--primary"
              onClick={handleCTA}
              whileHover={{ scale: 1.04, boxShadow: '0 8px 28px rgba(17,34,80,0.28)' }}
              whileTap={{ scale: 0.97 }}
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
              <span className="hero-btn__arrow">→</span>
            </motion.button>

            {!user && (
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link to="/login" className="btn btn-outline hero-btn">
                  Login
                </Link>
              </motion.div>
            )}

            <motion.button
              className="btn hero-btn hero-btn--ghost"
              onClick={scrollToFeatures}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Explore Features
              <span className="hero-btn__chevron">↓</span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* ── Stats strip ──────────────────────────────────────────── */}
        <motion.div
          className="hero-stats"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
        >
          {STATS.map((s, i) => (
            <div key={i} className="hero-stat">
              <span className="hero-stat__value">{s.value}</span>
              <span className="hero-stat__label">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
