import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function UserAvatar({ user, className }) {
  const getInitials = (name) => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    if (name.length > 0) {
      return name.substring(0, 2).toUpperCase();
    }
    return "?";
  };

  if (!user) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className={className}>
              <AvatarFallback className="bg-slate-200 text-slate-600 font-semibold">?</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>Unknown User</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar className={className}>
            <AvatarFallback className="bg-slate-200 text-slate-600 font-semibold">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>
          <p>{user.full_name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}