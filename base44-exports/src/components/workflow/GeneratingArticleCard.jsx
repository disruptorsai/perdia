import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";

export default function GeneratingArticleCard({ idea, currentStep, columnColor, onClick }) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentStepText, setCurrentStepText] = useState(currentStep);

  // Typing animation effect
  useEffect(() => {
    if (currentStep === currentStepText) return;
    
    setCurrentStepText(currentStep);
    setDisplayedText("");
    
    if (!currentStep) return;
    
    let index = 0;
    const text = currentStep;
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 20);
    
    return () => clearInterval(interval);
  }, [currentStep]);

  return (
    <motion.div
      layoutId={`idea-${idea.id}`}
      initial={{ scale: 1, opacity: 1 }}
      animate={{ scale: 0.95, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      whileHover={{ scale: 0.98, y: -2 }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 40,
        mass: 0.5
      }}
      onClick={onClick}
      className="bg-white rounded-xl p-3 shadow-lg border-2 border-blue-300 relative overflow-hidden cursor-pointer hover:shadow-xl"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 opacity-50 animate-pulse"></div>
      
      <div className="relative z-10">
        {/* Title with sparkle icon */}
        <div className="flex items-start gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <h4 className="font-semibold text-gray-900 line-clamp-2 leading-tight text-sm">
            {idea.title}
          </h4>
        </div>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Generating article...</span>
          </div>
          
          {/* Current step with typing animation */}
          <div className="bg-blue-50 rounded-lg p-2 min-h-[40px]">
            <p className="text-xs text-gray-700 leading-relaxed">
              {displayedText}
              {displayedText.length > 0 && displayedText.length === currentStep?.length && (
                <span className="inline-block w-1 h-3 bg-blue-600 ml-0.5 animate-pulse"></span>
              )}
              {displayedText.length < currentStep?.length && (
                <span className="inline-block w-1 h-3 bg-blue-600 ml-0.5"></span>
              )}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {idea.source && (
            <Badge variant="outline" className="text-xs capitalize bg-white">
              {idea.source}
            </Badge>
          )}
          {idea.priority && (
            <Badge
              variant="outline"
              className={`text-xs ${
                idea.priority === 'high'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : idea.priority === 'medium'
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {idea.priority}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}