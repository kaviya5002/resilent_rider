import { createContext, useContext, useState, useCallback } from 'react';

const RiderDataContext = createContext(null);

export const useRiderData = () => {
  const ctx = useContext(RiderDataContext);
  if (!ctx) throw new Error('useRiderData must be used inside RiderDataProvider');
  return ctx;
};

// ── AI/ML calculation engine ──────────────────────────────────────────────────

export function computeMetrics(logs) {
  if (!logs || logs.length === 0) return null;

  const today = new Date().toDateString();
  const todayLog = logs.find(l => new Date(l.date).toDateString() === today);

  // Weekly logs (last 7 entries)
  const weekly = logs.slice(-7);

  const todayEarnings = todayLog ? todayLog.earnings : 0;
  const weeklyEarnings = weekly.reduce((s, l) => s + l.earnings, 0);
  const totalDeliveries = logs.reduce((s, l) => s + l.deliveries, 0);

  // Safety score: ML formula based on avg speed, hard brakes, hours driven
  // score = 100 - (hardBrakes * 3) - (avgSpeed > 60 ? (avgSpeed - 60) * 0.5 : 0) - (hoursOnRoad > 10 ? 10 : 0)
  const avgHardBrakes = logs.reduce((s, l) => s + (l.hardBrakes || 0), 0) / logs.length;
  const avgSpeed = logs.reduce((s, l) => s + (l.avgSpeed || 40), 0) / logs.length;
  const avgHours = logs.reduce((s, l) => s + l.hoursOnRoad, 0) / logs.length;
  const safetyScore = Math.min(100, Math.max(0, Math.round(
    100 - (avgHardBrakes * 3) - (avgSpeed > 60 ? (avgSpeed - 60) * 0.5 : 0) - (avgHours > 10 ? 10 : 0)
  )));

  // Risk factors
  const speedControl = Math.min(100, Math.round(100 - (avgSpeed > 60 ? (avgSpeed - 60) * 1.5 : 0)));
  const routeSafety = Math.min(100, Math.round(100 - avgHardBrakes * 4));
  const weatherScore = todayLog?.weather === 'rainy' ? 60 : todayLog?.weather === 'foggy' ? 70 : 90;
  const trafficScore = todayLog?.traffic === 'heavy' ? 65 : todayLog?.traffic === 'moderate' ? 80 : 92;

  // Dynamic premium: base $20/week, risk factor = 2 - (safetyScore/100)
  const basePremium = 20;
  const riskFactor = parseFloat((2 - safetyScore / 100).toFixed(2));
  const finalPremium = parseFloat((basePremium * riskFactor).toFixed(2));

  // ── Loan & Insurance Eligibility Engine ─────────────────────────────────────

  // Average daily earnings over last 7-14 days
  const last14 = logs.slice(-14);
  const avgDailyEarnings = last14.reduce((s, l) => s + l.earnings, 0) / Math.max(last14.length, 1);

  // Income condition: today's earning < 50% of average
  const incomeDropPct = avgDailyEarnings > 0 ? ((avgDailyEarnings - todayEarnings) / avgDailyEarnings) * 100 : 0;
  const incomeDrop = incomeDropPct >= 50;

  // External condition: bad weather OR heavy traffic
  const badWeather = todayLog ? ['rainy', 'foggy', 'stormy'].includes(todayLog.weather) : false;
  const badTraffic = todayLog ? todayLog.traffic === 'heavy' : false;
  const externalTrigger = badWeather || badTraffic;

  // Activity condition: logged rides recently (last 3 days)
  const last3Days = logs.filter(l => Date.now() - new Date(l.date).getTime() < 3 * 24 * 60 * 60 * 1000);
  const isActive = last3Days.length > 0;

  // Insurance payout eligibility: ALL 3 must be true
  const insurancePayoutEligible = incomeDrop && externalTrigger && isActive;

  // Continuous low income: last 2-3 days all below 50% of avg
  const last3Earnings = logs.slice(-3).map(l => l.earnings);
  const continuousLowIncome = last3Earnings.length >= 2 &&
    last3Earnings.every(e => avgDailyEarnings > 0 && e < avgDailyEarnings * 0.5);

  // Repayment probability (AI): based on avg earnings trend
  const earningsTrend = weekly.length >= 2
    ? (weekly[weekly.length - 1].earnings - weekly[0].earnings) / Math.max(weekly[0].earnings, 1)
    : 0;
  const repaymentProb = Math.min(100, Math.max(0, Math.round(
    50 + (avgDailyEarnings / 10) + (earningsTrend * 20) + (safetyScore * 0.2)
  )));

  // Loan eligible: continuous low income + good behavior + repayment > 70%
  const loanEligible = continuousLowIncome && repaymentProb >= 70;
  const loanLimit = loanEligible ? Math.round(avgDailyEarnings * 14) : 0; // 2 weeks of avg earnings

  // Smart relocation: based on time of day and traffic
  const hour = new Date().getHours();
  const zones = generateZones(hour, todayLog?.traffic || 'light');

  // Weekly chart data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = days.map((day, i) => {
    const log = weekly[i];
    return log ? log.earnings : 0;
  });

  // Notifications
  const notifications = generateNotifications(safetyScore, todayEarnings, weeklyEarnings, todayLog);

  return {
    todayEarnings,
    weeklyEarnings,
    totalDeliveries,
    safetyScore,
    riskFactors: {
      speedControl,
      routeSafety,
      weatherScore,
      trafficScore,
    },
    premium: { basePremium, riskFactor, finalPremium, riskScore: safetyScore },
    loan: {
      limit: loanLimit,
      interestRate: 2.5,
      repaymentPeriod: '30 days',
      eligible: loanEligible,
      repaymentProb,
      continuousLowIncome,
      avgDailyEarnings: parseFloat(avgDailyEarnings.toFixed(2)),
    },
    insurance: {
      payoutEligible: insurancePayoutEligible,
      incomeDrop,
      incomeDropPct: parseFloat(incomeDropPct.toFixed(1)),
      externalTrigger,
      badWeather,
      badTraffic,
      isActive,
      avgDailyEarnings: parseFloat(avgDailyEarnings.toFixed(2)),
    },
    zones,
    chartData,
    notifications,
  };
}

function generateZones(hour, traffic) {
  const isPeak = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21);
  const zones = [
    { zoneName: 'City Center', demand: isPeak ? 'High' : 'Medium', distance: '2.1 km', expectedEarningsBoost: isPeak ? '+35%' : '+15%' },
    { zoneName: 'Airport Zone', demand: traffic === 'heavy' ? 'High' : 'Medium', distance: '5.4 km', expectedEarningsBoost: traffic === 'heavy' ? '+28%' : '+12%' },
    { zoneName: 'Tech Park', demand: hour >= 9 && hour <= 18 ? 'High' : 'Low', distance: '3.8 km', expectedEarningsBoost: hour >= 9 && hour <= 18 ? '+22%' : '+5%' },
  ];
  return zones.sort((a, b) => (a.demand === 'High' ? -1 : 1));
}

function generateNotifications(safetyScore, todayEarnings, weeklyEarnings, todayLog) {
  const notes = [];
  if (safetyScore >= 90) notes.push({ id: 1, type: 'success', icon: '🛡️', title: 'Great Safety Score!', message: `Your safety score is ${safetyScore}/100. Keep it up!`, time: 'Just now', read: false });
  if (safetyScore < 70) notes.push({ id: 2, type: 'warning', icon: '⚠️', title: 'Safety Alert', message: 'Your safety score dropped. Reduce speed and avoid hard braking.', time: 'Just now', read: false });
  if (todayEarnings > 100) notes.push({ id: 3, type: 'info', icon: '💰', title: 'Earnings Milestone', message: `You've earned $${todayEarnings} today. Great work!`, time: '1h ago', read: false });
  if (weeklyEarnings > 500) notes.push({ id: 4, type: 'success', icon: '📊', title: 'Weekly Goal Reached', message: `Weekly earnings: $${weeklyEarnings.toFixed(2)}`, time: '2h ago', read: true });
  if (todayLog?.weather === 'rainy') notes.push({ id: 5, type: 'warning', icon: '🌧️', title: 'Weather Alert', message: 'Rainy conditions detected. Drive carefully.', time: '30m ago', read: false });
  if (notes.length === 0) notes.push({ id: 6, type: 'info', icon: '📋', title: 'No rides logged yet', message: 'Log your first ride to see AI insights.', time: 'Now', read: false });
  return notes;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function RiderDataProvider({ children }) {
  const [logs, setLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('riderLogs') || '[]'); } catch { return []; }
  });

  const [insurance, setInsurance] = useState(() => {
    try { return JSON.parse(localStorage.getItem('riderInsurance') || 'null'); } catch { return null; }
  });

  const metrics = computeMetrics(logs);

  const addLog = useCallback((entry) => {
    const newLog = { ...entry, date: new Date().toISOString(), id: Date.now().toString() };
    setLogs(prev => {
      const updated = [...prev, newLog];
      localStorage.setItem('riderLogs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('riderLogs');
  }, []);

  const activateInsurance = useCallback((plan) => {
    const now = new Date();
    const record = {
      plan: plan.name,
      weeklyPremium: plan.weeklyPremium,
      coverageAmount: plan.coverageAmount,
      benefits: plan.benefits,
      activatedAt: now.toISOString(),
      payments: [{ date: now.toISOString(), amount: plan.weeklyPremium }], // first payment on activation
      claims: [],
    };
    setInsurance(record);
    localStorage.setItem('riderInsurance', JSON.stringify(record));
  }, []);

  const payPremium = useCallback(() => {
    setInsurance(prev => {
      if (!prev) return prev;
      const updated = { ...prev, payments: [...prev.payments, { date: new Date().toISOString(), amount: prev.weeklyPremium }] };
      localStorage.setItem('riderInsurance', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addClaim = useCallback((claim) => {
    setInsurance(prev => {
      if (!prev) return prev;
      const updated = { ...prev, claims: [...prev.claims, { ...claim, id: Date.now().toString(), date: new Date().toISOString(), status: 'under_review' }] };
      localStorage.setItem('riderInsurance', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <RiderDataContext.Provider value={{ logs, metrics, addLog, clearLogs, insurance, activateInsurance, payPremium, addClaim }}>
      {children}
    </RiderDataContext.Provider>
  );
}
