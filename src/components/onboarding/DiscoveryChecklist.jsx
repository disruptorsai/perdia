import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useOnboarding } from '@/hooks/useOnboarding';
import TourSelector from './TourSelector';
import {
  DISCOVERY_TASKS,
  DISCOVERY_CHECKLIST_CONFIG,
  ANIMATIONS,
} from '@/lib/onboarding-config';
import { ChevronDown, ChevronUp, X, Sparkles, Trophy, Target } from 'lucide-react';
import Confetti from 'react-confetti';

/**
 * DiscoveryChecklist - Dashboard widget with 10 optional learning tasks
 * Tracks progress, shows milestones, navigates to features
 */
export default function DiscoveryChecklist() {
  const navigate = useNavigate();
  const {
    discoveryTasks,
    showDiscoveryChecklist,
    setShowDiscoveryChecklist,
    markTaskComplete,
    markTaskIncomplete,
    getDiscoveryProgress,
  } = useOnboarding();

  const [isExpanded, setIsExpanded] = useState(true);
  const [showMilestone, setShowMilestone] = useState(null);
  const [previousProgress, setPreviousProgress] = useState(0);
  const [showTourSelector, setShowTourSelector] = useState(false);

  const progress = getDiscoveryProgress();

  // Check for milestone achievements
  useEffect(() => {
    if (progress.percentage === 50 && previousProgress < 50) {
      setShowMilestone(50);
      setTimeout(() => setShowMilestone(null), 3000);
    } else if (progress.percentage === 100 && previousProgress < 100) {
      setShowMilestone(100);
      setTimeout(() => setShowMilestone(null), 5000);
    }
    setPreviousProgress(progress.percentage);
  }, [progress.percentage]);

  // Don't show if dismissed
  if (!showDiscoveryChecklist) {
    return null;
  }

  const handleTaskClick = (task) => {
    // Toggle completion
    if (discoveryTasks[task.key]) {
      markTaskIncomplete(task.key);
    } else {
      markTaskComplete(task.key);
    }
  };

  const handleNavigate = (task) => {
    if (task.route) {
      navigate(task.route);
    } else if (task.key === 'take_tour') {
      setShowTourSelector(true);
    }
  };

  const handleDismiss = () => {
    if (confirm('Hide the discovery checklist? You can restart onboarding to see it again.')) {
      setShowDiscoveryChecklist(false);
    }
  };

  const milestoneMessage = showMilestone
    ? DISCOVERY_CHECKLIST_CONFIG.milestone_messages[showMilestone]
    : null;

  return (
    <>
      {/* Milestone Celebration */}
      <AnimatePresence>
        {showMilestone && (
          <>
            {typeof window !== 'undefined' && (
              <div className="fixed inset-0 pointer-events-none z-50">
                <Confetti
                  width={window.innerWidth}
                  height={window.innerHeight}
                  recycle={false}
                  numberOfPieces={150}
                  gravity={0.3}
                />
              </div>
            )}
            <motion.div
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
              initial={{ scale: 0, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: -50 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <Card className="p-6 shadow-2xl border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl mb-2">{milestoneMessage?.emoji}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {milestoneMessage?.title}
                    </h3>
                    <p className="text-gray-600">{milestoneMessage?.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Discovery Checklist Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          {/* Header */}
          <div className="p-6 border-b border-purple-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {DISCOVERY_CHECKLIST_CONFIG.title}
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-700"
                    >
                      {progress.completed}/{progress.total}
                    </Badge>
                  </h3>
                  <p className="text-sm text-gray-600">
                    {DISCOVERY_CHECKLIST_CONFIG.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      {DISCOVERY_CHECKLIST_CONFIG.collapse_text}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      {DISCOVERY_CHECKLIST_CONFIG.expand_text}
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {DISCOVERY_CHECKLIST_CONFIG.progress_label}
                </span>
                <span className="text-sm font-bold text-purple-600">
                  {progress.percentage}%
                </span>
              </div>
              <Progress
                value={progress.percentage}
                className="h-3"
                indicatorClassName="bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
              />
            </div>
          </div>

          {/* Task List */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-6 space-y-3">
                  {DISCOVERY_TASKS.map((task, index) => {
                    const Icon = task.icon;
                    const isCompleted = discoveryTasks[task.key];

                    return (
                      <motion.div
                        key={task.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          flex items-start gap-4 p-4 rounded-lg transition-all
                          ${
                            isCompleted
                              ? 'bg-green-50 border-2 border-green-200'
                              : 'bg-white border-2 border-gray-200 hover:border-purple-300'
                          }
                        `}
                      >
                        {/* Checkbox */}
                        <div className="flex-shrink-0 mt-0.5">
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => handleTaskClick(task)}
                            className={`
                              w-5 h-5
                              ${isCompleted ? 'border-green-600' : 'border-gray-400'}
                            `}
                          />
                        </div>

                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <div
                            className={`
                            w-10 h-10 rounded-lg flex items-center justify-center
                            ${
                              isCompleted
                                ? 'bg-green-100'
                                : 'bg-purple-100'
                            }
                          `}
                          >
                            <Icon
                              className={`w-5 h-5 ${
                                isCompleted ? 'text-green-600' : 'text-purple-600'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`
                            font-semibold mb-1
                            ${
                              isCompleted
                                ? 'text-green-900 line-through'
                                : 'text-gray-900'
                            }
                          `}
                          >
                            {task.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {task.description}
                          </p>

                          {/* Action Button */}
                          {(task.route || task.key === 'take_tour') && !isCompleted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleNavigate(task)}
                              className="text-purple-600 hover:text-purple-700 p-0 h-auto"
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              {task.key === 'take_tour' ? 'Choose Tour' : 'Start Task'}
                            </Button>
                          )}
                        </div>

                        {/* Completion Badge */}
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            <Badge className="bg-green-600">
                              ✓ Done
                            </Badge>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion Message */}
          {progress.percentage === 100 && isExpanded && (
            <motion.div
              className="p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-4">
                <Trophy className="w-12 h-12" />
                <div>
                  <h3 className="text-xl font-bold mb-1">
                    Congratulations! 🎉
                  </h3>
                  <p className="text-green-100">
                    You've completed all discovery tasks and mastered the Perdia platform!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* Tour Selector Dialog */}
      <TourSelector open={showTourSelector} onOpenChange={setShowTourSelector} />
    </>
  );
}
