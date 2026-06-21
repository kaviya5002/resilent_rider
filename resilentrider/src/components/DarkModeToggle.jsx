import { motion } from 'framer-motion';
import { useDarkMode } from '../context/DarkModeContext';
import './DarkModeToggle.css';

function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <motion.button
      className="dark-mode-toggle"
      onClick={toggleDarkMode}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle dark mode"
    >
      <div className={`toggle-track ${isDarkMode ? 'dark' : 'light'}`}>
        <motion.div
          className="toggle-thumb"
          layout
          transition={{
            type: "spring",
            stiffness: 700,
            damping: 30
          }}
        >
          <span className="toggle-icon">
            {isDarkMode ? '🌙' : '☀️'}
          </span>
        </motion.div>
      </div>
    </motion.button>
  );
}

export default DarkModeToggle;
