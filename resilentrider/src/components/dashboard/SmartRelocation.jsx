import { motion } from 'framer-motion';
import { useRiderData } from '../../context/RiderDataContext';
import './SmartRelocation.css';

const DEMAND_ICONS = { High: '🔥', Medium: '📈', Low: '🛍️' };

function SmartRelocation() {
  const { metrics } = useRiderData();

  const suggestions = metrics?.zones || [];

  return (
    <div className="smart-relocation">
      <div className="section-header-with-badge">
        <h2 className="section-title">Smart Relocation Suggestions</h2>
        <span className="ai-badge">🤖 AI Powered</span>
      </div>
      <p className="section-subtitle">Maximize your earnings by relocating to high-demand areas</p>

      {!metrics && (
        <p style={{ opacity: 0.6, padding: '1rem 0', fontSize: '0.875rem' }}>Log a ride to get AI relocation suggestions.</p>
      )}

      <div className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={index}
            className="suggestion-card"
            whileHover={{ scale: 1.02 }}
            data-aos="fade-up"
            data-aos-delay={index * 100}
          >
            <div className="suggestion-icon">{DEMAND_ICONS[suggestion.demand] || '📍'}</div>
            <div className="suggestion-content">
              <h3>{suggestion.zoneName}</h3>
              <div className="suggestion-details">
                <span className={`demand-badge ${suggestion.demand.toLowerCase()}`}>{suggestion.demand} Demand</span>
                <span className="detail-item">📍 {suggestion.distance}</span>
              </div>
            </div>
            <div className="suggestion-earnings">
              <span className="earnings-value">{suggestion.expectedEarningsBoost}</span>
              <button className="btn-navigate">Navigate</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default SmartRelocation;
