
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/api/entities';
import { ChatChannel } from '@/api/entities';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessageBubble from './ChatMessageBubble';
import ChatInput from './ChatInput';
import { Hash, Lock, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatWindow({ channel, currentUser }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentChannel, setCurrentChannel] = useState(channel);
    const viewportRef = useRef(null);
    const isPolling = useRef(false);

    // Initial load of messages
    useEffect(() => {
        const loadInitialMessages = async () => {
            if (!currentChannel || currentChannel.isNew) {
                setMessages([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const fetchedMessages = await ChatMessage.filter({ channel_id: currentChannel.id }, 'created_date');
                setMessages(fetchedMessages);
            } catch (error) {
                console.error("Error loading messages:", error);
                toast.error("Could not load messages for this channel.");
            } finally {
                setLoading(false);
            }
        };

        loadInitialMessages();
    }, [currentChannel]);

    // Efficient polling for NEW messages only
    useEffect(() => {
        // Do not poll if there's no current channel or it's a new channel being composed
        if (!currentChannel || currentChannel.isNew) return;

        const pollNewMessages = async () => {
            // Prevent multiple concurrent polling requests
            if (isPolling.current) return;
            isPolling.current = true;

            try {
                const lastMessage = messages[messages.length - 1]; // Get the last message in the current state

                if (lastMessage) {
                    // Fetch only messages created AFTER the last message we have
                    const newMessages = await ChatMessage.filter({
                        channel_id: currentChannel.id,
                        created_date: { '$gt': lastMessage.created_date } // Use '$gt' for "greater than"
                    }, 'created_date');

                    if (newMessages.length > 0) {
                        setMessages(prev => [...prev, ...newMessages]); // Append new messages
                    }
                } else if (messages.length === 0) {
                    // This handles the case where an existing channel has no messages loaded yet (e.g., initial load failed or returned empty),
                    // or it was legitimately empty. We re-fetch all messages to ensure we don't miss the first messages.
                    const fetchedMessages = await ChatMessage.filter({ channel_id: currentChannel.id }, 'created_date');
                    if (fetchedMessages.length > 0) {
                       setMessages(fetchedMessages);
                    }
                }
            } catch (error) {
                console.error("Error polling for new messages:", error);
            } finally {
                isPolling.current = false; // Reset the polling flag
            }
        };

        const interval = setInterval(pollNewMessages, 3000); // Faster polling for better real-time feel
        return () => clearInterval(interval); // Cleanup interval on component unmount or dependencies change

    }, [currentChannel, messages]); // Dependencies: currentChannel to know which channel to poll, messages to get the last message's date

    // Effect to scroll to the bottom when messages change
    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({
                top: viewportRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSendMessage = async (content) => {
        let channelToUse = currentChannel;
        try {
            // If it's a new DM, create the channel first
            if (channelToUse.isNew) {
                const newChannel = await ChatChannel.create({
                    name: channelToUse.name,
                    type: channelToUse.type,
                    member_emails: channelToUse.member_emails,
                    owner_email: currentUser.email
                });
                channelToUse = newChannel;
                setCurrentChannel(newChannel); // Update state to persistent channel
            }
            
            const newMessage = await ChatMessage.create({
                channel_id: channelToUse.id,
                content,
                sender_email: currentUser.email,
                sender_name: currentUser.full_name
            });
            setMessages(prev => [...prev, newMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message.");
        }
    };

    const getChannelIcon = () => {
        if (channel.type === 'public_channel') return <Hash className="w-5 h-5 text-slate-500" />;
        if (channel.type === 'private_channel') return <Lock className="w-5 h-5 text-slate-500" />;
        if (channel.type === 'direct_message') return <User className="w-5 h-5 text-slate-500" />;
        return null;
    };
    
    return (
        <div className="flex-1 flex flex-col bg-white">
            <header className="p-4 border-b border-slate-200 flex items-center gap-3">
                {getChannelIcon()}
                <h2 className="font-semibold text-lg">{channel.name}</h2>
            </header>
            
            <ScrollArea className="flex-1 p-4" ref={viewportRef}>
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map(msg => (
                            <ChatMessageBubble key={msg.id} message={msg} currentUser={currentUser} />
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="p-4 border-t border-slate-200">
                <ChatInput onSend={handleSendMessage} />
            </div>
        </div>
    );
}
