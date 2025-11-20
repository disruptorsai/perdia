import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const createPageUrl = (pageName) => `/${pageName}`;
import { Calendar, FileText, Zap, Eye, Edit3, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ArticleCard({ item, isDragging, columnColor, columnId, onGenerate }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation();
    
    if (item.type === 'idea') {
      // Generate article on dashboard with animation
      if (onGenerate) {
        onGenerate(item);
      } else {
        navigate(createPageUrl('ArticleWizard') + `?ideaId=${item.id}&auto=true`);
      }
    } else if (item.type === 'article') {
      // Navigate based on column
      if (columnId === 'generated') {
        // Generated articles -> Review page
        navigate(createPageUrl('ArticleReview') + `?id=${item.id}`);
      } else if (columnId === 'reviewed') {
        // Reviewed articles -> Edit article page
        navigate(createPageUrl('ArticleEditor') + `?id=${item.id}`);
      } else if (columnId === 'approved') {
        // Approved articles -> Edit article page
        navigate(createPageUrl('ArticleEditor') + `?id=${item.id}`);
      }
    }
  };

  const getActionIcon = () => {
    if (columnId === 'idea_queue') return <Zap className="w-4 h-4" />;
    if (columnId === 'generated') return <Eye className="w-4 h-4" />;
    if (columnId === 'reviewed') return <Edit3 className="w-4 h-4" />;
    if (columnId === 'approved') return <Edit3 className="w-4 h-4" />;
  };

  const getActionText = () => {
    if (columnId === 'idea_queue') return 'Generate';
    if (columnId === 'generated') return 'Review';
    if (columnId === 'reviewed') return 'Edit';
    if (columnId === 'approved') return 'Edit';
  };

  return (
    <motion.div
      layoutId={item.type === 'idea' ? `idea-${item.id}` : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ 
        type: "spring",
        stiffness: 500,
        damping: 40
      }}
      onClick={handleClick}
      className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
        isDragging
          ? 'shadow-2xl rotate-2 ring-4 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Title */}
      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
        {item.title}
      </h4>

      {/* Description for ideas */}
      {item.type === 'idea' && item.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Excerpt for articles */}
      {item.type === 'article' && item.excerpt && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {item.excerpt}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {item.type === 'idea' && item.source && (
          <Badge variant="outline" className="text-xs capitalize">
            {item.source}
          </Badge>
        )}
        {item.type === 'article' && item.content_type && (
          <Badge variant="outline" className="text-xs capitalize">
            {item.content_type.replace(/_/g, ' ')}
          </Badge>
        )}
        {item.priority && (
          <Badge
            variant="outline"
            className={`text-xs ${
              item.priority === 'high'
                ? 'bg-red-50 text-red-700 border-red-200'
                : item.priority === 'medium'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {item.priority}
          </Badge>
        )}
        {item.word_count && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FileText className="w-3 h-3" />
            {item.word_count}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          {new Date(item.created_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium text-${columnColor}-600`}>
          {getActionIcon()}
          {getActionText()}
        </div>
      </div>
    </motion.div>
  );
}