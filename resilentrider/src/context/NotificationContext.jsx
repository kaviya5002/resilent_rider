import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

// ── localStorage helpers ──────────────────────────────────────
const LS_KEY      = (uid) => `notifications_${uid}`;
const LS_SETTINGS = (uid) => `notif_settings_${uid}`;

const DEFAULT_SETTINGS = { email: true, sms: false, claimAlerts: true, premiumReminder: true };

const SEED_NOTIFS = (userId) => [
  { _id: 'n1', userId, title: '👋 Welcome to ResilientRider!', message: 'Your account is set up. Start by logging your first ride.', type: 'info', priority: 'low', isRead: false, metadata: { icon: '👋' }, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { _id: 'n2', userId, title: '🛡️ Activate Insurance', message: 'Protect yourself — activate an insurance plan from your dashboard.', type: 'warning', priority: 'medium', isRead: false, metadata: { icon: '🛡️' }, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { _id: 'n3', userId, title: '📋 Claim System Ready', message: 'You can now submit and track insurance claims from the Claims section.', type: 'success', priority: 'low', isRead: true, metadata: { icon: '📋' }, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
];

function loadLocal(userId) {
  try {
    const stored = JSON.parse(localStorage.getItem(LS_KEY(userId)) || 'null');
    if (!stored) {
      const seeds = SEED_NOTIFS(userId);
      localStorage.setItem(LS_KEY(userId), JSON.stringify(seeds));
      return seeds;
    }
    return stored;
  } catch { return SEED_NOTIFS(userId); }
}

function saveLocal(userId, notifs) {
  try { localStorage.setItem(LS_KEY(userId), JSON.stringify(notifs)); } catch {}
}

function loadSettings(userId) {
  try { return JSON.parse(localStorage.getItem(LS_SETTINGS(userId)) || 'null') || DEFAULT_SETTINGS; }
  catch { return DEFAULT_SETTINGS; }
}

function saveSettings(userId, s) {
  try { localStorage.setItem(LS_SETTINGS(userId), JSON.stringify(s)); } catch {}
}

const recount = (list) => list.filter(n => !n.isRead).length;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId   = user?.id || user?._id;

  const [notifications,  setNotifications]  = useState([]);
  const [unreadCount,    setUnreadCount]     = useState(0);
  const [totalCount,     setTotalCount]      = useState(0);
  const [toasts,         setToasts]          = useState([]);
  const [loading,        setLoading]         = useState(false);
  const [settings,       setSettings]        = useState(DEFAULT_SETTINGS);
  // savingKeys: Set of keys currently being saved — for per-toggle spinner
  const [savingKeys,     setSavingKeys]      = useState(new Set());
  const socketRef = useRef(null);

  // ── Fetch notifications with optional filter ──────────────────
  const fetchNotifications = useCallback(async (filter = 'all', page = 1) => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/notifications/user?limit=20&page=${page}&filter=${filter}`);
      if (data.success) {
        setNotifications(page === 1 ? data.data : prev => [...prev, ...data.data]);
        setUnreadCount(data.unreadCount || 0);
        setTotalCount(data.total || 0);
        if (page === 1) saveLocal(userId, data.data);
      }
    } catch {
      const local = loadLocal(userId);
      setNotifications(local);
      setUnreadCount(recount(local));
      setTotalCount(local.length);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ── Fetch notification settings from backend ──────────────────
  const fetchSettings = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await api.get('/notifications/settings');
      if (data.success) { setSettings(data.data); saveSettings(userId, data.data); }
    } catch {
      setSettings(loadSettings(userId));
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    fetchSettings();
  }, [fetchNotifications, fetchSettings]);

  // ── Socket.IO — real-time notifications + settings sync ───────
  useEffect(() => {
    if (!userId) return;
    import('socket.io-client').then(({ io }) => {
      const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnectionAttempts: 5 });

      socket.on('connect', () => {
        // Room name is plain userId — matches server.js and createAndEmit
        socket.emit('join', { userId });
      });

      // New notification arrives in real-time
      socket.on('new_notification', (notif) => {
        setNotifications(prev => {
          const updated = [notif, ...prev];
          saveLocal(userId, updated);
          setUnreadCount(recount(updated));
          setTotalCount(t => t + 1);
          return updated;
        });
        const toastId = Date.now();
        setToasts(prev => [...prev, { ...notif, toastId }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.toastId !== toastId)), 4000);
      });

      // Settings updated from another tab/device — sync instantly
      socket.on('notification_settings_updated', ({ userId: uid, notifications: updated }) => {
        if (String(uid) === String(userId)) {
          setSettings(updated);
          saveSettings(userId, updated);
        }
      });

      socketRef.current = socket;
    }).catch(() => {});

    return () => {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    };
  }, [userId]);

  // ── Mark single as read ───────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n._id === id ? { ...n, isRead: true } : n);
      saveLocal(userId, updated);
      setUnreadCount(recount(updated));
      return updated;
    });
    try { await api.put(`/notifications/read/${id}`); } catch {}
  }, [userId]);

  // ── Mark all as read ──────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      saveLocal(userId, updated);
      return updated;
    });
    setUnreadCount(0);
    try { await api.put('/notifications/read-all'); } catch {}
  }, [userId]);

  // ── Delete notification ───────────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n._id !== id);
      saveLocal(userId, updated);
      setUnreadCount(recount(updated));
      setTotalCount(t => Math.max(0, t - 1));
      return updated;
    });
    try { await api.delete(`/notifications/${id}`); } catch {}
  }, [userId]);

  // ── Add local notification ────────────────────────────────────
  const addLocalNotification = useCallback((notif) => {
    const newNotif = {
      _id: 'local_' + Date.now(), userId,
      isRead: false, createdAt: new Date().toISOString(),
      priority: 'low', type: 'info', metadata: { icon: 'ℹ️' },
      ...notif,
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      saveLocal(userId, updated);
      setUnreadCount(recount(updated));
      setTotalCount(t => t + 1);
      return updated;
    });
    const toastId = Date.now();
    setToasts(prev => [...prev, { ...newNotif, toastId }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.toastId !== toastId)), 4000);
  }, [userId]);

  /**
   * updateSettings — toggles a single key, persists to backend,
   * emits socket event for cross-tab sync.
   * Uses per-key savingKeys so only the clicked toggle shows loading.
   */
  const updateSettings = useCallback(async (key, value) => {
    // Optimistic update
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(userId, updated);

    // Mark this key as saving
    setSavingKeys(prev => new Set([...prev, key]));
    try {
      // Send full object — backend accepts both full object and individual fields
      const { data } = await api.put('/notifications/settings', updated);
      if (data.success) {
        // Sync with what backend actually stored
        setSettings(data.data);
        saveSettings(userId, data.data);
      }
    } catch {
      // Revert on failure
      setSettings(prev => ({ ...prev, [key]: !value }));
      saveSettings(userId, { ...settings, [key]: !value });
    } finally {
      setSavingKeys(prev => { const next = new Set(prev); next.delete(key); return next; });
    }
  }, [settings, userId]);

  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }, []);

  // settingsSaving = true if ANY key is currently saving (for backward compat)
  const settingsSaving = savingKeys.size > 0;

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, totalCount, toasts, loading,
      settings, settingsSaving, savingKeys,
      fetchNotifications, markAsRead, markAllAsRead,
      deleteNotification, addLocalNotification,
      updateSettings, dismissToast,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
