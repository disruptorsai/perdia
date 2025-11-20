/**
 * Kanban Board for Article Pipeline
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileEdit, Eye, CheckCircle } from "lucide-react";
import ArticleCard from "./ArticleCard";
import GeneratingArticleCard from "./GeneratingArticleCard";

const columns = [
  {
    id: "idea_queue",
    title: "Idea Queue",
    status: "approved_idea",
    icon: Sparkles,
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-600"
  },
  {
    id: "generated",
    title: "Generated",
    status: "draft",
    icon: FileEdit,
    color: "sky",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    iconColor: "text-sky-600"
  },
  {
    id: "reviewed",
    title: "In Review",
    status: "in_review",
    icon: Eye,
    color: "indigo",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    iconColor: "text-indigo-600"
  },
  {
    id: "approved",
    title: "Approved",
    status: "approved",
    icon: CheckCircle,
    color: "green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-600"
  }
];

export default function KanbanBoard({
  ideas = [],
  articles = [],
  onStatusChange,
  isLoading,
  generatingIdeas = {},
  onGenerateArticle
}) {
  const getItemsForColumn = (columnId) => {
    const items = [];

    // Add generating ideas for this specific column
    Object.entries(generatingIdeas).forEach(([ideaId, data]) => {
      if (data.column === columnId) {
        const idea = ideas.find(i => i.id === ideaId);
        if (idea) {
          items.push({
            ...idea,
            type: 'generating',
            generationStep: data.step,
            sortKey: `generating-${ideaId}`
          });
        }
      }
    });

    if (columnId === "idea_queue") {
      // Add non-generating ideas
      ideas.forEach(idea => {
        if (!generatingIdeas[idea.id]) {
          items.push({ ...idea, type: 'idea', sortKey: `idea-${idea.id}` });
        }
      });
    } else {
      // Add articles for this column
      const status = columns.find(c => c.id === columnId)?.status;
      if (status) {
        articles.forEach(article => {
          if (article.status === status) {
            items.push({ ...article, type: 'article', sortKey: `article-${article.id}` });
          }
        });
      }
    }

    return items;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column, colIndex) => {
        const items = getItemsForColumn(column.id);
        const Icon = column.icon;

        return (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: colIndex * 0.1 }}
            className="flex flex-col h-full"
          >
            {/* Column Header */}
            <div className={`${column.bgColor} ${column.borderColor} border-2 rounded-xl p-4 mb-3 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${column.iconColor}`} />
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                </div>
                <span className="bg-white px-2.5 py-1 rounded-full text-sm font-bold text-gray-700 shadow-sm">
                  {items.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-3 p-3 rounded-xl bg-gray-50/50 min-h-[400px]">
              {items.length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                  {column.id === 'idea_queue' ? 'No ideas in queue' : 'No articles'}
                </div>
              )}

              <AnimatePresence mode="sync">
                {items.map((item) => (
                  <div key={item.sortKey || item.id}>
                    {item.type === 'generating' ? (
                      <GeneratingArticleCard
                        idea={item}
                        currentStep={item.generationStep}
                        columnColor={column.color}
                      />
                    ) : (
                      <ArticleCard
                        item={item}
                        isDragging={false}
                        columnColor={column.color}
                        columnId={column.id}
                        onGenerate={onGenerateArticle}
                      />
                    )}
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
