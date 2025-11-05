import React from 'react';
import { motion } from 'framer-motion';

/**
 * FloatingLabel - Animated floating label with glassmorphism
 */
export function FloatingLabel({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
        delay
      }}
      className={`
        inline-block px-4 py-2
        bg-white/80 dark:bg-gray-900/80
        backdrop-blur-md
        border border-white/20
        rounded-full
        shadow-lg
        text-sm font-medium
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

/**
 * FloatingActionButton - Modern FAB with pulse animation
 */
export function FloatingActionButton({
  icon: Icon,
  onClick,
  position = 'bottom-right',
  className = '',
  tooltip
}) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const positions = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        onClick={onClick}
        className={`
          ${positions[position]}
          w-14 h-14
          bg-gradient-to-br from-blue-500 to-blue-600
          text-white
          rounded-full
          shadow-2xl shadow-blue-500/50
          flex items-center justify-center
          z-50
          ${className}
        `}
      >
        {/* Pulse animation */}
        <motion.span
          className="absolute inset-0 rounded-full bg-blue-500"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {Icon && <Icon className="w-6 h-6 relative z-10" />}
      </motion.button>

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed bottom-6 right-24 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap"
        >
          {tooltip}
        </motion.div>
      )}
    </div>
  );
}

/**
 * AnimatedProgress - Smooth progress bar with gradient
 */
export function AnimatedProgress({ value = 0, color = 'blue', height = 'md', className = '' }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heights[height]} ${className}`}>
      <motion.div
        className={`h-full bg-gradient-to-r ${colors[color]} rounded-full relative overflow-hidden`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{
          duration: 1,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </motion.div>
    </div>
  );
}

/**
 * StaggerContainer - Container that animates children with stagger effect
 */
export function StaggerContainer({ children, staggerDelay = 0.1, className = '' }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.5 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default {
  FloatingLabel,
  FloatingActionButton,
  AnimatedProgress,
  StaggerContainer
};
