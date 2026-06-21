import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../../api/axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './ClaimsAnalytics.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function ClaimsAnalytics() {
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/claims')
      .then((res) => setClaims(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Aggregate by claimType for bar chart
  const typeMap = { accident: 0, medical: 0, vehicle_damage: 0, theft: 0, emergency: 0 };
  claims.forEach((c) => { if (typeMap[c.claimType] !== undefined) typeMap[c.claimType] += c.amount || 0; });

  const barData = {
    labels: ['Accident', 'Medical', 'Vehicle', 'Theft', 'Emergency'],
    datasets: [{
      label: 'Claims by Type',
      data: Object.values(typeMap),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderRadius: 8,
    }],
  };

  // Aggregate by status for doughnut
  const approved = claims.filter((c) => c.status === 'approved' || c.status === 'paid').length;
  const pending  = claims.filter((c) => ['submitted', 'under_review'].includes(c.status)).length;
  const rejected = claims.filter((c) => c.status === 'rejected').length;
  const total    = claims.length;

  const doughnutData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [{
      data: [approved, pending, rejected],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#112250',
        padding: 12,
        callbacks: { label: (ctx) => '$' + ctx.parsed.y.toLocaleString() },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(17, 34, 80, 0.1)' },
        ticks: { callback: (v) => '$' + (v / 1000) + 'K' },
      },
      x: { grid: { display: false } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true } },
      tooltip: { backgroundColor: '#112250', padding: 12 },
    },
  };

  return (
    <div className="claims-analytics">
      <h2 className="section-title">Claims Analytics</h2>

      {loading && <p style={{ opacity: 0.6, padding: '1rem', fontSize: '0.875rem' }}>Loading...</p>}

      {!loading && (
        <div className="analytics-grid">
          <div className="chart-section">
            <h3 className="chart-title">Claims by Type</h3>
            <div className="bar-chart-container">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          <div className="chart-section">
            <h3 className="chart-title">Claims Status</h3>
            <div className="doughnut-chart-container">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="doughnut-center">
                <span className="center-value">{total}</span>
                <span className="center-label">Total Claims</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClaimsAnalytics;
