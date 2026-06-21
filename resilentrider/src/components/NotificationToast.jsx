import { AnimatePresence, motion } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import './NotificationToast.css';

const PRIORITY_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
const TYPE_BORDER    = { fraud: '#EF4444', claim: '#3B82F6', payout: '#10B981', warning: '#F59E0B', error: '#EF4444', success: '#10B981' };

export default function NotificationToast() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.toastId}
            className="toast-item"
            style={{ borderLeftColor: TYPE_BORDER[toast.type] || '#3B82F6' }}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0,  scale: 1   }}
            exit={{    opacity: 0, x: 80,  scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <span className="toast-icon">{toast.icon || 'ℹ️'}</span>
            <div className="toast-body">
              <p className="toast-title">{toast.title}</p>
              <p className="toast-message">{toast.message}</p>
            </div>
            {toast.priority && (
              <span className="toast-priority" style={{ background: `${PRIORITY_COLOR[toast.priority]}20`, color: PRIORITY_COLOR[toast.priority] }}>
                {toast.priority}
              </span>
            )}
            <button className="toast-close" onClick={() => dismissToast(toast.toastId)}>✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
