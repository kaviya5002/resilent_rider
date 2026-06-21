import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';

const TYPES = ['system', 'claim', 'fraud', 'weather', 'payout', 'warning', 'info'];
const TYPE_ICON = { system:'⚙️', claim:'📋', fraud:'🚨', weather:'🌧️', payout:'💰', warning:'⚠️', info:'ℹ️' };

export default function AdminBroadcast() {
  const [form,    setForm]    = useState({ title: '', message: '', type: 'system' });
  const [sending, setSending] = useState(false);
  const [msg,     setMsg]     = useState(null);
  const [history, setHistory] = useState([]);

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim())
      return flash('Title and message are required', false);

    setSending(true);
    try {
      const { data } = await api.post('/notifications/broadcast', form);
      if (data.success) {
        flash(`✅ ${data.message}`);
        setHistory(prev => [{ ...form, sentAt: new Date(), id: Date.now() }, ...prev.slice(0, 9)]);
        setForm({ title: '', message: '', type: 'system' });
      }
    } catch (err) {
      flash(err?.response?.data?.message || 'Failed to send broadcast', false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--background)' }}>
        📢 Broadcast Notification
      </h3>

      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              padding: '0.6rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem',
              fontSize: '0.8rem', fontWeight: 500,
              background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
              color:      msg.ok ? '#10B981'               : '#EF4444',
              border:     `1px solid ${msg.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {/* Type selector */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
            Type
          </label>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setForm(p => ({ ...p, type: t }))}
                style={{
                  padding: '0.3rem 0.7rem', borderRadius: '999px', border: '1.5px solid',
                  fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  borderColor: form.type === t ? 'var(--primary)' : 'var(--neutral)',
                  background:  form.type === t ? 'var(--primary)' : 'transparent',
                  color:       form.type === t ? 'var(--white)'   : 'var(--text-secondary)',
                  transition: 'all 150ms ease',
                }}
              >
                {TYPE_ICON[t]} {t}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
            Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. System Maintenance Tonight"
            style={{ width: '100%', padding: '0.6rem 0.875rem', border: '2px solid var(--neutral)', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        {/* Message */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
            Message *
          </label>
          <textarea
            rows={3}
            value={form.message}
            onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            placeholder="Write your broadcast message here…"
            style={{ width: '100%', padding: '0.6rem 0.875rem', border: '2px solid var(--neutral)', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={sending}
          style={{ alignSelf: 'flex-end', minWidth: '140px' }}
        >
          {sending ? 'Sending…' : '📢 Send to All Riders'}
        </button>
      </div>

      {/* Sent history */}
      {history.length > 0 && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--background)' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Recent Broadcasts
          </p>
          {history.map(h => (
            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid rgba(17,34,80,0.05)', fontSize: '0.78rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{TYPE_ICON[h.type]} {h.title}</span>
              <span style={{ color: 'var(--text-light)', fontSize: '0.7rem' }}>{new Date(h.sentAt).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
