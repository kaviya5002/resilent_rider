import { motion } from 'framer-motion';
import './SettingsSection.css';

/**
 * SettingsSection — reusable card for both User and Admin profile pages.
 *
 * Props:
 *   title    {string}    — section heading
 *   items    {Array}     — [{ key, label, description?, value, onChange, saving? }]
 *   saving   {boolean}   — disables all toggles when true (global saving state)
 *   children {ReactNode} — optional extra content below toggles
 */
function SettingsSection({ title, items = [], saving = false, children }) {
  return (
    <div className="settings-section card">
      <div className="settings-section__header">
        <h3 className="settings-section__title">{title}</h3>
        {saving && <span className="settings-section__saving">saving…</span>}
      </div>

      {items.length > 0 && (
        <div className="settings-section__list">
          {items.map((item) => {
            const isDisabled = saving || item.saving;
            return (
              <div key={item.key} className={`settings-toggle-row ${isDisabled ? 'settings-toggle-row--disabled' : ''}`}>
                <div className="settings-toggle-row__info">
                  <span className="settings-toggle-row__label">{item.label}</span>
                  {item.description && (
                    <span className="settings-toggle-row__desc">{item.description}</span>
                  )}
                </div>

                <button
                  type="button"
                  className={`settings-toggle ${item.value ? 'settings-toggle--on' : 'settings-toggle--off'} ${isDisabled ? 'settings-toggle--saving' : ''}`}
                  onClick={() => { if (!isDisabled) item.onChange(); }}
                  aria-label={`Toggle ${item.label}`}
                  role="switch"
                  aria-checked={item.value}
                >
                  {item.saving ? (
                    <span className="settings-toggle__spinner" />
                  ) : (
                    <motion.span
                      className="settings-toggle__thumb"
                      animate={{ x: item.value ? 24 : 0 }}
                      transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {children && <div className="settings-section__extra">{children}</div>}
    </div>
  );
}

export default SettingsSection;
