import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './EarningsCalendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export default function EarningsCalendar() {
  const { user } = useAuth();
  const today    = new Date();

  const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [records,      setRecords]      = useState({});   // { 'YYYY-MM-DD': record }
  const [totalEarnings, setTotalEarnings] = useState(0);

  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD'
  const [form, setForm]   = useState({ earningsAmount: '', keyword: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState({ text: '', type: '' });

  // Fetch monthly records
  const fetchMonth = useCallback(async () => {
    try {
      const res = await api.get(`/earnings/month/${currentYear}/${currentMonth}`);
      const map = {};
      res.data.data.forEach(r => {
        const d = new Date(r.date);
        map[toDateKey(d)] = r;
      });
      setRecords(map);
      setTotalEarnings(res.data.totalEarnings || 0);
    } catch {
      // backend not connected — use localStorage fallback
      const stored = JSON.parse(localStorage.getItem('earningsCalendar') || '{}');
      const map = {};
      let total = 0;
      Object.entries(stored).forEach(([key, val]) => {
        const [y, m] = key.split('-').map(Number);
        if (y === currentYear && m === currentMonth) {
          map[key] = val;
          total += val.earningsAmount || 0;
        }
      });
      setRecords(map);
      setTotalEarnings(total);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);

  // Build calendar days array
  const firstDay   = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const calendarCells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const handleDayClick = (day) => {
    if (!day) return;
    const key = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setSelectedDate(key);
    const existing = records[key];
    setForm({
      earningsAmount: existing ? existing.earningsAmount : '',
      keyword:        existing ? existing.keyword        : '',
      notes:          existing ? existing.notes          : '',
    });
    setMsg({ text: '', type: '' });
  };

  const handleSave = async () => {
    if (!form.earningsAmount || isNaN(form.earningsAmount)) {
      setMsg({ text: 'Enter a valid earnings amount.', type: 'error' }); return;
    }
    setSaving(true);
    setMsg({ text: '', type: '' });

    const payload = {
      date:           selectedDate,
      earningsAmount: parseFloat(form.earningsAmount),
      keyword:        form.keyword,
      notes:          form.notes,
    };

    try {
      await api.post('/earnings/add', payload);
    } catch {
      // localStorage fallback
      const stored = JSON.parse(localStorage.getItem('earningsCalendar') || '{}');
      stored[selectedDate] = { ...payload, date: selectedDate };
      localStorage.setItem('earningsCalendar', JSON.stringify(stored));
    }

    await fetchMonth();
    setMsg({ text: records[selectedDate] ? '✅ Earnings updated!' : '✅ Earnings saved!', type: 'success' });
    setSaving(false);
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/earnings/delete/${selectedDate}`);
    } catch {
      const stored = JSON.parse(localStorage.getItem('earningsCalendar') || '{}');
      delete stored[selectedDate];
      localStorage.setItem('earningsCalendar', JSON.stringify(stored));
    }
    await fetchMonth();
    setSelectedDate(null);
  };

  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const todayKey     = toDateKey(today);
  const selectedRecord = selectedDate ? records[selectedDate] : null;

  return (
    <div className="earnings-calendar-page">

      {/* Header */}
      <div className="calendar-header">
        <div>
          <h1>📅 Earnings Calendar</h1>
          <p>Click any date to log or update your earnings — including past dates</p>
        </div>
        <div className="calendar-nav">
          <button onClick={prevMonth}>‹</button>
          <span>{MONTHS[currentMonth - 1]} {currentYear}</span>
          <button onClick={nextMonth}>›</button>
        </div>
      </div>

      {/* Monthly Summary */}
      <motion.div className="monthly-summary" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <span className="summary-icon">💰</span>
        <div>
          <p className="summary-label">Total Earnings — {MONTHS[currentMonth - 1]} {currentYear}</p>
          <p className="summary-amount">₹{totalEarnings.toLocaleString()}</p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <p className="summary-label">Days Logged</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#E0B88F' }}>{Object.keys(records).length}</p>
        </div>
      </motion.div>

      {/* Calendar Grid */}
      <div className="calendar-grid-wrapper">
        <div className="calendar-weekdays">
          {WEEKDAYS.map(d => <span key={d}>{d}</span>)}
        </div>

        <div className="calendar-days">
          {calendarCells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="calendar-day empty" />;

            const key      = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const record   = records[key];
            const isToday  = key === todayKey;
            const isSelected = key === selectedDate;

            return (
              <motion.div
                key={key}
                className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${record ? 'has-earnings' : ''}`}
                onClick={() => handleDayClick(day)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="day-number">{day}</div>
                {record && (
                  <>
                    <div className="day-earnings">₹{record.earningsAmount?.toLocaleString()}</div>
                    {record.keyword && <div className="day-keyword">{record.keyword}</div>}
                    <div className="earnings-dot" />
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Entry Form */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            className="earnings-form-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <h3>
              {selectedRecord ? '✏️ Update Earnings' : '➕ Add Earnings'} —{' '}
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>

            <div className="form-grid">
              <div className="form-field">
                <label>Earnings Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1200"
                  value={form.earningsAmount}
                  onChange={e => setForm(p => ({ ...p, earningsAmount: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label>Keyword / Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Weekend, Rainy, Festival"
                  value={form.keyword}
                  onChange={e => setForm(p => ({ ...p, keyword: e.target.value }))}
                />
              </div>

              <div className="form-field full">
                <label>Notes (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any notes about this day..."
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-actions">
              <motion.button
                className="btn btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : selectedRecord ? 'Update' : 'Save'}
              </motion.button>

              {selectedRecord && (
                <motion.button
                  className="btn btn-outline"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  style={{ borderColor: '#EF4444', color: '#EF4444' }}
                >
                  Delete
                </motion.button>
              )}

              <motion.button
                className="btn btn-outline"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedDate(null)}
              >
                Cancel
              </motion.button>
            </div>

            {msg.text && <p className={msg.type === 'error' ? 'error-msg' : 'success-msg'}>{msg.text}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
