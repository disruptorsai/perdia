import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const colorSchemes = {
  blue: {
    bg: "bg-blue-500",
    lightBg: "bg-blue-100",
    text: "text-blue-700"
  },
  green: {
    bg: "bg-emerald-500",
    lightBg: "bg-emerald-100",
    text: "text-emerald-700"
  },
  amber: {
    bg: "bg-amber-500",
    lightBg: "bg-amber-100",
    text: "text-amber-700"
  },
  cyan: {
    bg: "bg-cyan-500",
    lightBg: "bg-cyan-100",
    text: "text-cyan-700"
  },
  red: {
    bg: "bg-red-500",
    lightBg: "bg-red-100",
    text: "text-red-700"
  }
};

export default function StatsCard({ title, value, icon: Icon, trend, color = "blue" }) {
  const colors = colorSchemes[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-none shadow-lg overflow-hidden hover-lift">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {trend && (
                <p className={`text-xs mt-2 ${colors.text} font-medium`}>
                  {trend}
                </p>
              )}
            </div>
            <div className={`w-14 h-14 ${colors.lightBg} rounded-xl flex items-center justify-center`}>
              <Icon className={`w-7 h-7 ${colors.text}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}