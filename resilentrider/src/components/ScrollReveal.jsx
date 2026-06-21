import { motion } from 'framer-motion';

const scrollRevealVariants = {
  hidden: {
    opacity: 0,
    y: 75,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const fadeInVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};

const slideInLeftVariants = {
  hidden: {
    opacity: 0,
    x: -100,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const slideInRightVariants = {
  hidden: {
    opacity: 0,
    x: 100,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const scaleInVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const variantMap = {
  slideUp: scrollRevealVariants,
  fadeIn: fadeInVariants,
  slideLeft: slideInLeftVariants,
  slideRight: slideInRightVariants,
  scaleIn: scaleInVariants,
};

function ScrollReveal({ 
  children, 
  variant = 'slideUp', 
  delay = 0, 
  className = '',
  once = true 
}) {
  const selectedVariant = variantMap[variant] || scrollRevealVariants;

  return (
    <motion.div
      className={className}
      variants={selectedVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.3 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
