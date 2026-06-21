import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useNotifications } from '../context/NotificationContext';
import SettingsSection from '../components/settings/SettingsSection';
import ProfilePhotoUploader from '../components/settings/ProfilePhotoUploader';
import NotificationCenter from '../components/settings/NotificationCenter';
import api from '../api/axios';
import './UserProfile.css';

const riskClass = (l) => ({ LOW: 'risk-low', MEDIUM: 'risk-medium', HIGH: 'risk-high' }[l] || '');
const kycClass  = (s) => ({ Verified: 'status-verified', Pending: 'status-pending', Rejected: 'status-rejected' }[s] || '');

function InfoRow({ label, value, valueClass }) {
  return (
    <div className="profile-info-row">
      <span className="profile-info-row__label">{label}</span>
      <span className={`profile-info-row__value ${valueClass || ''}`}>{value || '—'}</span>
    </div>
  );
}

function UserProfile() {
  const { user, logout }               = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { settings: ctxSettings, updateSettings, savingKeys } = useNotifications() || {};
  const navigate                       = useNavigate();

  const [fullUser,     setFullUser]     = useState(null);
  const [profile,      setProfile]      = useState({ name: '', email: '', phone: '', address: '', city: '', vehicleType: '' });
  const [savedProfile, setSavedProfile] = useState(null);
  const [notifs,       setNotifs]       = useState({ email: true, sms: false, claimAlerts: true, premiumReminder: true });
  const [theme,        setTheme]        = useState('light');
  const [editing,      setEditing]      = useState(false);
  const [pwForm,       setPwForm]       = useState({ current: '', next: '', confirm: '' });
  const [saving,       setSaving]       = useState(false);
  const [pwSaving,     setPwSaving]     = useState(false);
  const [msg,          setMsg]          = useState(null);
  const [phoneErr,     setPhoneErr]     = useState('');
  const [loading,      setLoading]      = useState(true);

  // Sync notifs from context whenever it loads or changes (cross-tab socket updates)
  useEffect(() => {
    if (ctxSettings) setNotifs(ctxSettings);
  }, [ctxSettings]);

  const flash = useCallback((text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  }, []);

  // Load profile from backend
  useEffect(() => {
    setLoading(true);
    api.get('/user/profile')
      .then(({ data }) => {
        if (data.success) {
          const u = data.data;
          setFullUser(u);
          const p = {
            name:        u.name        || '',
            email:       u.email       || '',
            phone:       u.phone       || '',
            address:     u.address     || '',
            city:        u.city        || '',
            vehicleType: u.vehicleType || '',
          };
          setProfile(p);
          setSavedProfile(p);
          setNotifs(u.notifications || { email: true, sms: false, claimAlerts: true, premiumReminder: true });
          setTheme(u.theme || 'light');
        }
      })
      .catch(() => {
        if (user) {
          const p = { name: user.name || '', email: user.email || '', phone: '', address: '', city: '', vehicleType: '' };
          setProfile(p);
          setSavedProfile(p);
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Phone validation — accepts 7-15 digits, allows spaces/dashes/parens/+
  const validatePhone = (val) => {
    const digits = val ? val.replace(/[\s\-().+]/g, '') : '';
    if (digits && !/^\d{7,15}$/.test(digits)) {
      setPhoneErr('Enter a valid phone number');
      return false;
    }
    setPhoneErr('');
    return true;
  };

  // Save profile
  const handleSaveProfile = async () => {
    if (!profile.name.trim()) return flash('Name is required', false);
    if (!validatePhone(profile.phone)) return flash('Enter a valid phone number', false);
    setSaving(true);
    try {
      const { data } = await api.put('/user/profile/update', {
        name:        profile.name.trim(),
        phone:       profile.phone.trim(),
        address:     profile.address.trim(),
        city:        profile.city.trim(),
        vehicleType: profile.vehicleType.trim(),
      });
      if (data.success) {
        setFullUser(data.data);
        const updated = {
          name:        data.data.name        || '',
          email:       data.data.email       || '',
          phone:       data.data.phone       || '',
          address:     data.data.address     || '',
          city:        data.data.city        || '',
          vehicleType: data.data.vehicleType || '',
        };
        setProfile(updated);
        setSavedProfile(updated);
        flash('Profile saved successfully');
        setEditing(false);
      } else {
        flash(data.message || 'Failed to save. Please try again.', false);
      }
    } catch (err) {
      flash(err?.response?.data?.message || 'Failed to save. Please try again.', false);
    } finally {
      setSaving(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    if (savedProfile) setProfile(savedProfile);
    setEditing(false);
    setPhoneErr('');
  };

  // Toggle notification — delegates to NotificationContext (single source of truth)
  const handleToggleNotif = useCallback(async (key) => {
    if (savingKeys?.has(key)) return;
    const newValue = !notifs[key];
    setNotifs(prev => ({ ...prev, [key]: newValue }));
    if (updateSettings) await updateSettings(key, newValue);
  }, [notifs, savingKeys, updateSettings]);

  // Theme change
  const handleTheme = async (val) => {
    setTheme(val);
    if (val === 'dark'   && !isDarkMode) toggleDarkMode();
    if (val === 'light'  &&  isDarkMode) toggleDarkMode();
    if (val === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark && !isDarkMode) toggleDarkMode();
      if (!prefersDark && isDarkMode) toggleDarkMode();
    }
    try {
      await api.put('/user/settings/update', { theme: val });
      flash('Theme updated');
    } catch {
      flash('Failed to save theme preference', false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm)
      return flash('Fill in all password fields', false);
    if (pwForm.next !== pwForm.confirm)
      return flash('New passwords do not match', false);
    if (pwForm.next.length < 8)
      return flash('Password must be at least 8 characters', false);
    setPwSaving(true);
    try {
      await api.put('/user/settings/update', {
        currentPassword: pwForm.current,
        newPassword:     pwForm.next,
      });
      flash('Password changed successfully');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      flash(err?.response?.data?.message || 'Failed to change password', false);
    } finally {
      setPwSaving(false);
    }
  };

  const handlePhotoUploaded = (url) => {
    setFullUser(u => ({ ...u, profilePhoto: url }));
  };

  const notifItems = [
    { key: 'email',           label: 'Email Notifications',  description: 'Receive updates via email',            value: notifs.email,           onChange: () => handleToggleNotif('email'),           saving: savingKeys?.has('email')           },
    { key: 'sms',             label: 'SMS Notifications',    description: 'Receive alerts via SMS',               value: notifs.sms,             onChange: () => handleToggleNotif('sms'),             saving: savingKeys?.has('sms')             },
    { key: 'claimAlerts',     label: 'Claim Alerts',         description: 'Get notified on claim status changes', value: notifs.claimAlerts,     onChange: () => handleToggleNotif('claimAlerts'),     saving: savingKeys?.has('claimAlerts')     },
    { key: 'premiumReminder', label: 'Premium Reminders',    description: 'Reminders before premium due date',    value: notifs.premiumReminder, onChange: () => handleToggleNotif('premiumReminder'), saving: savingKeys?.has('premiumReminder') },
  ];

  const kycBadge  = { Verified: 'profile-badge--green', Pending: 'profile-badge--amber', Rejected: 'profile-badge--red' }[fullUser?.kycStatus]  || 'profile-badge--gray';
  const riskBadge = { LOW: 'profile-badge--green', MEDIUM: 'profile-badge--amber', HIGH: 'profile-badge--red' }[fullUser?.riskLevel] || 'profile-badge--gray';

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">

        {msg && (
          <div className={`profile-flash ${msg.ok ? 'profile-flash--ok' : 'profile-flash--err'}`}>
            {msg.text}
          </div>
        )}

        {/* HERO */}
        <motion.div className="profile-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>

          <div className="profile-hero__left">
            <div className="profile-hero__avatar-wrap">
              <ProfilePhotoUploader
                currentPhoto={fullUser?.profilePhoto}
                name={profile.name}
                onUploaded={handlePhotoUploaded}
              />
            </div>
            <div className="profile-hero__info">
              <h2 className="profile-hero__name">{profile.name || '—'}</h2>
              <span className="profile-hero__role">Rider</span>
              <p className="profile-hero__email">{profile.email}</p>
              <div className="profile-hero__badges">
                <span className={`profile-badge ${fullUser?.emailVerified ? 'profile-badge--green' : 'profile-badge--red'}`}>
                  {fullUser?.emailVerified ? '✔ Email' : '✘ Email'}
                </span>
                <span className={`profile-badge ${fullUser?.phoneVerified ? 'profile-badge--green' : 'profile-badge--red'}`}>
                  {fullUser?.phoneVerified ? '✔ Phone' : '✘ Phone'}
                </span>
                <span className={`profile-badge ${kycBadge}`}>KYC: {fullUser?.kycStatus || 'Pending'}</span>
                {fullUser?.riskLevel && (
                  <span className={`profile-badge ${riskBadge}`}>Risk: {fullUser.riskLevel}</span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-hero__right">
            <div className="profile-hero__stats">
              <div className="profile-hero__stat">
                <span className="profile-hero__stat-value">{fullUser?.riskScore ?? '—'}</span>
                <span className="profile-hero__stat-label">Risk Score</span>
              </div>
              <div className="profile-hero__stat">
                <span className="profile-hero__stat-value">
                  {fullUser?.createdAt ? new Date(fullUser.createdAt).getFullYear() : '—'}
                </span>
                <span className="profile-hero__stat-label">Member Since</span>
              </div>
              <div className="profile-hero__stat">
                <span className="profile-hero__stat-value">
                  {fullUser?.recommendedPlan ? fullUser.recommendedPlan.split(' ')[0] : '—'}
                </span>
                <span className="profile-hero__stat-label">Active Plan</span>
              </div>
            </div>
            <div className="profile-hero__actions">
              <button className="btn btn-outline" onClick={() => navigate('/user-dashboard')}>← Dashboard</button>
              {editing ? (
                <>
                  <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : '✓ Save'}
                  </button>
                  <button className="btn btn-outline" onClick={handleCancelEdit}>Cancel</button>
                </>
              ) : (
                <button className="btn btn-outline" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
              )}
              <button className="btn btn-primary" onClick={logout}>Logout</button>
            </div>
          </div>

        </motion.div>

        {/* BODY GRID */}
        <div className="profile-body">

          {/* LEFT COLUMN */}
          <div className="profile-col">

            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 className="profile-card-title">📋 Account Status</h3>
              <div className="profile-info-rows">
                <InfoRow label="Email Verified" value={fullUser?.emailVerified ? '✔ Verified' : '✘ Not Verified'} valueClass={fullUser?.emailVerified ? 'status-verified' : 'status-unverified'} />
                <InfoRow label="Phone Verified" value={fullUser?.phoneVerified ? '✔ Verified' : '✘ Not Verified'} valueClass={fullUser?.phoneVerified ? 'status-verified' : 'status-unverified'} />
                <InfoRow label="KYC Status"     value={fullUser?.kycStatus || 'Pending'} valueClass={kycClass(fullUser?.kycStatus)} />
                <InfoRow label="Member Since"   value={fullUser?.createdAt ? new Date(fullUser.createdAt).toLocaleDateString() : '—'} />
                <InfoRow label="Last Login"     value={fullUser?.lastLogin  ? new Date(fullUser.lastLogin).toLocaleString() : 'Just now'} />
              </div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
              <h3 className="profile-card-title">📊 Risk Profile</h3>
              <div className="profile-info-rows">
                <InfoRow label="Risk Score"       value={fullUser?.riskScore != null ? `${fullUser.riskScore} / 100` : 'Not assessed'} />
                <InfoRow label="Risk Level"       value={fullUser?.riskLevel || 'Not assessed'} valueClass={riskClass(fullUser?.riskLevel)} />
                <InfoRow label="Recommended Plan" value={fullUser?.recommendedPlan || '—'} />
                <InfoRow label="Policy Health"    value={fullUser?.policyHealthCategory || '—'} />
              </div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <h3 className="profile-card-title">🎨 Appearance</h3>
              <p className="profile-card-desc">Choose your preferred theme. Saved to your account.</p>
              <div className="theme-options">
                {[
                  { val: 'light',  label: '☀️ Light'  },
                  { val: 'dark',   label: '🌙 Dark'   },
                  { val: 'system', label: '💻 System' },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    className={`theme-btn ${theme === val ? 'theme-btn--active' : ''}`}
                    onClick={() => handleTheme(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="profile-col">

            {/* Personal Information */}
            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 className="profile-card-title">👤 Personal Information</h3>
              {!editing && (
                <p className="profile-card-desc">Click <strong>✏️ Edit Profile</strong> in the header to make changes.</p>
              )}
              <div className="profile-fields--2col">
                {[
                  { label: 'Full Name',    key: 'name',        type: 'text',  required: true },
                  { label: 'Email',        key: 'email',       type: 'email', disabled: true },
                  { label: 'Phone Number', key: 'phone',       type: 'tel' },
                  { label: 'City',         key: 'city',        type: 'text' },
                  { label: 'Vehicle Type', key: 'vehicleType', type: 'text' },
                  { label: 'Address',      key: 'address',     type: 'text',  full: true },
                ].map(({ label, key, type, disabled, required, full }) => (
                  <div key={key} className={`profile-field${full ? ' profile-field--full' : ''}`}>
                    <label className="profile-field__label">{label}{required && editing && ' *'}</label>
                    <input
                      className="profile-field__input"
                      type={type}
                      value={profile[key]}
                      disabled={!editing || disabled}
                      onChange={(e) => {
                        setProfile(prev => ({ ...prev, [key]: e.target.value }));
                        if (key === 'phone') validatePhone(e.target.value);
                      }}
                    />
                    {key === 'phone' && phoneErr && <span className="profile-field__error">{phoneErr}</span>}
                  </div>
                ))}
              </div>
              {editing && (
                <div className="profile-actions">
                  <button className="btn btn-outline" onClick={handleCancelEdit}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </motion.div>

            {/* Notification Settings */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
              <SettingsSection
                title="🔔 Notification Settings"
                items={notifItems}
              />
            </motion.div>

            {/* Notification Center */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <NotificationCenter />
            </motion.div>

            {/* Security */}
            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
              <h3 className="profile-card-title">🔒 Security</h3>
              <p className="profile-card-desc">Change your password. Must be at least 8 characters.</p>
              <div className="profile-fields">
                {[
                  { label: 'Current Password', key: 'current', placeholder: 'Enter current password' },
                  { label: 'New Password',     key: 'next',    placeholder: 'Min 8 characters'       },
                  { label: 'Confirm Password', key: 'confirm', placeholder: 'Repeat new password'    },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} className="profile-field">
                    <label className="profile-field__label">{label}</label>
                    <input
                      className="profile-field__input"
                      type="password"
                      value={pwForm[key]}
                      onChange={(e) => setPwForm(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      autoComplete="new-password"
                    />
                  </div>
                ))}
              </div>
              <div className="profile-actions">
                <button
                  className="btn btn-outline"
                  style={{ color: '#EF4444', borderColor: '#EF4444' }}
                  onClick={logout}
                >
                  🚪 Logout
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleChangePassword}
                  disabled={pwSaving}
                >
                  {pwSaving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </motion.div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default UserProfile;
