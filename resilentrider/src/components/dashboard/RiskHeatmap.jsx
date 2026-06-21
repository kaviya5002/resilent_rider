import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import './RiskHeatmap.css';

function RiskHeatmap() {
  const [selectedZone, setSelectedZone] = useState(null);
  const [zones, setZones]               = useState([]);
  const [timeSlots, setTimeSlots]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    api
      .get('/ai/heatmap')
      .then((res) => {
        setZones(res.data.data.zones);
        setTimeSlots(res.data.data.timeSlots);
      })
      .catch(() => setError('Failed to load heatmap data.'))
      .finally(() => setLoading(false));
  }, []);

  const getRiskLevel = (risk) => {
    if (risk >= 75) return 'High Risk';
    if (risk >= 50) return 'Medium Risk';
    return 'Low Risk';
  };

  const getRiskColor = (risk) => {
    if (risk >= 75) return '#EF4444';
    if (risk >= 50) return '#F59E0B';
    return '#10B981';
  };

  if (loading) {
    return (
      <div className="risk-heatmap-card">
        <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="risk-heatmap-card">
        <p style={{ color: '#EF4444', padding: '1rem', fontSize: '0.875rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="risk-heatmap-card">
      <div className="heatmap-header">
        <div>
          <h2>Risk Heatmap</h2>
          <p className="heatmap-subtitle">Real-time risk analysis across city zones</p>
        </div>
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span>Live Data</span>
        </div>
      </div>

      <div className="heatmap-container">
        <svg className="heatmap-svg" viewBox="0 0 100 100">
          <defs>
            <radialGradient id="highRisk" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.1" />
            </radialGradient>
            <radialGradient id="mediumRisk" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
            </radialGradient>
            <radialGradient id="lowRisk" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
            </radialGradient>
          </defs>

          {/* Heat zones */}
          {zones.map((zone) => (
            <motion.circle
              key={zone.id}
              cx={zone.x}
              cy={zone.y}
              r="12"
              fill={`url(#${zone.risk >= 75 ? 'highRisk' : zone.risk >= 50 ? 'mediumRisk' : 'lowRisk'})`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: zone.id * 0.1, duration: 0.5 }}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedZone(zone)}
            />
          ))}

          {/* Zone markers */}
          {zones.map((zone) => (
            <motion.g
              key={`marker-${zone.id}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: zone.id * 0.1 + 0.3, type: 'spring' }}
              whileHover={{ scale: 1.2 }}
              onClick={() => setSelectedZone(zone)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={zone.x}
                cy={zone.y}
                r="2"
                fill={getRiskColor(zone.risk)}
                stroke="white"
                strokeWidth="0.5"
              />
            </motion.g>
          ))}
        </svg>

        {selectedZone && (
          <motion.div
            className="zone-tooltip"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <button className="tooltip-close" onClick={() => setSelectedZone(null)}>✕</button>
            <h4>{selectedZone.name}</h4>
            <div className="tooltip-risk">
              <span 
                className="risk-badge"
                style={{ 
                  background: `${getRiskColor(selectedZone.risk)}20`,
                  color: getRiskColor(selectedZone.risk)
                }}
              >
                {getRiskLevel(selectedZone.risk)}
              </span>
              <span className="risk-percentage">{selectedZone.risk}%</span>
            </div>
            <div className="tooltip-details">
              <div className="detail-row">
                <span>🚦 Traffic</span>
                <span>Heavy</span>
              </div>
              <div className="detail-row">
                <span>🌦️ Weather</span>
                <span>Clear</span>
              </div>
              <div className="detail-row">
                <span>📊 Demand</span>
                <span>High</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="risk-legend">
        <h3>Risk Levels</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot high"></span>
            <span>High Risk (75%+)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot medium"></span>
            <span>Medium Risk (50-74%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot low"></span>
            <span>Low Risk (&lt;50%)</span>
          </div>
        </div>
      </div>

      <div className="time-risk-analysis">
        <h3>Risk by Time of Day</h3>
        <div className="time-slots">
          {timeSlots.map((slot, index) => (
            <motion.div
              key={index}
              className="time-slot"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="time-label">{slot.time}</span>
              <div className="time-bar">
                <motion.div
                  className="time-fill"
                  style={{ background: getRiskColor(slot.risk) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${slot.risk}%` }}
                  transition={{ duration: 1, delay: index * 0.05 }}
                />
              </div>
              <span className="time-value">{slot.risk}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RiskHeatmap;
