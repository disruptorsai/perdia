import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({
  isOpen,
  onClose,
  children,
  className = '',
  size = 'default',
  closeOnOverlayClick = true,
}) => {
  const sizes = {
    sm: 'max-w-md',
    default: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
          >
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`relative w-full ${sizes[size]} rounded-lg bg-background shadow-2xl ${className}`}
                >
                  {children}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const ModalHeader = ({ children, className = '', onClose, ...props }) => (
  <div className={`flex items-center justify-between p-6 border-b ${className}`} {...props}>
    <div className="flex-1">{children}</div>
    {onClose && (
      <button
        onClick={onClose}
        className="ml-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </button>
    )}
  </div>
);

export const ModalTitle = ({ children, className = '', ...props }) => (
  <h2 className={`text-xl font-semibold ${className}`} {...props}>
    {children}
  </h2>
);

export const ModalDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-muted-foreground mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const ModalContent = ({ children, className = '', ...props }) => (
  <div className={`p-6 max-h-[calc(90vh-200px)] overflow-y-auto ${className}`} {...props}>
    {children}
  </div>
);

export const ModalFooter = ({ children, className = '', ...props }) => (
  <div className={`flex items-center justify-end gap-2 p-6 border-t ${className}`} {...props}>
    {children}
  </div>
);

export default Modal;
