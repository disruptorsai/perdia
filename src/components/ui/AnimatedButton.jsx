import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedButton - Modern button with smooth animations and ripple effect
 */
export function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  ...props
}) {
  const [ripples, setRipples] = React.useState([]);

  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
    glass: 'bg-white/60 backdrop-blur-md border border-white/20 text-gray-900 hover:bg-white/80 shadow-xl'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      x,
      y,
      id: Date.now()
    };

    setRipples([...ripples, newRipple]);

    setTimeout(() => {
      setRipples(ripples => ripples.filter(r => r.id !== newRipple.id));
    }, 600);

    props.onClick?.(e);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative overflow-hidden
        ${variants[variant]}
        ${sizes[size]}
        rounded-lg font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple effect */}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
          }}
          animate={{
            width: 300,
            height: 300,
            x: -150,
            y: -150,
            opacity: 0
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}

      {loading ? (
        <motion.div
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <motion.span
              whileHover={{ x: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Icon className="w-5 h-5" />
            </motion.span>
          )}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && (
            <motion.span
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <Icon className="w-5 h-5" />
            </motion.span>
          )}
        </>
      )}
    </motion.button>
  );
}

export default AnimatedButton;
