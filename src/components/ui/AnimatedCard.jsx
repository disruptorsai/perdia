import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedCard - Modern card with smooth animations and hover effects
 */
export function AnimatedCard({
  children,
  className = '',
  delay = 0,
  hover = true,
  glass = false,
  ...props
}) {
  const glassStyles = glass
    ? 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 shadow-xl'
    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1] // Custom easing for smooth motion
      }}
      whileHover={hover ? {
        y: -4,
        scale: 1.01,
        transition: { duration: 0.2 }
      } : undefined}
      className={`rounded-xl ${glassStyles} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedStatCard - Stat card with number counter animation
 */
export function AnimatedStatCard({
  value,
  label,
  icon: Icon,
  color = 'blue',
  prefix = '',
  suffix = '',
  delay = 0
}) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    const duration = 1500;
    const steps = 60;
    const increment = numValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setDisplayValue(numValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const colorClasses = {
    blue: {
      bg: 'from-blue-500/20 via-blue-500/10 to-transparent',
      border: 'border-blue-500/20',
      icon: 'text-blue-600 bg-blue-100',
      text: 'text-blue-900'
    },
    green: {
      bg: 'from-green-500/20 via-green-500/10 to-transparent',
      border: 'border-green-500/20',
      icon: 'text-green-600 bg-green-100',
      text: 'text-green-900'
    },
    purple: {
      bg: 'from-purple-500/20 via-purple-500/10 to-transparent',
      border: 'border-purple-500/20',
      icon: 'text-purple-600 bg-purple-100',
      text: 'text-purple-900'
    },
    orange: {
      bg: 'from-orange-500/20 via-orange-500/10 to-transparent',
      border: 'border-orange-500/20',
      icon: 'text-orange-600 bg-orange-100',
      text: 'text-orange-900'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} backdrop-blur-sm p-6`}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            className={`w-10 h-10 rounded-lg ${colors.icon} flex items-center justify-center`}
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {Icon && <Icon className="w-5 h-5" />}
          </motion.div>
          <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>

        <motion.p
          className={`text-4xl font-bold ${colors.text}`}
          key={displayValue}
        >
          {prefix}{displayValue.toLocaleString()}{suffix}
        </motion.p>
      </div>
    </motion.div>
  );
}

/**
 * GlassCard - Glassmorphism card component
 */
export function GlassCard({ children, className = '', intensity = 'medium', ...props }) {
  const intensityClasses = {
    light: 'bg-white/40 backdrop-blur-sm',
    medium: 'bg-white/60 backdrop-blur-md',
    heavy: 'bg-white/80 backdrop-blur-xl'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        ${intensityClasses[intensity]}
        rounded-xl border border-white/20 shadow-2xl
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedCard;
