import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRiderData } from '../../context/RiderDataContext';
import './EarningsOverview.css';

const EMPTY = { earnings: '', deliveries: '', hoursOnRoad: '', avgSpeed: '', hardBrakes: '', weather: 'clear', traffic: 'light' };

function EarningsOverview() {
  const { metrics, addLog, logs } = useRiderData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.earnings || isNaN(form.earnings) || +form.earnings < 0) e.earnings = 'Enter valid earnings';
    if (!form.deliveries || isNaN(form.deliveries) || +form.deliveries < 0) e.deliveries = 'Enter valid deliveries';
    if (!form.hoursOnRoad || isNaN(form.hoursOnRoad) || +form.hoursOnRoad <= 0) e.hoursOnRoad = 'Enter hours on road';
    if (!form.avgSpeed || isNaN(form.avgSpeed) || +form.avgSpeed <= 0) e.avgSpeed = 'Enter average speed';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    addLog({
      earnings: parseFloat(form.earnings),
      deliveries: parseInt(form.deliveries),
      hoursOnRoad: parseFloat(form.hoursOnRoad),
      avgSpeed: parseFloat(form.avgSpeed),
      hardBrakes: parseInt(form.hardBrakes) || 0,
      weather: form.weather,
      traffic: form.traffic,
    });
    setForm(EMPTY);
    setShowForm(false);
  };

  const stats = metrics
    ? [
        { label: "Today's Earnings", value: `₹${metrics.todayEarnings.toFixed(2)}`, icon: '💰', trend: 'up' },
        { label: 'Weekly Earnings', value: `₹${metrics.weeklyEarnings.toFixed(2)}`, icon: '📊', trend: 'up' },
        { label: 'Total Deliveries', value: metrics.totalDeliveries.toLocaleString(), icon: '📦', trend: 'up' },
        { label: 'Safety Score', value: `${metrics.safetyScore}/100`, icon: '🛡️', trend: metrics.safetyScore >= 70 ? 'up' : 'down' },
      ]
    : [];

  return (
    <div className="earnings-overview">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Earnings Overview</h2>
        <motion.button
          className="btn btn-primary"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(v => !v)}
          style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
        >
          {showForm ? 'Cancel' : '+ Log Today\'s Ride'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            className="ride-log-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: '1.5rem', background: 'rgba(17,34,80,0.04)', borderRadius: '12px', padding: '1.2rem' }}
          >
            <p style={{ fontWeight: 600, marginBottom: '1rem', color: '#112250' }}>📋 Log Today's Ride</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { name: 'earnings', label: 'Earnings (₹)', placeholder: 'e.g. 120' },
                { name: 'deliveries', label: 'Deliveries', placeholder: 'e.g. 8' },
                { name: 'hoursOnRoad', label: 'Hours on Road', placeholder: 'e.g. 6' },
                { name: 'avgSpeed', label: 'Avg Speed (km/h)', placeholder: 'e.g. 45' },
                { name: 'hardBrakes', label: 'Hard Brakes', placeholder: 'e.g. 2' },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label style={{ fontSize: '0.78rem', color: '#3C5070', display: 'block', marginBottom: '0.25rem' }}>{label}</label>
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                    style={{ width: '100%', padding: '0.45rem 0.7rem', borderRadius: '8px', border: errors[name] ? '1px solid #EF4444' : '1px solid #D9CBC2', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                  {errors[name] && <span style={{ color: '#EF4444', fontSize: '0.72rem' }}>{errors[name]}</span>}
                </div>
              ))}

              <div>
                <label style={{ fontSize: '0.78rem', color: '#3C5070', display: 'block', marginBottom: '0.25rem' }}>Weather</label>
                <select value={form.weather} onChange={e => setForm(p => ({ ...p, weather: e.target.value }))}
                  style={{ width: '100%', padding: '0.45rem 0.7rem', borderRadius: '8px', border: '1px solid #D9CBC2', fontSize: '0.875rem' }}>
                  <option value="clear">☀️ Clear</option>
                  <option value="cloudy">☁️ Cloudy</option>
                  <option value="rainy">🌧️ Rainy</option>
                  <option value="foggy">🌫️ Foggy</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#3C5070', display: 'block', marginBottom: '0.25rem' }}>Traffic</label>
                <select value={form.traffic} onChange={e => setForm(p => ({ ...p, traffic: e.target.value }))}
                  style={{ width: '100%', padding: '0.45rem 0.7rem', borderRadius: '8px', border: '1px solid #D9CBC2', fontSize: '0.875rem' }}>
                  <option value="light">🟢 Light</option>
                  <option value="moderate">🟡 Moderate</option>
                  <option value="heavy">🔴 Heavy</option>
                </select>
              </div>
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary btn-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ marginTop: '1rem' }}
            >
              Save & Calculate AI Metrics
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {!metrics ? (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
          <p style={{ fontSize: '1.1rem' }}>🏍️ No ride data yet</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Log your first ride to see AI-powered insights</p>
        </div>
      ) : (
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="stat-card"
              whileHover={{ y: -5, boxShadow: '0 12px 24px rgba(17, 34, 80, 0.15)' }}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value">{stat.value}</h3>
                <span className={`stat-change ${stat.trend}`}>
                  {stat.trend === 'up' ? '↑' : '↓'} AI Computed
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {logs.length > 0 && (
        <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.75rem', textAlign: 'right' }}>
          {logs.length} ride{logs.length > 1 ? 's' : ''} logged
        </p>
      )}
    </div>
  );
}

export default EarningsOverview;
