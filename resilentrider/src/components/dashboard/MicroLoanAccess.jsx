import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRiderData } from '../../context/RiderDataContext';
import './MicroLoanAccess.css';

const statusColor = { approved: '#10B981', pending: '#F59E0B', disbursed: '#3B82F6', repaid: '#6B7280', rejected: '#EF4444' };

function ConditionRow({ icon, label, met, detail }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(17,34,80,0.06)' }}>
      <span style={{ fontSize: '1rem', marginTop: '0.1rem' }}>{met ? '✅' : '❌'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#112250' }}>{icon} {label}</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: met ? '#10B981' : '#EF4444' }}>{detail}</span>
      </div>
    </div>
  );
}

export default function MicroLoanAccess() {
  const { metrics, insurance: insuranceRecord, logs } = useRiderData();

  const loanData = metrics?.loan ?? { limit: 0, interestRate: 2.5, repaymentPeriod: '30 days', eligible: false, repaymentProb: 0, continuousLowIncome: false, avgDailyEarnings: 0 };
  const { limit, interestRate, repaymentPeriod, eligible, repaymentProb, continuousLowIncome, avgDailyEarnings } = loanData;

  const [loans, setLoans] = useState(() => {
    try { return JSON.parse(localStorage.getItem('riderLoans') || '[]'); } catch { return []; }
  });

  const [showForm, setShowForm]   = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [amount, setAmount]       = useState('');
  const [purpose, setPurpose]     = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const usedCredit  = loans.filter(l => ['pending', 'approved', 'disbursed'].includes(l.status)).reduce((s, l) => s + l.amount, 0);
  const available   = Math.max(0, limit - usedCredit);
  const percentage  = limit > 0 ? (available / limit) * 100 : 0;

  // Good behavior checks
  const noFraud       = !insuranceRecord?.claims?.some(c => c.fraudCheck?.suspicious);
  const paidPremiums  = insuranceRecord ? insuranceRecord.payments.length >= 1 : false;
  const recentLogs    = logs.filter(l => Date.now() - new Date(l.date).getTime() < 3 * 24 * 60 * 60 * 1000);
  const regularUsage  = recentLogs.length >= 2;
  const goodBehavior  = noFraud && regularUsage;

  // All 3 conditions
  const cond1 = continuousLowIncome;
  const cond2 = goodBehavior;
  const cond3 = repaymentProb >= 70;
  const allMet = cond1 && cond2 && cond3;

  const todayEarnings = metrics?.todayEarnings ?? 0;

  const handleApply = () => {
    setError('');
    if (!allMet) { setError('You do not meet all eligibility conditions.'); return; }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (amt > available) { setError(`Amount exceeds available credit of ₹${available.toLocaleString()}.`); return; }
    if (!purpose.trim()) { setError('Please enter a purpose.'); return; }

    const newLoan = {
      id: Date.now().toString(),
      amount: amt,
      purpose: purpose.trim(),
      status: 'approved',
      appliedAt: new Date().toLocaleDateString(),
      repayBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      repaymentProb,
    };

    const updated = [newLoan, ...loans];
    setLoans(updated);
    localStorage.setItem('riderLoans', JSON.stringify(updated));
    setSuccess(`✅ Loan of ₹${amt.toLocaleString()} approved! Repay by ${newLoan.repayBy}`);
    setAmount(''); setPurpose(''); setShowForm(false);
    setTimeout(() => setSuccess(''), 5000);
  };

  return (
    <div className="micro-loan-access">
      <h2 className="section-title">Micro Loan Access</h2>

      {success && <p style={{ color: '#10B981', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{success}</p>}

      {/* ── Eligibility Summary Banner ── */}
      {metrics && (
        <div style={{ background: allMet ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${allMet ? '#10B981' : '#F59E0B'}`, borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: allMet ? '#065F46' : '#92400E' }}>
              {allMet ? '✅ Loan Eligible' : '⏳ Not Yet Eligible'}
            </span>
            <button onClick={() => setShowCheck(v => !v)} style={{ fontSize: '0.72rem', background: 'none', border: 'none', cursor: 'pointer', color: '#3C5070', textDecoration: 'underline' }}>
              {showCheck ? 'Hide' : 'View Conditions'}
            </button>
          </div>
          <AnimatePresence>
            {showCheck && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: '0.75rem' }}>

                <ConditionRow
                  icon="📉" label="Continuous Low Income (2+ days)"
                  met={cond1}
                  detail={cond1
                    ? `Income dropped below 50% of avg (₹${avgDailyEarnings}/day) for 2+ days`
                    : `Need 2+ days of earnings below ₹${(avgDailyEarnings * 0.5).toFixed(0)}. Today: ₹${todayEarnings}`}
                />

                <ConditionRow
                  icon="🧑‍💼" label="Good User Behavior"
                  met={cond2}
                  detail={
                    !noFraud ? 'Fraud history detected on your account' :
                    !regularUsage ? `Need 2+ ride logs in last 3 days. You have ${recentLogs.length}` :
                    'No fraud history · Regular app usage verified'
                  }
                />

                <ConditionRow
                  icon="🤖" label={`AI Repayment Probability ≥ 70%`}
                  met={cond3}
                  detail={`AI predicts ${repaymentProb}% repayment probability based on earnings trend`}
                />

                {/* Repayment probability bar */}
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.25rem', color: '#3C5070' }}>
                    <span>Repayment Probability</span>
                    <span style={{ fontWeight: 700, color: repaymentProb >= 70 ? '#10B981' : '#EF4444' }}>{repaymentProb}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(17,34,80,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${repaymentProb}%` }}
                      transition={{ duration: 1 }}
                      style={{ height: '100%', borderRadius: '999px', background: repaymentProb >= 70 ? '#10B981' : '#EF4444' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginTop: '0.2rem', opacity: 0.5 }}>
                    <span>0%</span><span style={{ color: '#F59E0B' }}>70% threshold</span><span>100%</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Loan Card ── */}
      <div className="loan-card">
        <div className="loan-header">
          <span className="loan-icon">💳</span>
          <span className="loan-badge" style={{ background: allMet ? 'linear-gradient(135deg,#10B981,#34D399)' : 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: allMet ? '#fff' : '#78350F' }}>
            {!metrics ? 'Log rides to unlock' : allMet ? 'AI Approved' : 'Conditions Pending'}
          </span>
        </div>

        <div className="loan-amount">
          <p className="amount-label">Available Credit</p>
          <h3 className="amount-value">₹{available.toLocaleString()}</h3>
          <p className="amount-limit">of ₹{limit.toLocaleString()} limit</p>
        </div>

        <div className="loan-progress">
          <div className="progress-bar">
            <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
          </div>
          <span className="progress-text">{percentage.toFixed(0)}% Available</span>
        </div>

        <div className="loan-details">
          <div className="detail-item">
            <span className="detail-icon">📊</span>
            <div>
              <p className="detail-label">Interest Rate</p>
              <p className="detail-value">{interestRate}% per month</p>
            </div>
          </div>
          <div className="detail-item">
            <span className="detail-icon">⏱️</span>
            <div>
              <p className="detail-label">Repayment Period</p>
              <p className="detail-value">{repaymentPeriod}</p>
            </div>
          </div>
        </div>

        <motion.button
          className="btn btn-accent btn-full"
          whileHover={{ scale: allMet ? 1.02 : 1 }}
          whileTap={{ scale: allMet ? 0.98 : 1 }}
          disabled={!allMet || available === 0}
          onClick={() => { setShowForm(v => !v); setError(''); }}
          style={{ opacity: allMet ? 1 : 0.6 }}
        >
          {!metrics ? 'Log rides to unlock' : !allMet ? 'Conditions not met' : showForm ? 'Cancel' : 'Apply for Loan'}
        </motion.button>
      </div>

      {/* ── Application Form ── */}
      <AnimatePresence>
        {showForm && allMet && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: '1rem', background: 'rgba(17,34,80,0.04)', borderRadius: '12px', padding: '1.2rem' }}
          >
            <p style={{ fontWeight: 600, marginBottom: '1rem', color: '#112250', fontSize: '0.9rem' }}>📋 Loan Application</p>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#3C5070', display: 'block', marginBottom: '0.25rem' }}>Amount (₹) — max ₹{available.toLocaleString()}</label>
              <input type="number" placeholder={`e.g. ${Math.round(available / 2)}`} value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.7rem', borderRadius: '8px', border: '1px solid #D9CBC2', fontSize: '0.875rem', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#3C5070', display: 'block', marginBottom: '0.25rem' }}>Purpose</label>
              <input type="text" placeholder="e.g. Vehicle repair, Income support" value={purpose}
                onChange={e => setPurpose(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.7rem', borderRadius: '8px', border: '1px solid #D9CBC2', fontSize: '0.875rem', boxSizing: 'border-box' }} />
            </div>

            <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: '#065F46' }}>
              🤖 AI Repayment Score: <strong>{repaymentProb}%</strong> — Loan auto-approved
            </div>

            {error && <p style={{ color: '#EF4444', fontSize: '0.78rem', marginBottom: '0.5rem' }}>{error}</p>}

            <motion.button className="btn btn-primary btn-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleApply}>
              Submit Application
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Benefits ── */}
      <div className="loan-benefits">
        <p className="benefits-title">Eligibility Criteria</p>
        <ul className="benefits-list">
          <li>📉 Income drop ≥ 50% for 2+ consecutive days</li>
          <li>🧑‍💼 No fraud history · Regular app usage</li>
          <li>🤖 AI repayment probability ≥ 70%</li>
        </ul>
      </div>

      {/* ── Loan History ── */}
      {loans.length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <p className="benefits-title">Loan History</p>
          <ul className="benefits-list">
            {loans.map(loan => (
              <li key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: '0.85rem' }}>
                <span>${loan.amount.toLocaleString()} — {loan.purpose}</span>
                <span style={{ color: statusColor[loan.status] || '#6B7280', fontWeight: 600 }}>{loan.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
