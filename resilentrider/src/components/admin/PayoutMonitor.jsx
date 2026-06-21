import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import './PayoutMonitor.css';

function PayoutMonitor() {
  const [payouts,  setPayouts]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);

  const fetch = useCallback(() => {
    // Reuse existing admin claims endpoint — filter approved/paid with payoutStatus completed
    api.get('/admin/claims?status=approved')
      .then(res => {
        if (res.data.success) {
          const paid = res.data.data.filter(c =>
            c.payoutStatus === 'completed' || c.status === 'paid'
          );
          setPayouts(paid);
          setTotal(paid.reduce((s, c) => s + (c.approvedAmount || c.amount || 0), 0));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
    const t = setInterval(fetch, 30000);
    return () => clearInterval(t);
  }, [fetch]);

  return (
    <div className="payout-monitor">
      <div className="pm-header">
        <h2 className="section-title">💰 Payout Monitor</h2>
        <div className="pm-meta">
          <span className="pm-total">Total: ₹{total.toLocaleString()}</span>
          <button className="pm-refresh" onClick={fetch}>↻</button>
        </div>
      </div>

      {loading && (
        <div className="pm-placeholder">
          <div className="pm-spinner" /><span>Loading payouts…</span>
        </div>
      )}

      {!loading && payouts.length === 0 && (
        <div className="pm-placeholder">
          No completed payouts yet. Approved claims with payouts will appear here.
        </div>
      )}

      {!loading && payouts.length > 0 && (
        <div className="pm-table-wrap">
          <table className="pm-table">
            <thead>
              <tr>
                {['Rider', 'Claim Type', 'Amount', 'Approved', 'Razorpay Order', 'Status', 'Date'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map((c, i) => (
                <motion.tr
                  key={String(c._id)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td className="pm-rider">
                    {c.rider?.name || '—'}
                    <span className="pm-rider__email">{c.rider?.email || ''}</span>
                  </td>
                  <td className="pm-type">{c.claimType?.replace('_', ' ')}</td>
                  <td className="pm-amount">₹{(c.amount || 0).toLocaleString()}</td>
                  <td className="pm-approved">₹{(c.approvedAmount || 0).toLocaleString()}</td>
                  <td className="pm-order">
                    {c.razorpayOrderId
                      ? <span className="pm-order-id">{c.razorpayOrderId}</span>
                      : <span className="pm-order-none">—</span>
                    }
                  </td>
                  <td>
                    <span className={`pm-badge ${c.payoutStatus === 'completed' ? 'pm-badge--done' : 'pm-badge--pending'}`}>
                      {c.payoutStatus === 'completed' ? '✅ Completed' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="pm-date">
                    {c.paidAt ? new Date(c.paidAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PayoutMonitor;
