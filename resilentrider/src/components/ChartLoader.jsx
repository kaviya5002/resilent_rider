import { motion } from 'framer-motion';
import './ChartLoader.css';

function ChartLoader({ isLoading, children }) {
  if (!isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className="chart-loader-container">
      <div className="chart-skeleton">
        {/* Y-axis skeleton */}
        <div className="skeleton-axis y-axis">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="axis-line"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>

        {/* Chart bars skeleton */}
        <div className="skeleton-bars">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="skeleton-bar"
              initial={{ height: 0 }}
              animate={{ 
                height: `${Math.random() * 60 + 40}%`,
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                height: { duration: 0.8, delay: i * 0.1 },
                opacity: { duration: 1.5, repeat: Infinity, delay: i * 0.1 },
              }}
            />
          ))}
        </div>
      </div>

      <motion.div
        className="loading-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          ⟳
        </motion.div>
        <span>Loading chart data...</span>
      </motion.div>
    </div>
  );
}

export default ChartLoader;
