import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SettingsSection from '../components/settings/SettingsSection';
import ProfilePhotoUploader from '../components/settings/ProfilePhotoUploader';
import AdminBroadcast from '../components/settings/AdminBroadcast';
import api from '../api/axios';
import './AdminDashboard.css';
import './UserProfile.css';
import './AdminProfile.css';

function InfoRow({ label, value, valueClass }) {
  return (
    <div className="profile-info-row">
      <span className="profile-info-row__label">{label}</span>
      <span className={`profile-info-row__value ${valueClass || ''}`}>{value || '—'}</span>
    </div>
  );
}

const PERMISSIONS = [
  { label: 'View All Riders',         granted: true  },
  { label: 'Manage Claims',           granted: true  },
  { label: 'Approve / Reject Claims', granted: true  },
  { label: 'View Fraud Alerts',       granted: true  },
  { label: 'System Settings',         granted: true  },
  { label: 'Generate Reports',        granted: true  },
  { label: 'Manage Admins',           granted: false },
  { label: 'Delete Users',            granted: false },
];

function AdminProfile() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [profile,    setProfile]    = useState(null);
  const [metrics,    setMetrics]    = useState({ claimsReviewed: 0, fraudHandled: 0, totalActions: 0 });
  const [settings,   setSettings]   = useState({
    maintenanceMode: false, autoClaimApproval: false, fraudAlertsEnabled: true,
    newClaimNotifs: true, fraudDetectionAlerts: true, systemErrorAlerts: true,
  });
  const [msg,        setMsg]        = useState(null);
  const [savingKey,  setSavingKey]  = useState(null);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const socketRef = useRef(null);
  const adminId   = user?.id || user?._id;

  // ── Load profile + metrics ────────────────────────────────────
  useEffect(() => {
    api.get('/admin/profile').then(({ data }) => {
      if (data.success) {
        setProfile(data.data);
        if (data.data.adminSettings) setSettings(s => ({ ...s, ...data.data.adminSettings }));
      }
    }).catch(() => {});

    Promise.all([
      api.get('/admin/claims').catch(() => ({ data: { data: [] } })),
      api.get('/admin/fraud-alerts').catch(() => ({ data: { data: [] } })),
    ]).then(([claimsRes, fraudRes]) => {
      const claims = claimsRes.data.data || [];
      const fraud  = fraudRes.data.data  || [];
      setMetrics({
        claimsReviewed: claims.filter(c => ['approved','rejected','paid'].includes(c.status)).length,
        fraudHandled:   fraud.filter(f => ['resolved','fraud_suspected'].includes(f.status)).length,
        totalActions:   claims.length + fraud.length,
      });
    });
  }, []);

  // ── Real-time admin alerts via Socket.IO ──────────────────────
  useEffect(() => {
    if (!adminId) return;
    import('socket.io-client').then(({ io }) => {
      const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnectionAttempts: 3 });
      socket.on('connect', () => socket.emit('join', { userId: adminId }));
      socket.on('new_notification', (notif) => {
        if (['fraud', 'error', 'warning'].includes(notif.type) || notif.priority === 'high') {
          setLiveAlerts(prev => [notif, ...prev].slice(0, 10));
        }
      });
      socketRef.current = socket;
    }).catch(() => {});
    return () => {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    };
  }, [adminId]);

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const handleToggle = async (key) => {
    if (savingKey === key) return;
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    setSavingKey(key);
    try { await api.put('/admin/settings/update', { adminSettings: updated }); flash('Settings updated'); }
    catch { flash('Failed to update settings', false); }
    finally { setSavingKey(null); }
  };

  const systemItems = [
    { key: 'maintenanceMode',    label: 'Maintenance Mode',    description: 'Disable rider access during maintenance', value: settings.maintenanceMode,    onChange: () => handleToggle('maintenanceMode'),    saving: savingKey === 'maintenanceMode'    },
    { key: 'autoClaimApproval',  label: 'Auto Claim Approval', description: 'Automatically approve low-risk claims',   value: settings.autoClaimApproval,  onChange: () => handleToggle('autoClaimApproval'),  saving: savingKey === 'autoClaimApproval'  },
    { key: 'fraudAlertsEnabled', label: 'Fraud Alerts',        description: 'Enable AI fraud detection alerts',        value: settings.fraudAlertsEnabled, onChange: () => handleToggle('fraudAlertsEnabled'), saving: savingKey === 'fraudAlertsEnabled' },
  ];

  const notifItems = [
    { key: 'newClaimNotifs',       label: 'New Claim Notifications', description: 'Alert when a new claim is submitted', value: settings.newClaimNotifs,       onChange: () => handleToggle('newClaimNotifs'),       saving: savingKey === 'newClaimNotifs'       },
    { key: 'fraudDetectionAlerts', label: 'Fraud Detection Alerts',  description: 'Alert on high fraud score claims',    value: settings.fraudDetectionAlerts, onChange: () => handleToggle('fraudDetectionAlerts'), saving: savingKey === 'fraudDetectionAlerts' },
    { key: 'systemErrorAlerts',    label: 'System Error Alerts',     description: 'Alert on backend performance issues', value: settings.systemErrorAlerts,    onChange: () => handleToggle('systemErrorAlerts'),    saving: savingKey === 'systemErrorAlerts'    },
  ];

  const adminName = user?.name?.split(' ')[0] || 'Admin';

  return (
    <div className="admin-dashboard">

      {/* Page header */}
      <motion.div className="dashboard-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="header-content">
          <h1>Admin Profile ⚙️</h1>
          <p>Welcome, {adminName} — Manage your admin settings</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => navigate('/admin-dashboard')}>← Dashboard</button>
          <button className="btn btn-primary" onClick={logout}>Logout</button>
        </div>
      </motion.div>

      {msg && (
        <div className={`profile-flash ${msg.ok ? 'profile-flash--ok' : 'profile-flash--err'}`}>
          {msg.text}
        </div>
      )}

      <div className="profile-wrap">

        {/* ── HERO ── */}
        <motion.div className="profile-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>

          {/* Avatar */}
          <div className="profile-hero__avatar-col">
            <ProfilePhotoUploader
              currentPhoto={profile?.profilePhoto}
              name={user?.name}
              onUploaded={(url) => setProfile(p => ({ ...p, profilePhoto: url }))}
            />
          </div>

          {/* Name + email + badges */}
          <div className="profile-hero__info-col">
            <h2 className="profile-hero__name">{user?.name || '—'}</h2>
            <span className="profile-hero__role" style={{ background: 'var(--secondary)' }}>Administrator</span>
            <p className="profile-hero__email">{profile?.email || user?.email || ''}</p>
            <div className="profile-hero__badges">
              <span className="profile-badge profile-badge--blue">Insurance Operations</span>
              <span className="profile-badge profile-badge--green">✔ Active</span>
              {liveAlerts.length > 0 && (
                <span className="profile-badge profile-badge--red">🚨 {liveAlerts.length} Live Alert{liveAlerts.length > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="profile-hero__stats-col">
            <div className="profile-hero__stat">
              <span className="profile-hero__stat-value">{metrics.claimsReviewed}</span>
              <span className="profile-hero__stat-label">Claims Reviewed</span>
            </div>
            <div className="profile-hero__stat">
              <span className="profile-hero__stat-value">{metrics.fraudHandled}</span>
              <span className="profile-hero__stat-label">Fraud Handled</span>
            </div>
            <div className="profile-hero__stat">
              <span className="profile-hero__stat-value">{metrics.totalActions}</span>
              <span className="profile-hero__stat-label">Total Actions</span>
            </div>
          </div>

          {/* Action */}
          <div className="profile-hero__action-col">
            <button className="btn btn-outline" onClick={() => navigate('/admin-dashboard')}>
              📊 Dashboard
            </button>
          </div>

        </motion.div>

        {/* ── BODY GRID ── */}
        <div className="profile-body">

          {/* LEFT COLUMN */}
          <div className="profile-col">

            {/* Admin Details */}
            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 className="profile-card-title">👤 Admin Details</h3>
              <div className="profile-info-rows">
                <InfoRow label="Full Name"    value={profile?.name  || user?.name  || '—'} />
                <InfoRow label="Email"        value={profile?.email || user?.email || '—'} />
                <InfoRow label="Role"         value="Administrator" />
                <InfoRow label="Department"   value="Insurance Operations" />
                <InfoRow label="Member Since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'} />
                <InfoRow label="Last Login"   value={profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Just now'} />
              </div>
            </motion.div>

            {/* Permissions */}
            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
              <h3 className="profile-card-title">🔐 Permissions</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
                Read-only — contact super admin to modify
              </p>
              <div className="profile-info-rows">
                {PERMISSIONS.map(({ label, granted }) => (
                  <div key={label} className="profile-info-row">
                    <span className="profile-info-row__label">{label}</span>
                    <span className="profile-info-row__value" style={{ color: granted ? '#10B981' : '#EF4444' }}>
                      {granted ? '✔ Granted' : '✘ Denied'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="profile-col">

            {/* System Settings */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <SettingsSection title="⚙️ System Settings" items={systemItems} />
            </motion.div>

            {/* Notification Settings */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
              <SettingsSection title="🔔 Notification Settings" items={notifItems} />
            </motion.div>

            {/* Live High-Priority Alerts */}
            {liveAlerts.length > 0 && (
              <motion.div
                className="card"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
              >
                <h3 className="profile-card-title">🚨 Live High-Priority Alerts</h3>
                <div className="profile-info-rows">
                  {liveAlerts.map((a, i) => (
                    <div
                      key={a._id || i}
                      className="profile-info-row"
                      style={{ borderLeft: '3px solid #EF4444' }}
                    >
                      <span className="profile-info-row__label">
                        {a.metadata?.icon || '⚠️'} {a.title}
                      </span>
                      <span className="profile-info-row__value" style={{ color: '#EF4444', fontSize: '0.72rem' }}>
                        {a.priority?.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <h3 className="profile-card-title">⚡ Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button className="btn btn-outline" onClick={() => navigate('/admin-dashboard')}>
                  📊 View Dashboard
                </button>
                <button className="btn btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={logout}>
                  🚪 Logout
                </button>
              </div>
            </motion.div>

          </div>
        </div>

        {/* ── FULL-WIDTH: Broadcast + System Alert Monitor ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <AdminBroadcast />
        </motion.div>

      </div>
    </div>
  );
}

export default AdminProfile;
