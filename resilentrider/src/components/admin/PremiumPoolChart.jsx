import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import './PremiumPoolChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function PremiumPoolChart() {
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Premium Pool ($)',
        data: [450000, 520000, 580000, 650000, 720000, 810000, 890000, 950000, 1020000, 1100000, 1180000, 1247850],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Claims Paid ($)',
        data: [120000, 135000, 145000, 160000, 175000, 190000, 210000, 230000, 250000, 280000, 310000, 342500],
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
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
          padding: 20,
          font: {
            size: 12,
            weight: '600',
          },
        },
      },
      tooltip: {
        backgroundColor: '#112250',
        padding: 12,
        titleColor: '#E0B88F',
        bodyColor: '#FFFFFF',
        borderColor: '#E0B88F',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
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
            return '$' + (value / 1000) + 'K';
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
    <div className="premium-pool-chart">
      <div className="chart-header">
        <div>
          <h2 className="section-title">Premium Pool Growth</h2>
          <p className="chart-subtitle">Monthly premium collection vs claims paid</p>
        </div>
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-dot green"></span>
            <span className="stat-text">Net Growth: $905K</span>
          </div>
        </div>
      </div>
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default PremiumPoolChart;
