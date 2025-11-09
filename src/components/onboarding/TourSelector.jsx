import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import {
  AVAILABLE_TOURS,
  TOUR_SELECTOR_CONFIG,
  ANIMATIONS,
} from '@/lib/onboarding-config';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';

/**
 * TourSelector - Dialog for choosing feature tours
 * Shows all available tours with completion status
 */
export default function TourSelector({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { toursCompleted, markTourComplete } = useOnboarding();

  const handleSelectTour = (tour) => {
    // Mark as completed when user starts the tour
    markTourComplete(tour.key);

    // Navigate to the appropriate page
    const tourRoutes = {
      ai_agents: '/ai-agents',
      keyword_manager: '/keywords',
      content_workflow: '/content',
      automation: '/automation',
      performance: '/performance',
    };

    // Close dialog
    onOpenChange(false);

    // Navigate to tour page
    setTimeout(() => {
      navigate(tourRoutes[tour.key]);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {TOUR_SELECTOR_CONFIG.title}
          </DialogTitle>
          <DialogDescription>
            {TOUR_SELECTOR_CONFIG.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[600px] overflow-y-auto">
          {AVAILABLE_TOURS.map((tour, index) => {
            const Icon = tour.icon;
            const isCompleted = toursCompleted[tour.key];

            return (
              <motion.div
                key={tour.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`
                    p-6 cursor-pointer transition-all h-full
                    ${
                      isCompleted
                        ? 'bg-green-50 border-green-200 hover:border-green-300'
                        : 'hover:shadow-lg hover:border-purple-300'
                    }
                  `}
                  onClick={() => handleSelectTour(tour)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`
                      w-12 h-12 rounded-lg flex items-center justify-center
                      ${
                        isCompleted
                          ? 'bg-green-100'
                          : 'bg-gradient-to-br from-purple-600 to-blue-600'
                      }
                    `}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isCompleted ? 'text-green-600' : 'text-white'
                        }`}
                      />
                    </div>

                    {isCompleted && (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {TOUR_SELECTOR_CONFIG.completed_badge}
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {tour.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {tour.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {tour.duration}
                      </span>
                      <span>{tour.stops} stops</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-600 hover:text-purple-700 p-0 h-auto"
                    >
                      {isCompleted ? 'Retake' : TOUR_SELECTOR_CONFIG.cta}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Completion Status */}
        {Object.values(toursCompleted).filter(Boolean).length ===
          AVAILABLE_TOURS.length && (
          <motion.div
            className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8" />
              <div>
                <h3 className="font-semibold">All Tours Completed!</h3>
                <p className="text-sm text-green-100">
                  You've explored every feature of the platform
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
