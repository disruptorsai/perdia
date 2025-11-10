import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import {
  TOTAL_WIZARD_STEPS,
  WIZARD_STEPS,
  WIZARD_STEP_CONFIG,
  ANIMATIONS,
} from '@/lib/onboarding-config';

// Import step components
import WelcomeStep from './steps/WelcomeStep';
import WordPressSetupStep from './steps/WordPressSetupStep';
import KeywordSetupStep from './steps/KeywordSetupStep';
import GenerateContentStep from './steps/GenerateContentStep';
import CompleteStep from './steps/CompleteStep';

/**
 * OnboardingWizard - Main container for the onboarding wizard
 * Manages step navigation, progress tracking, and modal display
 */
export default function OnboardingWizard({ open, onOpenChange }) {
  const {
    currentStep,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();

  // Track data collected during onboarding
  const [onboardingData, setOnboardingData] = useState({
    wordpress_connected: false,
    wordpress_url: '',
    keyword_added: false,
    keyword_data: null,
    article_generated: false,
    article_data: null,
  });

  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  // Handle step navigation
  const handleNext = (stepData = {}) => {
    setOnboardingData((prev) => ({ ...prev, ...stepData }));
    setDirection(1);
    nextStep();
  };

  const handlePrevious = () => {
    setDirection(-1);
    previousStep();
  };

  const handleSkip = () => {
    skipOnboarding();
    onOpenChange(false);
  };

  const handleComplete = () => {
    completeOnboarding();
    onOpenChange(false);
  };

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / TOTAL_WIZARD_STEPS) * 100;

  // Render the current step component
  const renderStep = () => {
    const stepProps = {
      onNext: handleNext,
      onPrevious: handlePrevious,
      onSkip: handleSkip,
      onboardingData,
    };

    switch (currentStep) {
      case WIZARD_STEPS.WELCOME:
        return <WelcomeStep {...stepProps} />;
      case WIZARD_STEPS.WORDPRESS:
        return <WordPressSetupStep {...stepProps} />;
      case WIZARD_STEPS.KEYWORD:
        return <KeywordSetupStep {...stepProps} />;
      case WIZARD_STEPS.GENERATE:
        return <GenerateContentStep {...stepProps} />;
      case WIZARD_STEPS.COMPLETE:
        return <CompleteStep {...stepProps} onComplete={handleComplete} />;
      default:
        return <WelcomeStep {...stepProps} />;
    }
  };

  const currentStepConfig = WIZARD_STEP_CONFIG[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden p-0"
        onPointerDownOutside={(e) => e.preventDefault()} // Prevent closing by clicking outside
        onEscapeKeyDown={(e) => {
          // Allow ESC but confirm if user wants to skip
          e.preventDefault();
          if (confirm('Do you want to skip the onboarding tutorial?')) {
            handleSkip();
          }
        }}
      >
        <motion.div
          className="flex flex-col h-full"
          {...ANIMATIONS.modal}
        >
          {/* Header with Progress */}
          <div className="sticky top-0 z-10 bg-white border-b">
            {/* Close button - only show on welcome step or allow skip */}
            {currentStep === WIZARD_STEPS.WELCOME && (
              <button
                onClick={handleSkip}
                className="absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-20"
                aria-label="Close onboarding"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}

            {/* Progress bar */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <h3 className="text-xs font-medium text-gray-900">
                    {currentStepConfig.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Step {currentStep + 1} of {TOTAL_WIZARD_STEPS}
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-600">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className="h-1.5"
                indicatorClassName="bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out"
              />
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-between px-4 pb-2">
              {WIZARD_STEP_CONFIG.map((step, index) => (
                <div
                  key={step.id}
                  className="flex flex-col items-center flex-1"
                >
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                      transition-all duration-300
                      ${
                        index < currentStep
                          ? 'bg-green-500 text-white'
                          : index === currentStep
                          ? 'bg-blue-600 text-white ring-2 ring-blue-100'
                          : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <span
                    className={`
                      text-xs mt-0.5 text-center hidden sm:block
                      ${
                        index <= currentStep
                          ? 'text-gray-900 font-medium'
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content with AnimatePresence for smooth transitions */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={{
                  enter: (direction) => ({
                    x: direction > 0 ? 20 : -20,
                    opacity: 0,
                  }),
                  center: {
                    x: 0,
                    opacity: 1,
                  },
                  exit: (direction) => ({
                    x: direction > 0 ? -20 : 20,
                    opacity: 0,
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="p-4"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation (only show if not on complete step) */}
          {currentStep !== WIZARD_STEPS.COMPLETE && (
            <div className="sticky bottom-0 bg-white border-t px-4 py-2">
              <div className="flex items-center justify-between">
                {currentStep === WIZARD_STEPS.WELCOME ? (
                  // Welcome step - show nothing on left, buttons on right
                  <div></div>
                ) : (
                  // Other steps - show Previous button
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                  >
                    Previous
                  </Button>
                )}

                <div className="flex items-center gap-2">
                  {currentStep === WIZARD_STEPS.WELCOME ? (
                    // Welcome step - show Get Started and Skip
                    <>
                      <Button variant="outline" size="sm" onClick={handleSkip}>
                        Skip Tutorial
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleNext}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        Get Started
                      </Button>
                    </>
                  ) : (
                    // Other steps - show Skip button
                    <Button variant="outline" size="sm" onClick={handleSkip}>
                      Skip Tutorial
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
