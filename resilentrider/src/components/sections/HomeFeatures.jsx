import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './HomeFeatures.css';

const FEATURES = [
  {
    icon: '🛡️',
    title: 'AI Risk Monitoring',
    description:
      'Real-time risk scoring powered by machine learning. Know your safety level before every ride.',
    path: '/ai-technology',
    color: '#112250',
    glow: 'rgba(17,34,80,0.18)',
  },
  {
    icon: '📍',
    title: 'Smart Relocation',
    description:
      'AI-driven zone suggestions that maximise your earnings based on demand, weather, and traffic.',
    path: '/user-dashboard',
    color: '#E0B88F',
    glow: 'rgba(224,184,143,0.28)',
  },
  {
    icon: '📈',
    title: 'Income Prediction',
    description:
      "Weighted moving average forecasts your next week's earnings with up to 95% confidence.",
    path: '/user-dashboard',
    color: '#3C5070',
    glow: 'rgba(60,80,112,0.18)',
  },
  {
    icon: '💳',
    title: 'Insurance Wallet',
    description:
      'Parametric insurance that pays out automatically — no paperwork, no waiting, no hassle.',
    path: '/benefits',
    color: '#10B981',
    glow: 'rgba(16,185,129,0.18)',
  },
];

const cardVariants = {
  hidden:  { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

function HomeFeatures() {
  const navigate = useNavigate();

  return (
    <section className="home-features" id="features">
      <div className="home-features__container">
        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.div
          className="home-features__header"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="home-features__eyebrow">What We Offer</span>
          <h2 className="home-features__title">
            Everything a gig worker needs,<br />
            <span className="home-features__title-accent">in one intelligent platform.</span>
          </h2>
          <p className="home-features__subtitle">
            Four core AI systems working together to protect your income and your safety.
          </p>
        </motion.div>

        {/* ── Cards ──────────────────────────────────────────────── */}
        <div className="home-features__grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="hf-card"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{
                y: -10,
                boxShadow: `0 20px 48px ${f.glow}`,
                transition: { duration: 0.22 },
              }}
              onClick={() => navigate(f.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(f.path)}
              aria-label={`Learn more about ${f.title}`}
            >
              {/* Glow accent top-bar */}
              <div
                className="hf-card__bar"
                style={{ background: f.color }}
              />

              <div
                className="hf-card__icon-wrap"
                style={{ background: `${f.glow}`, border: `1.5px solid ${f.glow}` }}
              >
                <span className="hf-card__icon">{f.icon}</span>
              </div>

              <h3 className="hf-card__title">{f.title}</h3>
              <p className="hf-card__desc">{f.description}</p>

              <span className="hf-card__cta">
                Learn more <span className="hf-card__arrow">→</span>
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HomeFeatures;
