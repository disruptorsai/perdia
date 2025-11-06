import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef(({ className, accent, hover, ...props }, ref) => {
  // Build accent border classes
  const accentClasses = accent ? {
    green: 'border-l-4 border-l-green-500',
    blue: 'border-l-4 border-l-blue-500',
    orange: 'border-l-4 border-l-orange-500',
    purple: 'border-l-4 border-l-purple-500',
    red: 'border-l-4 border-l-red-500',
    yellow: 'border-l-4 border-l-yellow-500',
  }[accent] : '';

  // Add hover effect if requested
  const hoverClasses = hover ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : '';

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow",
        accentClasses,
        hoverClasses,
        className
      )}
      {...props}
    />
  );
})
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
