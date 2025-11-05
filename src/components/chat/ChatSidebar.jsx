import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { PlusCircle, Hash, Lock, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
};

export default function ChatSidebar({ currentUser, channels, activeChannel, onSelectChannel, onNewChannel, allUsers }) {

    const publicChannels = channels.filter(c => c.type === 'public_channel');
    const privateChannels = channels.filter(c => c.type === 'private_channel');
    const directMessages = channels.filter(c => c.type === 'direct_message');

    const handleSelectDM = async (otherUser) => {
        const sortedEmails = [currentUser.email, otherUser.email].sort();
        const dmChannelName = `dm_${sortedEmails[0]}_${sortedEmails[1]}`;
        
        let dmChannel = channels.find(c => c.name === dmChannelName);

        if (!dmChannel) {
            // This is a placeholder, creating happens in ChatWindow when first message is sent
            dmChannel = {
                id: `new_${dmChannelName}`,
                name: dmChannelName,
                type: 'direct_message',
                member_emails: sortedEmails,
                isNew: true
            };
        }
        onSelectChannel(dmChannel);
    };

    const getOtherUserInDM = (channel) => {
        const otherEmail = channel.member_emails.find(email => email !== currentUser.email);
        return allUsers.find(u => u.email === otherEmail);
    };

    return (
        <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200">
                <h2 className="font-bold text-lg pcc-text-blue">Team Chat</h2>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {currentUser.role !== 'client' && (
                        <div>
                            <Button className="w-full" onClick={onNewChannel}>
                                <PlusCircle className="w-4 h-4 mr-2" /> New Channel
                            </Button>
                        </div>
                    )}

                    {currentUser.role !== 'client' && publicChannels.length > 0 && (
                        <div className="space-y-1">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase px-2">Public Channels</h3>
                            {publicChannels.map(channel => (
                                <button key={channel.id} onClick={() => onSelectChannel(channel)} className={`w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 ${activeChannel?.id === channel.id ? 'bg-slate-200 font-semibold' : 'hover:bg-slate-100'}`}>
                                    <Hash className="w-4 h-4 text-slate-500" />
                                    <span>{channel.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {currentUser.role !== 'client' && privateChannels.length > 0 && (
                        <div className="space-y-1">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase px-2">Private Channels</h3>
                            {privateChannels.map(channel => (
                                <button key={channel.id} onClick={() => onSelectChannel(channel)} className={`w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 ${activeChannel?.id === channel.id ? 'bg-slate-200 font-semibold' : 'hover:bg-slate-100'}`}>
                                    <Lock className="w-4 h-4 text-slate-500" />
                                    <span>{channel.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="space-y-1">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase px-2">Direct Messages</h3>
                        {/* Render existing DMs */}
                        {directMessages.map(channel => {
                            const otherUser = getOtherUserInDM(channel);
                            if (!otherUser) return null;
                            return (
                                <button key={channel.id} onClick={() => onSelectChannel(channel)} className={`w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 ${activeChannel?.id === channel.id || activeChannel?.name === channel.name ? 'bg-slate-200 font-semibold' : 'hover:bg-slate-100'}`}>
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={otherUser.profile_picture_url} />
                                        <AvatarFallback className="text-xs">{getInitials(otherUser.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <span>{otherUser.full_name}</span>
                                    {otherUser.role === 'admin' && <span className="text-xs text-white pcc-bg-blue px-1.5 py-0.5 rounded-full">Admin</span>}
                                </button>
                            );
                        })}
                        
                        {/* Render users available for new DMs */}
                        {allUsers.filter(u => u.email !== currentUser.email && !directMessages.some(dm => dm.member_emails.includes(u.email))).map(user => (
                             <button key={user.id} onClick={() => handleSelectDM(user)} className={`w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 hover:bg-slate-100`}>
                                <Avatar className="w-6 h-6">
                                    <AvatarImage src={user.profile_picture_url} />
                                    <AvatarFallback className="text-xs">{getInitials(user.full_name)}</AvatarFallback>
                                </Avatar>
                                <span>{user.full_name}</span>
                                {user.role === 'admin' && <span className="text-xs text-white pcc-bg-blue px-1.5 py-0.5 rounded-full">Admin</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}