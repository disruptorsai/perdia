import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot } from 'lucide-react';

export default function AgentPicker({ agents, selectedAgent, onAgentChange, className }) {
  const formatAgentName = (agent) => {
    // Use display_name if available, otherwise format the name
    return agent.display_name || agent.name
      .split('_')
      .filter(part => !part.match(/^[a-f0-9]{8,}$/)) // Remove client ID parts
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Select value={selectedAgent?.name || ''} onValueChange={onAgentChange}>
      <SelectTrigger className={`w-[220px] bg-white/80 backdrop-blur-sm shadow-md border-slate-200 h-11 ${className}`}>
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-slate-500" />
          <SelectValue placeholder="Select an agent..." />
        </div>
      </SelectTrigger>
      <SelectContent>
        {agents.map(agent => (
          <SelectItem key={agent.name} value={agent.name}>
            {formatAgentName(agent)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}