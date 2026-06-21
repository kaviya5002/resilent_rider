import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
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
import './IncomePrediction.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const FACTOR_META = [
  { icon: '📊', color: '#10B981' },
  { icon: '🌦️', color: '#F59E0B' },
  { icon: '🚦', color: '#3B82F6' },
  { icon: '📅', color: '#8B5CF6' },
];

function IncomePrediction() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    api
      .get('/ai/income-prediction')
      .then((res) => setPrediction(res.data.data))
      .catch(() => setError('Failed to load income prediction.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="income-prediction-card">
        <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="income-prediction-card">
        <p style={{ color: '#EF4444', padding: '1rem', fontSize: '0.875rem' }}>{error}</p>
      </div>
    );
  }

  const currentIncome   = prediction.currentWeek;
  const predictedIncome = prediction.predictedNextWeek;
  const confidence      = prediction.confidence;
  const growthRate      = prediction.growthRate;
  const weeklyHistory   = prediction.weeklyHistory;
  const factors         = prediction.factors.map((f, i) => ({ ...f, ...FACTOR_META[i] }));
  const insights        = prediction.insights;

  const data = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Predicted'],
    datasets: [
      {
        label: 'Actual Income',
        data: [...weeklyHistory, null],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Predicted Income',
        data: [null, null, null, currentIncome, predictedIncome],
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderDash: [5, 5],
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#F59E0B',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            weight: '600',
          },
        },
      },
      tooltip: {
        backgroundColor: '#112250',
        padding: 12,
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': $' + context.parsed.y?.toFixed(2);
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(17, 34, 80, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return '$' + value;
          },
          color: '#3C5070',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#3C5070',
        },
      },
    },
  };

  return (
    <div className="income-prediction-card">
      <div className="prediction-header">
        <div className="header-title">
          <h2>AI Income Prediction</h2>
          <span className="ml-badge">🤖 Machine Learning</span>
        </div>
        <div className="confidence-indicator">
          <span className="confidence-label">Confidence</span>
          <span className="confidence-value">{confidence}%</span>
        </div>
      </div>

      <div className="prediction-summary">
        <div className="current-income">
          <span className="label">Current Week</span>
          <span className="value">${currentIncome.toFixed(2)}</span>
        </div>
        <div className="prediction-arrow">→</div>
        <div className="predicted-income">
          <span className="label">Next Week Forecast</span>
          <span className="value predicted">${predictedIncome.toFixed(2)}</span>
          <span className="growth-badge">+{growthRate}%</span>
        </div>
      </div>

      <div className="chart-container">
        <Line data={data} options={options} />
      </div>

      <div className="prediction-factors">
        <h3>Prediction Factors</h3>
        <div className="factors-grid">
          {factors.map((factor, index) => (
            <motion.div
              key={index}
              className="factor-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <span className="factor-icon">{factor.icon}</span>
              <div className="factor-info">
                <span className="factor-label">{factor.label}</span>
                <span 
                  className="factor-impact"
                  style={{ color: factor.color }}
                >
                  {factor.impact} Impact
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="prediction-insights">
        {insights.map((insight, i) => (
          <div className="insight-item" key={i}>
            <span className="insight-icon">{i === 0 ? '💡' : '📍'}</span>
            <p>{insight}</p>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-full">View Detailed Analysis</button>
    </div>
  );
}

export default IncomePrediction;
