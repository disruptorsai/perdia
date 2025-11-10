import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WELCOME_CONTENT, ANIMATIONS } from '@/lib/onboarding-config';
import { Sparkles } from 'lucide-react';

/**
 * WelcomeStep - First step of the onboarding wizard
 * Introduces the platform, shows key features, and motivates the user to continue
 */
export default function WelcomeStep({ onNext, onSkip }) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-6">
        {/* Animated logo */}
        <motion.div
          className="inline-block mb-4"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
        >
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-xl overflow-hidden">
            <img
              src="/logo.png"
              alt="Perdia Education Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div {...ANIMATIONS.fadeIn} transition={{ delay: 0.2 }}>
          <Badge variant="secondary" className="mb-3 text-sm">
            {WELCOME_CONTENT.badge}
          </Badge>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-3xl font-bold text-gray-900 mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {WELCOME_CONTENT.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg text-gray-600 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {WELCOME_CONTENT.subtitle}
        </motion.p>

        {/* Description */}
        <motion.p
          className="text-sm text-gray-500 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {WELCOME_CONTENT.description}
        </motion.p>
      </div>

      {/* Stats Section */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {WELCOME_CONTENT.stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + index * 0.1 }}
          >
            <Card className="p-4 text-center hover:shadow-lg transition-shadow">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-gray-900 mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-gray-500">{stat.description}</div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Features Grid */}
      <motion.div
        className="grid grid-cols-2 gap-4 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        {WELCOME_CONTENT.features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 + index * 0.1 }}
            >
              <Card className="p-4 h-full hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Info text only - buttons moved to footer */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
      >
        <p className="text-xs text-gray-500">
          This quick setup will take about 5-7 minutes
        </p>
      </motion.div>
    </div>
  );
}
