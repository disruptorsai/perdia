import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { COMPLETE_CONTENT, ANIMATIONS } from '@/lib/onboarding-config';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import Confetti from 'react-confetti';

/**
 * CompleteStep - Onboarding completion celebration
 * Shows accomplishments, next steps, and confetti celebration
 */
export default function CompleteStep({ onComplete, onboardingData }) {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  // Update window size for confetti
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stop confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleGoToDashboard = () => {
    onComplete();
  };

  const handleNavigateToPage = (route) => {
    onComplete();
    setTimeout(() => navigate(route), 100);
  };

  // Filter accomplishments based on what was completed
  const accomplishments = COMPLETE_CONTENT.accomplishments.map((item) => {
    if (item.conditional) {
      return {
        ...item,
        completed: onboardingData?.[item.key] || false,
      };
    }
    return item;
  });

  return (
    <div className="max-w-3xl mx-auto relative">
      {/* Confetti Animation */}
      {typeof window !== 'undefined' && showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      {/* Celebration Animation (fallback if no confetti) */}
      {typeof window === 'undefined' && showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              initial={{
                x: windowSize.width / 2,
                y: windowSize.height / 2,
                scale: 0,
              }}
              animate={{
                x: Math.random() * windowSize.width,
                y: Math.random() * windowSize.height,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', damping: 15 }}
      >
        {/* Success Icon */}
        <motion.div
          className="inline-block mb-4"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        <motion.h1
          className="text-2xl font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {COMPLETE_CONTENT.title}
        </motion.h1>

        <motion.p
          className="text-sm text-gray-600 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {COMPLETE_CONTENT.subtitle}
        </motion.p>

        <motion.p
          className="text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {COMPLETE_CONTENT.description}
        </motion.p>
      </motion.div>

      {/* Accomplishments */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            What You Accomplished
          </h2>
          <div className="space-y-3">
            {accomplishments.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <div
                    className={`
                    flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                    ${
                      item.completed
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }
                  `}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        item.completed ? 'text-green-600' : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-sm text-gray-900">
                        {item.title}
                      </h3>
                      {item.completed && (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* What's Next */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          {COMPLETE_CONTENT.next_steps.title}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {COMPLETE_CONTENT.next_steps.items.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3 + index * 0.1 }}
              >
                <Card
                  className="p-3 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleNavigateToPage(step.route)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 mb-0.5">
                        {step.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {step.description}
                      </p>
                      <div className="flex items-center text-xs text-blue-600 font-medium group-hover:text-blue-700">
                        <span>{step.action}</span>
                        <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Discovery Prompt */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7 }}
      >
        <Card className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Badge className="bg-purple-600 text-xs">New</Badge>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">
                {COMPLETE_CONTENT.discovery_prompt.title}
              </h3>
              <p className="text-xs text-gray-600">
                {COMPLETE_CONTENT.discovery_prompt.description}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex justify-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9 }}
      >
        <Button
          size="sm"
          onClick={handleGoToDashboard}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6"
        >
          {COMPLETE_CONTENT.cta}
        </Button>
      </motion.div>
    </div>
  );
}
