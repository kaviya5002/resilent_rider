import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';
import { useRiderData } from '../../context/RiderDataContext';
import './AIRiskMonitoring.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function AIRiskMonitoring() {
  const { metrics } = useRiderData();

  const riskScore = metrics?.safetyScore ?? 0;
  const rf = metrics?.riskFactors;

  const riskFactors = rf
    ? [
        { label: 'Speed Control', value: rf.speedControl, status: rf.speedControl >= 80 ? 'good' : 'warning' },
        { label: 'Route Safety', value: rf.routeSafety, status: rf.routeSafety >= 80 ? 'good' : 'warning' },
        { label: 'Weather Conditions', value: rf.weatherScore, status: rf.weatherScore >= 80 ? 'good' : 'warning' },
        { label: 'Traffic Density', value: rf.trafficScore, status: rf.trafficScore >= 80 ? 'good' : 'warning' },
      ]
    : [];

  const data = {
    labels: ['Safe', 'At Risk'],
    datasets: [{
      data: [riskScore, 100 - riskScore],
      backgroundColor: [riskScore >= 80 ? '#10B981' : riskScore >= 60 ? '#F59E0B' : '#EF4444', '#F5F0E9'],
      borderWidth: 0,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  const statusLabel = riskScore >= 80 ? '✓ Safe to Ride' : riskScore >= 60 ? '⚠ Moderate Risk' : '✗ High Risk';
  const statusClass = riskScore >= 80 ? 'safe' : riskScore >= 60 ? 'warning' : 'danger';
  const statusMsg = riskScore >= 80 ? 'Your riding behavior is excellent!' : riskScore >= 60 ? 'Some risk factors detected. Stay cautious.' : 'High risk detected. Please ride carefully.';

  if (!metrics) {
    return (
      <div className="ai-risk-monitoring">
        <h2 className="section-title">AI Risk Monitoring</h2>
        <p style={{ opacity: 0.6, padding: '1rem 0', fontSize: '0.875rem' }}>Log a ride to see your AI risk analysis.</p>
      </div>
    );
  }

  return (
    <div className="ai-risk-monitoring">
      <h2 className="section-title">AI Risk Monitoring</h2>
      <div className="risk-content">
        <div className="risk-score-container">
          <div className="doughnut-wrapper">
            <Doughnut data={data} options={options} />
            <div className="score-overlay">
              <span className="score-value">{riskScore}</span>
              <span className="score-label">Safety Score</span>
            </div>
          </div>
          <div className="risk-status">
            <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
            <p className="status-message">{statusMsg}</p>
          </div>
        </div>

        <div className="risk-factors">
          <h3>Risk Factors</h3>
          {riskFactors.map((factor, index) => (
            <motion.div
              key={index}
              className="risk-factor"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="factor-info">
                <span className="factor-label">{factor.label}</span>
                <span className={`factor-status ${factor.status}`}>{factor.status === 'good' ? '✓' : '⚠'}</span>
              </div>
              <div className="factor-bar">
                <motion.div
                  className={`factor-fill ${factor.status}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${factor.value}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </div>
              <span className="factor-value">{factor.value}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AIRiskMonitoring;
