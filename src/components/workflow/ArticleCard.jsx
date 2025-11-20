/**
 * Article Card for Kanban Board
 */

import React from "react";
import { motion } from "framer-motion";
import { FileText, Clock, Zap, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ArticleCard({ item, isDragging, columnColor, columnId, onGenerate }) {
  const navigate = useNavigate();
  const isIdea = item.type === 'idea';

  const getTypeColor = (type) => {
    const colors = {
      ranking: "bg-purple-100 text-purple-700",
      career_guide: "bg-blue-100 text-blue-700",
      listicle: "bg-green-100 text-green-700",
      guide: "bg-amber-100 text-amber-700",
      faq: "bg-cyan-100 text-cyan-700"
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className={`
        bg-white rounded-xl border shadow-sm p-4 cursor-pointer
        transition-all duration-200
        ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : 'hover:shadow-md'}
      `}
      onClick={() => {
        if (!isIdea && item.id) {
          navigate(`/article-editor/${item.id}`);
        }
      }}
    >
      {/* Title */}
      <h4 className="font-medium text-gray-900 text-sm leading-snug mb-2 line-clamp-2">
        {item.title}
      </h4>

      {/* Type Badge */}
      {(item.type || item.content_type) && (
        <Badge className={`${getTypeColor(item.type || item.content_type)} text-xs mb-3`}>
          {(item.type || item.content_type || '').replace(/_/g, ' ')}
        </Badge>
      )}

      {/* Meta Info */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {isIdea ? (
          <>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(item.created_date)}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                onGenerate?.(item);
              }}
            >
              <Zap className="w-3 h-3 mr-1" />
              Generate
            </Button>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {item.word_count ? `${item.word_count} words` : 'Draft'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(item.created_date)}
            </span>
          </>
        )}
      </div>

      {/* Keywords Preview */}
      {item.target_keywords?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.target_keywords.slice(0, 2).map((kw, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {kw}
            </span>
          ))}
          {item.target_keywords.length > 2 && (
            <span className="text-xs text-gray-400">+{item.target_keywords.length - 2}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
