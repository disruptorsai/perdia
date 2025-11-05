
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { ChatChannel } from '@/api/entities';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import CreateChannelModal from '../components/chat/CreateChannelModal';
import { MessagesSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamChat() {
    const [currentUser, setCurrentUser] = useState(null);
    const [channels, setChannels] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [activeChannel, setActiveChannel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);

            const userChannels = await ChatChannel.filter({ member_emails: { '$in': [user.email] } }, '-updated_date');
            setChannels(userChannels);

            if (user.role === 'admin' || user.role === 'staff') {
                const users = await User.list();
                setAllUsers(users);
            } else {
                const admins = await User.filter({ role: 'admin' });
                setAllUsers(admins);
            }

        } catch (error) {
            console.error("Error loading chat data:", error);
            toast.error("Failed to initialize chat. Please refresh the page.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handleCreateChannel = async (channelData) => {
        try {
            const newChannel = await ChatChannel.create(channelData);
            setChannels(prev => [newChannel, ...prev]);
            setActiveChannel(newChannel);
            setCreateModalOpen(false);
            toast.success(`Channel "${newChannel.name}" created!`);
        } catch (error) {
            console.error("Error creating channel:", error);
            toast.error("Failed to create channel.");
        }
    };
    
    const handleSelectChannel = (channel) => {
        setActiveChannel(channel);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="flex h-full bg-white">
            <ChatSidebar
                currentUser={currentUser}
                channels={channels}
                activeChannel={activeChannel}
                onSelectChannel={handleSelectChannel}
                onNewChannel={() => setCreateModalOpen(true)}
                allUsers={allUsers}
            />
            <div className="flex-1 flex flex-col">
                {activeChannel ? (
                    <ChatWindow
                        key={activeChannel.id}
                        channel={activeChannel}
                        currentUser={currentUser}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-slate-50">
                        <div className="text-center p-8 pcc-cultural-card rounded-2xl">
                            <MessagesSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-slate-800">Welcome to Team Chat</h2>
                            <p className="text-slate-500 mt-2">Select a channel to start messaging or create a new one.</p>
                        </div>
                    </div>
                )}
            </div>

            {isCreateModalOpen && (
                <CreateChannelModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onCreate={handleCreateChannel}
                    currentUser={currentUser}
                    allUsers={allUsers}
                />
            )}
        </div>
    );
}
