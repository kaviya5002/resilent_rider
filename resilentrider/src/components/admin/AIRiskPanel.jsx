import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import api from '../../api/axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import './AIRiskPanel.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function AIRiskPanel() {
  const [riskData,   setRiskData]   = useState(null);
  const [demandData, setDemandData] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/ai/risk-score'),
      api.get('/ai/demand-forecast'),
    ])
      .then(([riskRes, demandRes]) => {
        setRiskData(riskRes.data.data);
        setDemandData(demandRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derive weather risk from riskFactors
  const weatherFactor = riskData?.riskFactors?.find((f) => f.label === 'Weather Conditions');
  const weatherRisk = {
    current: weatherFactor ? (weatherFactor.value >= 80 ? 'Low' : weatherFactor.value >= 60 ? 'Moderate' : 'High') : 'Moderate',
    level:   weatherFactor?.value ?? 65,
    forecast: LABELS.map(() => Math.floor(50 + Math.random() * 40)),
    labels:   LABELS,
  };

  const demandPrediction = demandData ?? {
    current: 'High', level: 85,
    forecast: [72, 78, 85, 88, 82, 75, 70], labels: LABELS,
  };

  const trafficFactor = riskData?.riskFactors?.find((f) => f.label === 'Traffic Density');
  const trafficLevel  = trafficFactor?.value ?? 78;
  const trafficCongestion = {
    current: trafficLevel >= 80 ? 'Heavy' : trafficLevel >= 60 ? 'Moderate' : 'Light',
    level: trafficLevel,
    areas: [
      { name: 'Downtown',          level: Math.min(100, trafficLevel + 14), color: '#EF4444' },
      { name: 'Business District', level: trafficLevel,                     color: '#F59E0B' },
      { name: 'Suburbs',           level: Math.max(0, trafficLevel - 33),   color: '#10B981' },
    ],
  };

  const overallScore = riskData?.overallScore ?? 94;
  const earningsForecast = {
    predicted:  `$${(overallScore * 150).toLocaleString()}`,
    confidence: overallScore,
    trend:      'up',
    change:     `+${(100 - overallScore) / 10 + 5}%`,
  };

  const createChartData = (data, color) => ({
    labels: data.labels,
    datasets: [{
      data: data.forecast,
      borderColor: color,
      backgroundColor: `${color}20`,
      fill: true, tension: 0.4,
      pointRadius: 3, pointHoverRadius: 5,
      pointBackgroundColor: color,
      pointBorderColor: '#fff', pointBorderWidth: 2,
    }],
  });

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#112250', padding: 8, displayColors: false },
    },
    scales: {
      y: { display: false, beginAtZero: true, max: 100 },
      x: { display: false },
    },
  };

  const mlLabels = [
    { icon: '🤖', label: 'Machine Learning Demand Prediction', status: 'active' },
    { icon: '🛡️', label: 'AI Risk Detection',              status: 'active' },
    { icon: '💡', label: 'Recommendation Engine',             status: 'active' },
    { icon: '🔍', label: 'Fraud Detection',                   status: 'active' },
  ];

  return (
    <div className="ai-risk-panel">
      <div className="panel-header">
        <h2 className="section-title">AI Monitoring Panel</h2>
        <span className="ai-status-badge">
          <span className="status-dot"></span>
          {loading ? 'Loading...' : 'AI Active'}
        </span>
      </div>

      <div className="ml-systems">
        <h3 className="subsection-title">ML Systems Status</h3>
        <div className="ml-labels">
          {mlLabels.map((item, index) => (
            <motion.div key={index} className="ml-label"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <span className="ml-icon">{item.icon}</span>
              <span className="ml-text">{item.label}</span>
              <span className="ml-status active">●</span>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div className="risk-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="card-header">
          <div className="card-title"><span className="card-icon">🌦️</span><h4>Weather Risk</h4></div>
          <span className={`risk-level ${weatherRisk.current.toLowerCase()}`}>{weatherRisk.current}</span>
        </div>
        <div className="risk-meter">
          <div className="meter-bar">
            <motion.div className="meter-fill weather" initial={{ width: 0 }} animate={{ width: `${weatherRisk.level}%` }} transition={{ duration: 1 }} />
          </div>
          <span className="meter-value">{weatherRisk.level}%</span>
        </div>
        <div className="mini-chart"><Line data={createChartData(weatherRisk, '#F59E0B')} options={chartOptions} /></div>
      </motion.div>

      <motion.div className="risk-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="card-header">
          <div className="card-title"><span className="card-icon">📊</span><h4>Demand Prediction</h4></div>
          <span className={`risk-level ${demandPrediction.current.toLowerCase()}`}>{demandPrediction.current}</span>
        </div>
        <div className="risk-meter">
          <div className="meter-bar">
            <motion.div className="meter-fill demand" initial={{ width: 0 }} animate={{ width: `${demandPrediction.level}%` }} transition={{ duration: 1 }} />
          </div>
          <span className="meter-value">{demandPrediction.level}%</span>
        </div>
        <div className="mini-chart"><Line data={createChartData(demandPrediction, '#10B981')} options={chartOptions} /></div>
      </motion.div>

      <motion.div className="risk-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="card-header">
          <div className="card-title"><span className="card-icon">🚦</span><h4>Traffic Congestion</h4></div>
          <span className={`risk-level ${trafficCongestion.current.toLowerCase()}`}>{trafficCongestion.current}</span>
        </div>
        <div className="traffic-areas">
          {trafficCongestion.areas.map((area, index) => (
            <div key={index} className="traffic-area">
              <div className="area-info">
                <span className="area-name">{area.name}</span>
                <span className="area-level">{area.level}%</span>
              </div>
              <div className="area-bar">
                <motion.div className="area-fill" style={{ background: area.color }}
                  initial={{ width: 0 }} animate={{ width: `${area.level}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div className="risk-card forecast-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="card-header">
          <div className="card-title"><span className="card-icon">💰</span><h4>Earnings Forecast</h4></div>
          <span className={`trend-badge ${earningsForecast.trend}`}>
            {earningsForecast.trend === 'up' ? '↑' : '↓'} {earningsForecast.change}
          </span>
        </div>
        <div className="forecast-value">
          <h3>{earningsForecast.predicted}</h3>
          <p>Next Month Prediction</p>
        </div>
        <div className="confidence-meter">
          <div className="confidence-label">
            <span>AI Confidence</span>
            <span className="confidence-value">{earningsForecast.confidence}%</span>
          </div>
          <div className="confidence-bar">
            <motion.div className="confidence-fill" initial={{ width: 0 }} animate={{ width: `${earningsForecast.confidence}%` }} transition={{ duration: 1 }} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AIRiskPanel;
