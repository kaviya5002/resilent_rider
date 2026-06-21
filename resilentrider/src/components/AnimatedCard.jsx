import { motion } from 'framer-motion';

const cardVariants = {
  initial: {
    opacity: 0,
    y: 50,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
  hover: {
    y: -8,
    boxShadow: '0 20px 40px rgba(17, 34, 80, 0.15)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.98,
  },
};

function AnimatedCard({ children, className = '', delay = 0, onClick }) {
  return (
    <motion.div
      className={className}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      custom={delay}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedCard;
