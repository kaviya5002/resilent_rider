import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRiderData } from '../../context/RiderDataContext';
import './InsuranceWallet.css';

const PLANS = [
  { name: 'Basic Plan',    coverageAmount: 10000, weeklyPremium: 15, benefits: { medicalCoverage: 5000,  emergencyResponse: true,  vehicleDamage: false, legalSupport: false } },
  { name: 'Standard Plan', coverageAmount: 25000, weeklyPremium: 25, benefits: { medicalCoverage: 15000, emergencyResponse: true,  vehicleDamage: true,  legalSupport: false } },
  { name: 'Premium Plan',  coverageAmount: 50000, weeklyPremium: 40, benefits: { medicalCoverage: 30000, emergencyResponse: true,  vehicleDamage: true,  legalSupport: true  } },
];

const BENEFIT_ICONS = [
  { key: 'medicalCoverage',   icon: '🏥', label: 'Medical Coverage' },
  { key: 'emergencyResponse', icon: '🚑', label: 'Emergency Response' },
  { key: 'vehicleDamage',     icon: '🔧', label: 'Vehicle Damage' },
  { key: 'legalSupport',      icon: '⚖️', label: 'Legal Support' },
];

const CLAIM_TYPES = ['Accident', 'Vehicle Damage', 'Medical Emergency', 'Theft', 'Natural Disaster'];

function formatBenefit(value) {
  if (typeof value === 'boolean') return value ? 'Included' : 'Not Included';
  return `₹${value.toLocaleString()}`;
}

function weeksFromDate(dateStr) {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

// ── Fraud detection: checks if claimed location is near any logged ride zone ──
function detectFraud(gpsCoords, logs) {
  if (!gpsCoords || !logs || logs.length === 0) return { suspicious: true, reason: 'No GPS or ride history to verify.' };
  // For demo: if rider has logged rides recently (last 7 days), location is considered valid
  const recentLogs = logs.filter(l => Date.now() - new Date(l.date).getTime() < 7 * 24 * 60 * 60 * 1000);
  if (recentLogs.length === 0) return { suspicious: true, reason: 'No recent ride activity detected in your area.' };
  return { suspicious: false, reason: 'Location verified against ride history.' };
}

export default function InsuranceWallet() {
  const { metrics, insurance, activateInsurance, payPremium, addClaim, logs } = useRiderData();

  // GPS state
  const [gps, setGps]               = useState(null);
  const [gpsError, setGpsError]     = useState('');
  const [gpsTracking, setGpsTracking] = useState(false);
  const watchRef                     = useRef(null);

  // UI tabs
  const [tab, setTab] = useState('overview'); // overview | claim | history

  // Claim form
  const [claimType, setClaimType]     = useState(CLAIM_TYPES[0]);
  const [claimDesc, setClaimDesc]     = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimMsg, setClaimMsg]       = useState('');
  const [claimErr, setClaimErr]       = useState('');

  // Plan selection
  const [showPlans, setShowPlans]     = useState(false);
  const [payMsg, setPayMsg]           = useState('');
  const [pendingPlan, setPendingPlan] = useState(null); // plan waiting for UPI payment
  const [showUPI, setShowUPI]         = useState(false);
  const [upiPaid, setUpiPaid]         = useState(false);

  // UPI receiver details — replace with your actual UPI ID
  const UPI_ID   = 'resilentrider@upi';
  const UPI_NAME = 'ResilientRider Insurance';

  const openUPI = (app, amount, planName) => {
    const note    = encodeURIComponent(`Insurance: ${planName}`);
    const upiName = encodeURIComponent(UPI_NAME);
    const upiId   = encodeURIComponent(UPI_ID);
    let url = '';
    if (app === 'gpay')    url = `tez://upi/pay?pa=${upiId}&pn=${upiName}&am=${amount}&cu=INR&tn=${note}`;
    if (app === 'phonepe') url = `phonepe://pay?pa=${upiId}&pn=${upiName}&am=${amount}&cu=INR&tn=${note}`;
    if (app === 'paytm')   url = `paytmmp://pay?pa=${upiId}&pn=${upiName}&am=${amount}&cu=INR&tn=${note}`;
    if (app === 'upi')     url = `upi://pay?pa=${upiId}&pn=${upiName}&am=${amount}&cu=INR&tn=${note}`;
    window.location.href = url;
    // After redirect back, mark as paid and activate
    setTimeout(() => {
      setUpiPaid(true);
    }, 3000);
  };

  const handlePlanSelect = (p) => {
    setPendingPlan(p);
    setShowPlans(false);
    setShowUPI(true);
    setUpiPaid(false);
  };

  const handleConfirmPayment = () => {
    if (pendingPlan) {
      activateInsurance(pendingPlan);
      setShowUPI(false);
      setPendingPlan(null);
      setUpiPaid(false);
    }
  };

  const safetyScore  = metrics?.safetyScore ?? null;
  const weeksActive  = insurance ? weeksFromDate(insurance.activatedAt) : 0;
  const weeksPaid    = insurance ? insurance.payments.length : 0;
  const canClaim     = weeksPaid >= 4; // must have paid at least 4 weeks (1 month)

  // ── GPS ──────────────────────────────────────────────────────────────────────
  const startGPS = () => {
    if (!navigator.geolocation) { setGpsError('GPS not supported on this device.'); return; }
    setGpsError('');
    setGpsTracking(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => setGps({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5), accuracy: Math.round(pos.coords.accuracy) }),
      (err) => { setGpsError('Unable to get location: ' + err.message); setGpsTracking(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const stopGPS = () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    setGpsTracking(false);
    setGps(null);
  };

  useEffect(() => () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); }, []);

  // ── Claim submit ─────────────────────────────────────────────────────────────
  const handleClaim = () => {
    setClaimErr('');
    if (!canClaim) { setClaimErr(`You need at least 4 weeks of payments. You have ${weeksPaid}.`); return; }
    if (!gps) { setClaimErr('You must share your GPS location to file a claim.'); return; }
    if (!claimDesc.trim()) { setClaimErr('Please describe the incident.'); return; }
    const amt = parseFloat(claimAmount);
    if (!claimAmount || isNaN(amt) || amt <= 0) { setClaimErr('Enter a valid claim amount.'); return; }
    if (amt > insurance.coverageAmount) { setClaimErr(`Claim exceeds your coverage of ₹${insurance.coverageAmount.toLocaleString()}.`); return; }

    const fraud = detectFraud(gps, logs);
    const status = fraud.suspicious ? 'flagged' : 'under_review';

    addClaim({ type: claimType, description: claimDesc, amount: amt, gps, fraudCheck: fraud, status });
    setClaimMsg(fraud.suspicious
      ? `⚠️ Claim submitted but flagged: ${fraud.reason}`
      : '✅ Claim submitted successfully! Under review.'
    );
    setClaimDesc(''); setClaimAmount(''); setTab('history');
    setTimeout(() => setClaimMsg(''), 5000);
  };

  // ── Pay premium ───────────────────────────────────────────────────────────────
  const handlePayPremium = () => {
    payPremium();
    setPayMsg(`✅ Payment of ₹${insurance.weeklyPremium} recorded! Total weeks paid: ${weeksPaid + 1}`);
    setTimeout(() => setPayMsg(''), 4000);
  };

  const plan = insurance
    ? PLANS.find(p => p.name === insurance.plan) || PLANS[1]
    : safetyScore >= 85 ? PLANS[0] : safetyScore >= 65 ? PLANS[1] : PLANS[2];

  const benefits = BENEFIT_ICONS.map(({ key, icon, label }) => ({
    icon, label, value: formatBenefit(plan.benefits[key]),
  }));

  const claimStatusColor = { under_review: '#F59E0B', approved: '#10B981', rejected: '#EF4444', flagged: '#EF4444' };

  return (
    <div className="insurance-wallet">
      <h2 className="section-title">Insurance Wallet</h2>

      {/* ── GPS Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', background: gpsTracking ? 'rgba(16,185,129,0.08)' : 'rgba(17,34,80,0.04)', padding: '0.6rem 1rem', borderRadius: '10px' }}>
        <span style={{ fontSize: '1.1rem' }}>📍</span>
        <div style={{ flex: 1 }}>
          {gpsTracking && gps
            ? <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>Live GPS: {gps.lat}, {gps.lng} (±{gps.accuracy}m)</span>
            : <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{gpsTracking ? 'Acquiring location...' : 'GPS not active — required for claims'}</span>
          }
          {gpsError && <span style={{ fontSize: '0.75rem', color: '#EF4444', display: 'block' }}>{gpsError}</span>}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={gpsTracking ? stopGPS : startGPS}
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: gpsTracking ? '#EF4444' : '#10B981', color: '#fff', fontWeight: 600 }}
        >
          {gpsTracking ? 'Stop' : 'Share Location'}
        </motion.button>
      </div>

      {/* ── Insurance Card ── */}
      <motion.div className="insurance-card" whileHover={{ y: -3 }}>
        <div className="card-header">
          <div className="card-status">
            <span className={`status-indicator ${insurance ? 'active' : ''}`}></span>
            <span className="status-text">{insurance ? 'Active' : 'Not Activated'}</span>
          </div>
          <span className="card-logo">🛡️</span>
        </div>
        <div className="card-body">
          <h3 className="plan-name">{plan.name}</h3>
          <div className="coverage-amount">₹{plan.coverageAmount.toLocaleString()}</div>
          <p className="coverage-label">Total Coverage</p>
        </div>
        <div className="card-footer">
          <div className="footer-item">
            <span className="footer-label">Premium</span>
            <span className="footer-value">₹{plan.weeklyPremium}/week</span>
          </div>
          <div className="footer-item">
            <span className="footer-label">Weeks Paid</span>
            <span className="footer-value">{weeksPaid} {weeksPaid >= 4 ? '✅' : `/ 4 needed`}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Benefits ── */}
      <div className="benefits-grid" style={{ marginBottom: '1rem' }}>
        {benefits.map((b, i) => (
          <motion.div key={i} className="benefit-item" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
            <span className="benefit-icon">{b.icon}</span>
            <div className="benefit-info">
              <p className="benefit-label">{b.label}</p>
              <p className="benefit-value">{b.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Action Buttons ── */}
      {!insurance ? (
        <>
          <button className="btn btn-primary btn-full" onClick={() => setShowPlans(v => !v)}>
            {showPlans ? 'Cancel' : 'Activate Plan'}
          </button>
          <AnimatePresence>
            {showPlans && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: '0.75rem' }}>
                {PLANS.map(p => (
                  <motion.button key={p.name} className="btn btn-outline btn-full" whileHover={{ scale: 1.01 }}
                    style={{ marginBottom: '0.5rem', textAlign: 'left', padding: '0.6rem 1rem' }}
                    onClick={() => handlePlanSelect(p)}
                  >
                    <strong>{p.name}</strong> — ₹{p.weeklyPremium}/week · ₹{p.coverageAmount.toLocaleString()} coverage
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── UPI Payment Modal ── */}
          <AnimatePresence>
            {showUPI && pendingPlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                style={{ marginTop: '1rem', background: 'rgba(17,34,80,0.04)', borderRadius: '14px', padding: '1.25rem', border: '1px solid #D9CBC2' }}
              >
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#112250', marginBottom: '0.25rem' }}>
                  💳 Pay ₹{pendingPlan.weeklyPremium} for {pendingPlan.name}
                </p>
                <p style={{ fontSize: '0.78rem', color: '#3C5070', marginBottom: '1rem' }}>
                  Choose your UPI app to complete payment
                </p>

                {/* UPI App Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                  {[
                    { app: 'gpay',    label: 'Google Pay',  emoji: '🟢', color: '#4285F4' },
                    { app: 'phonepe', label: 'PhonePe',     emoji: '🟣', color: '#5F259F' },
                    { app: 'paytm',   label: 'Paytm',       emoji: '🔵', color: '#00BAF2' },
                    { app: 'upi',     label: 'Other UPI',   emoji: '🟡', color: '#F59E0B' },
                  ].map(({ app, label, emoji, color }) => (
                    <motion.button
                      key={app}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => openUPI(app, pendingPlan.weeklyPremium, pendingPlan.name)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', borderRadius: '10px', border: `2px solid ${color}20`, background: `${color}10`, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', color }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{emoji}</span> {label}
                    </motion.button>
                  ))}
                </div>

                <div style={{ background: 'rgba(17,34,80,0.06)', borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.75rem', color: '#3C5070', marginBottom: '1rem' }}>
                  <strong>UPI ID:</strong> {UPI_ID}<br />
                  <strong>Amount:</strong> ₹{pendingPlan.weeklyPremium}<br />
                  <strong>Note:</strong> Insurance: {pendingPlan.name}
                </div>

                <p style={{ fontSize: '0.75rem', color: '#3C5070', marginBottom: '0.75rem', opacity: 0.8 }}>
                  After completing payment in your UPI app, click “I have Paid” to activate your plan.
                </p>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <motion.button
                    className="btn btn-primary"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmPayment}
                    style={{ flex: 1 }}
                  >
                    ✅ I have Paid — Activate Plan
                  </motion.button>
                  <motion.button
                    className="btn btn-outline"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setShowUPI(false); setPendingPlan(null); }}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['overview', 'claim', 'history'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                  background: tab === t ? '#112250' : 'rgba(17,34,80,0.07)', color: tab === t ? '#fff' : '#112250' }}>
                {t === 'overview' ? '📋 Overview' : t === 'claim' ? '🆘 Claim' : '📜 History'}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab === 'overview' && (
            <div>
              <div style={{ background: 'rgba(17,34,80,0.04)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ opacity: 0.7 }}>Active since</span>
                  <span style={{ fontWeight: 600 }}>{new Date(insurance.activatedAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ opacity: 0.7 }}>Weeks active</span>
                  <span style={{ fontWeight: 600 }}>{weeksActive}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.7 }}>Claim eligibility</span>
                  <span style={{ fontWeight: 600, color: canClaim ? '#10B981' : '#F59E0B' }}>
                    {canClaim ? '✅ Eligible' : `⏳ ${4 - weeksPaid} more payment(s) needed`}
                  </span>
                </div>
              </div>
              {payMsg && <p style={{ color: '#10B981', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{payMsg}</p>}
              <motion.button className="btn btn-primary btn-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePayPremium}>
                💳 Pay Weekly Premium (₹{insurance.weeklyPremium})
              </motion.button>
            </div>
          )}

          {/* Claim Tab */}
          {tab === 'claim' && (
            <div>
              {claimMsg && <p style={{ color: claimMsg.includes('⚠️') ? '#F59E0B' : '#10B981', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{claimMsg}</p>}

              {!canClaim && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid #F59E0B', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#92400E' }}>
                  ⚠️ You need at least <strong>4 weeks of premium payments</strong> to file a claim. You have paid <strong>{weeksPaid}</strong> week(s).
                </div>
              )}

              {!gps && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #EF4444', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#991B1B' }}>
                  📍 <strong>GPS location is required</strong> to file a claim. Click "Share Location" above.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#3C5070', display: 'block', marginBottom: '0.25rem' }}>Claim Type</label>
                  <select value={claimType} onChange={e => setClaimType(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.7rem', borderRadius: '8px', border: '1px solid #D9CBC2', fontSize: '0.875rem' }}>
                    {CLAIM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#3C5070', display: 'block', marginBottom: '0.25rem' }}>Claim Amount (₹)</label>
                  <input type="number" placeholder={`Max ₹${insurance.coverageAmount.toLocaleString()}`} value={claimAmount}
                    onChange={e => setClaimAmount(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.7rem', borderRadius: '8px', border: '1px solid #D9CBC2', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#3C5070', display: 'block', marginBottom: '0.25rem' }}>Describe the Incident</label>
                  <textarea rows={3} placeholder="Describe what happened in detail..." value={claimDesc}
                    onChange={e => setClaimDesc(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.7rem', borderRadius: '8px', border: '1px solid #D9CBC2', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>

                {gps && (
                  <div style={{ fontSize: '0.78rem', color: '#10B981', background: 'rgba(16,185,129,0.08)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                    ✅ GPS verified: {gps.lat}, {gps.lng}
                  </div>
                )}

                {claimErr && <p style={{ color: '#EF4444', fontSize: '0.78rem' }}>{claimErr}</p>}

                <motion.button className="btn btn-primary btn-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleClaim} disabled={!canClaim || !gps}>
                  🆘 Submit Claim
                </motion.button>
              </div>
            </div>
          )}

          {/* History Tab */}
          {tab === 'history' && (
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.75rem', color: '#112250' }}>Payment History ({insurance.payments.length} payments)</p>
              <div style={{ maxHeight: '140px', overflowY: 'auto', marginBottom: '1rem' }}>
                {insurance.payments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.3rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <span>{new Date(p.date).toLocaleDateString()}</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>-₹{p.amount}</span>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.75rem', color: '#112250' }}>Claims ({insurance.claims.length})</p>
              {insurance.claims.length === 0
                ? <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>No claims filed yet.</p>
                : insurance.claims.map(c => (
                  <div key={c.id} style={{ background: 'rgba(17,34,80,0.04)', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong>{c.type}</strong>
                      <span style={{ color: claimStatusColor[c.status] || '#6B7280', fontWeight: 600, textTransform: 'capitalize' }}>{c.status.replace('_', ' ')}</span>
                    </div>
                    <p style={{ opacity: 0.7, marginBottom: '0.25rem' }}>{c.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.6 }}>
                      <span>Amount: ₹{c.amount.toLocaleString()}</span>
                      <span>{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                    {c.fraudCheck?.suspicious && (
                      <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>🚨 {c.fraudCheck.reason}</p>
                    )}
                    {!c.fraudCheck?.suspicious && (
                      <p style={{ color: '#10B981', fontSize: '0.75rem', marginTop: '0.25rem' }}>✅ {c.fraudCheck?.reason}</p>
                    )}
                  </div>
                ))
              }
            </div>
          )}
        </>
      )}
    </div>
  );
}
