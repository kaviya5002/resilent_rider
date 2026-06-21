import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useRiderData } from '../../context/RiderDataContext';
import './WeeklyEarningsChart.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function WeeklyEarningsChart() {
  const { metrics } = useRiderData();

  const chartValues = metrics?.chartData || [0, 0, 0, 0, 0, 0, 0];
  const total = chartValues.reduce((s, v) => s + v, 0);

  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Earnings (₹)',
      data: chartValues,
      borderColor: '#112250',
      backgroundColor: 'rgba(17, 34, 80, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: '#E0B88F',
      pointBorderColor: '#112250',
      pointBorderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#112250',
        padding: 12,
        titleColor: '#E0B88F',
        bodyColor: '#FFFFFF',
        borderColor: '#E0B88F',
        borderWidth: 1,
        displayColors: false,
        callbacks: { label: (ctx) => `₹${ctx.parsed.y}` },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(17, 34, 80, 0.1)' },
        ticks: { callback: (v) => '₹' + v, color: '#3C5070' },
      },
      x: { grid: { display: false }, ticks: { color: '#3C5070' } },
    },
  };

  return (
    <div className="weekly-earnings-chart">
      <div className="chart-header">
        <h2 className="section-title">Weekly Earnings</h2>
        <div className="chart-summary">
          <span className="total-earnings">₹{total.toFixed(2)}</span>
          {total > 0 && <span className="earnings-change up">↑ AI Tracked</span>}
        </div>
      </div>
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default WeeklyEarningsChart;
