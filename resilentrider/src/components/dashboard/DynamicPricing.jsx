import { motion } from 'framer-motion';
import { useRiderData } from '../../context/RiderDataContext';
import './DynamicPricing.css';

function DynamicPricing() {
  const { metrics } = useRiderData();

  const riskScore = metrics?.safetyScore ?? 50;
  const prem = metrics?.premium ?? { basePremium: 20, riskFactor: 1.50, finalPremium: 30.00, riskScore: 50 };
  const { basePremium, riskFactor, finalPremium } = prem;

  const getRiskColor = (score) => score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="dynamic-pricing">
      <div className="pricing-header">
        <h2 className="section-title">Dynamic Premium Pricing</h2>
        <span className="ai-badge">⚡ AI Live</span>
      </div>
      <p className="section-subtitle">Your premium is calculated based on your real-time risk score</p>

      <motion.div className="risk-score-row" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <span className="pricing-label">🛡️ Risk Score</span>
        <span className="risk-score-value" style={{ color: getRiskColor(riskScore) }}>{riskScore} / 100</span>
      </motion.div>

      <div className="pricing-divider" />

      <div className="pricing-breakdown">
        <motion.div className="pricing-row" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <span className="pricing-label">Base Premium</span>
          <span className="pricing-value">₹{basePremium.toFixed(2)}/week</span>
        </motion.div>

        <motion.div className="pricing-row" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <span className="pricing-label">Risk Factor</span>
          <span className="pricing-value risk-factor">× {riskFactor}</span>
        </motion.div>

        <div className="pricing-divider" />

        <motion.div className="pricing-row final" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <span className="pricing-label">Your Premium</span>
          <span className="pricing-value final-value">₹{finalPremium.toFixed(2)}/week</span>
        </motion.div>
      </div>

      <div className="risk-bar-wrapper">
        <div className="risk-bar">
          <motion.div
            className="risk-bar-fill"
            style={{ background: getRiskColor(riskScore) }}
            initial={{ width: 0 }}
            animate={{ width: `${riskScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="risk-bar-labels">
          <span>High Risk</span>
          <span>Low Risk</span>
        </div>
      </div>
    </div>
  );
}

export default DynamicPricing;
