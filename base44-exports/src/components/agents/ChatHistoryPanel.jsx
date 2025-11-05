import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MessageSquare, Loader2, Trash2, Bot } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ChatHistoryPanel({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  loading,
  selectedAgent,
  agents,
  onAgentChange
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  const formatAgentName = (agent) => {
    return agent.display_name || agent.name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleDeleteClick = (e, convo) => {
    e.stopPropagation();
    setConversationToDelete(convo);
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      setDeletingId(conversationToDelete.id);
      onDeleteConversation(conversationToDelete.id);
      setConversationToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConversationToDelete(null);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm border rounded-xl shadow-lg">
        <div className="p-4 border-b space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1 font-sans">Select Agent</h3>
              <Select value={selectedAgent?.name || ''} onValueChange={onAgentChange}>
                <SelectTrigger className="w-full bg-white shadow-sm border-slate-200 h-11">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-slate-500" />
                    <SelectValue placeholder="Choose an agent..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {agents?.map(agent => (
                    <SelectItem key={agent.name} value={agent.name}>
                      {formatAgentName(agent)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedAgent && (
              <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded-md">
                {selectedAgent.description}
              </div>
            )}
          </div>
          
          <Button onClick={onNewConversation} className="w-full bg-blue-600 text-white shadow-lg hover:bg-blue-700">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-full p-8">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No conversations yet</p>
              <p className="text-xs text-slate-400">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((convo) => (
                <div key={convo.id} className="relative group">
                  <button
                    onClick={() => onSelectConversation(convo.id)}
                    className={cn(
                      'w-full text-left pl-3 pr-12 py-2.5 rounded-md transition-all duration-200 flex items-center gap-3 font-sans',
                      selectedConversationId === convo.id
                        ? 'bg-blue-50 text-blue-700 font-semibold ring-1 ring-inset ring-blue-200'
                        : 'hover:bg-slate-100 text-slate-700',
                      deletingId === convo.id && 'opacity-50 pointer-events-none'
                    )}
                    disabled={deletingId === convo.id}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0 text-slate-500" />
                    <span className="truncate text-sm">
                      {convo.metadata?.name || `Conversation ${convo.id.substring(0, 8)}`}
                    </span>
                    {deletingId === convo.id && (
                      <Loader2 className="w-4 h-4 animate-spin ml-auto text-slate-500" />
                    )}
                  </button>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                     <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "h-7 w-7 transition-all text-slate-400 hover:text-red-600 hover:bg-red-50",
                          deletingId === convo.id ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
                        )}
                        title="Delete conversation"
                        onClick={(e) => handleDeleteClick(e, convo)}
                        disabled={deletingId === convo.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <AlertDialog open={!!conversationToDelete} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{conversationToDelete?.metadata?.name || 'this conversation'}"? 
              This will hide the conversation from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}