import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, User as UserIcon, Hash, Lock, Loader2, ChevronsUpDown, MessageSquare } from 'lucide-react';
import { ChatChannel } from '@/api/entities';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminChatSidebar({ clients, users, currentUser, channels, onSelectChat, onChannelCreated, activeChatId, loading }) {
  const [isCreatingDm, setIsCreatingDm] = useState(false);

  const handleSelectUser = async (user) => {
    if (user.email === currentUser.email || isCreatingDm) return;

    setIsCreatingDm(true);
    try {
      const members = [currentUser.email, user.email].sort();
      const existing = await ChatChannel.filter({
        type: 'direct_message',
        member_emails: members,
      });

      if (existing.length > 0) {
        onSelectChat(existing[0]);
      } else {
        const newDmChannel = await ChatChannel.create({
          name: `DM between ${currentUser.email} and ${user.email}`,
          type: 'direct_message',
          member_emails: members,
          owner_email: currentUser.email,
          client_id: user.client_id,
        });
        onChannelCreated(newDmChannel);
      }
    } catch (error) {
      console.error("Error creating DM channel:", error);
      toast.error("Could not start direct message.");
    } finally {
        setIsCreatingDm(false);
    }
  };

  const getChannelIcon = (channel) => {
    if (channel.type === 'direct_message') return <UserIcon className="w-4 h-4 text-slate-500" />;
    if (channel.type === 'private_channel') return <Lock className="w-4 h-4 text-slate-500" />;
    return <Hash className="w-4 h-4 text-slate-500" />;
  };

  const getDmPartner = (channel) => {
    const otherUserEmail = channel.member_emails.find(email => email !== currentUser.email);
    return users.find(u => u.email === otherUserEmail);
  };
  
  const renderChannelList = (channelList) => (
    <ul className="pl-4 space-y-1">
      {channelList.map(channel => (
        <li key={channel.id}>
          <button
            onClick={() => onSelectChat(channel)}
            className={cn("w-full text-left flex items-center gap-2 p-2 rounded-md", activeChatId === channel.id ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'hover:bg-slate-200')}
          >
            {getChannelIcon(channel)}
            <span className="truncate text-sm">{channel.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  const renderDmList = (dmList) => (
     <ul className="pl-4 space-y-1">
      {dmList.map(channel => {
        const partner = getDmPartner(channel);
        return (
            <li key={channel.id}>
            <button
                onClick={() => onSelectChat(channel)}
                className={cn("w-full text-left flex items-center gap-2 p-2 rounded-md", activeChatId === channel.id ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'hover:bg-slate-200')}
            >
                <UserIcon className="w-4 h-4 text-slate-500" />
                <span className="truncate text-sm">{partner?.full_name || 'Direct Message'}</span>
            </button>
            </li>
        );
      })}
    </ul>
  );

  const adminDms = channels.filter(c => c.type === 'direct_message' && c.member_emails.every(email => {
      const user = users.find(u => u.email === email);
      return user && user.user_type !== 'client';
  }));
  const internalChannels = channels.filter(c => c.type !== 'direct_message' && !c.client_id);

  return (
    <aside className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><MessageSquare /> Client Communication</h2>
      </div>
      <ScrollArea className="flex-1">
        {loading ? <Loader2 className="mx-auto my-8 animate-spin text-slate-400" /> : (
        <Accordion type="multiple" defaultValue={['internal', ...clients.map(c=>c.id)]} className="w-full">
            <AccordionItem value="internal">
                <AccordionTrigger className="px-4 py-2 hover:bg-slate-100 text-base font-semibold">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-emerald-700" /> Internal
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-1 bg-white">
                    <h4 className="text-xs font-semibold text-slate-500 px-4 mt-2 mb-1">CHANNELS</h4>
                    {renderChannelList(internalChannels)}
                    <h4 className="text-xs font-semibold text-slate-500 px-4 mt-4 mb-1">DIRECT MESSAGES</h4>
                    {renderDmList(adminDms)}
                </AccordionContent>
            </AccordionItem>

          {clients.map(client => {
            const clientChannels = channels.filter(c => c.client_id === client.id && c.type !== 'direct_message');
            const clientDms = channels.filter(c => c.client_id === client.id && c.type === 'direct_message');
            return (
              <AccordionItem key={client.id} value={client.id}>
                <AccordionTrigger className="px-4 py-2 hover:bg-slate-100 text-base font-semibold">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: client.color}}/>
                        <span className="truncate">{client.name}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-1 bg-white">
                    <h4 className="text-xs font-semibold text-slate-500 px-4 mt-2 mb-1">CHANNELS</h4>
                    {clientChannels.length > 0 ? renderChannelList(clientChannels) : <p className="px-4 text-xs text-slate-400">No channels</p>}
                    <h4 className="text-xs font-semibold text-slate-500 px-4 mt-4 mb-1">DIRECT MESSAGES</h4>
                    {clientDms.length > 0 ? renderDmList(clientDms) : <p className="px-4 text-xs text-slate-400">No DMs</p>}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
        )}
      </ScrollArea>
    </aside>
  );
}