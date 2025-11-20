/**
 * Generating Article Card - Shows generation progress
 */

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function GeneratingArticleCard({ idea, currentStep, columnColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        bg-gradient-to-br from-white to-${columnColor}-50
        rounded-xl border-2 border-${columnColor}-200
        shadow-sm p-4 relative overflow-hidden
      `}
    >
      {/* Animated Background */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r from-transparent via-${columnColor}-100/50 to-transparent`}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Title */}
        <h4 className="font-medium text-gray-900 text-sm leading-snug mb-3 line-clamp-2">
          {idea.title}
        </h4>

        {/* Generation Status */}
        <div className="flex items-start gap-2">
          <Loader2 className={`w-4 h-4 text-${columnColor}-600 animate-spin flex-shrink-0 mt-0.5`} />
          <p className={`text-xs text-${columnColor}-700 font-medium`}>
            {currentStep || 'Starting...'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-${columnColor}-500`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 30,
              ease: "linear"
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
