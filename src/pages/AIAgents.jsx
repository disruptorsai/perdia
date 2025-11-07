
import React, { useState, useEffect, useCallback } from 'react';
import { agentSDK } from '@/agents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, MessageSquare, Files, BookOpen, Star } from 'lucide-react';
import ChatInterface from '../components/agents/ChatInterface';
import KnowledgeBase from '../components/agents/KnowledgeBase';
import TrainingInterface from '../components/agents/TrainingInterface';
import FeedbackLoop from '../components/agents/FeedbackLoop';
import ChatHistoryPanel from '../components/agents/ChatHistoryPanel';
import { toast } from 'sonner';
import { User } from '@/api/entities';

const DELETED_CONVOS_KEY = 'deleted_conversation_ids';

export default function AIAgents() {
    const [activeTab, setActiveTab] = useState('chat');
    
    const [clientAgents, setClientAgents] = useState([]);
    const [selectedAgentName, setSelectedAgentName] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);

    const loadClientAgents = useCallback(async () => {
        setLoading(true);
        try {
            // Load agents from database instead of hardcoding
            const agents = await agentSDK.listAgents();

            // Transform database agents to match expected format
            const clientAgentConfigs = agents.map(agent => ({
                name: agent.agent_name,
                display_name: agent.display_name,
                description: agent.description,
                system_prompt: agent.system_prompt,
                default_model: agent.default_model,
                temperature: agent.temperature,
                max_tokens: agent.max_tokens,
                capabilities: agent.capabilities,
                icon: agent.icon,
                color: agent.color,
            }));

            setClientAgents(clientAgentConfigs);

            if (!selectedAgentName && clientAgentConfigs.length > 0) {
                setSelectedAgentName(clientAgentConfigs[0].name);
            }
        } catch (error) {
            console.error("Failed to load client agents", error);
            toast.error("Failed to load agents. Please refresh the page.");
        } finally {
            setLoading(false);
        }
    }, [selectedAgentName]);

    const loadConversations = useCallback(async () => {
        if (!selectedAgentName) return;
        
        setLoading(true);
        try {
            const allConvos = await agentSDK.listConversations({ 
                agent_name: selectedAgentName 
            });
            
            const deletedIds = JSON.parse(localStorage.getItem(DELETED_CONVOS_KEY) || '[]');
            const clientConversations = allConvos.filter(c => !deletedIds.includes(c.id));
            
            setConversations(clientConversations);
        } catch (error) {
            console.error("Failed to load conversations", error);
            toast.error("Failed to load conversations");
        } finally {
            setLoading(false);
        }
    }, [selectedAgentName]);

    useEffect(() => {
        // DEVELOPMENT MODE: Auth disabled, skip auth check
        setAuthChecked(true);
        loadClientAgents();

        /* ORIGINAL AUTH CHECK - Uncomment when ready to enable auth
        const checkAuth = async () => {
            try {
                await User.me();
                setAuthChecked(true);
                loadClientAgents();
            } catch (error) {
                console.error("Authentication required:", error);
                setAuthChecked(true);
                setLoading(false);
                toast.error("Authentication required to access AI Agents.");
            }
        };
        checkAuth();
        */
    }, [loadClientAgents]);

    useEffect(() => {
        if (selectedAgentName) {
            loadConversations();
            setSelectedConversationId(null);
        } else {
            setConversations([]);
            setSelectedConversationId(null);
        }
    }, [selectedAgentName, loadConversations]);

    const handleSelectConversation = (id) => {
        setSelectedConversationId(id);
    };

    const handleNewConversation = () => {
        setSelectedConversationId(null);
        toast.success('Started new chat');
    };
    
    const handleConversationCreated = (newConversation) => {
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversationId(newConversation.id);
    };

    const handleDeleteConversation = async (conversationId) => {
        const deletedIds = JSON.parse(localStorage.getItem(DELETED_CONVOS_KEY) || '[]');
        if (!deletedIds.includes(conversationId)) {
            deletedIds.push(conversationId);
        }
        localStorage.setItem(DELETED_CONVOS_KEY, JSON.stringify(deletedIds));

        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (selectedConversationId === conversationId) {
            setSelectedConversationId(null);
        }
        toast.success("Conversation deleted", {
            description: "The conversation has been removed from your history.",
            duration: 3000
        });
    };

    const handleAgentSelect = (newAgentName) => {
        setSelectedAgentName(newAgentName);
    };

    const selectedAgent = clientAgents.find(a => a.name === selectedAgentName);

    if (!authChecked || (loading && clientAgents.length === 0)) {
        return (
            <div className="p-4 sm:p-6 h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Content Generation Agents</h3>
                    <p className="text-slate-500">Setting up specialized content agents for Perdia Education...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="min-w-0">
                        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                            <BrainCircuit className="w-8 h-8 text-blue-600" />
                            AI Content Engine
                        </h1>
                        <p className="text-slate-600 mt-2 text-lg">
                            Platform-specific content creation for: <span className="font-bold text-blue-600">Perdia Education</span>
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            {clientAgents.length} specialized content agent{clientAgents.length !== 1 ? 's' : ''} available • B2B & B2C content
                        </p>
                        <div className="mt-3 flex items-center">
                          <div className="w-12 h-0.5 bg-blue-500 rounded-full mr-2"></div>
                          <div className="w-6 h-0.5 bg-green-500 rounded-full mr-2"></div>
                          <div className="w-3 h-0.5 bg-blue-500 rounded-full"></div>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm h-auto p-2 rounded-xl border border-slate-200 shadow-lg">
                        <TabsTrigger value="chat" className="h-full py-3 px-4 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2 rounded-lg">
                            <MessageSquare className="w-4 h-4" /> <span className="hidden md:inline">Chat</span>
                        </TabsTrigger>
                        <TabsTrigger value="training" className="h-full py-3 px-4 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2 rounded-lg">
                            <BookOpen className="w-4 h-4" /> <span className="hidden md:inline">Training</span>
                        </TabsTrigger>
                        <TabsTrigger value="knowledge" className="h-full py-3 px-4 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2 rounded-lg">
                            <Files className="w-4 h-4" /> <span className="hidden md:inline">Knowledge</span>
                        </TabsTrigger>
                        <TabsTrigger value="feedback" className="h-full py-3 px-4 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2 rounded-lg">
                            <Star className="w-4 h-4" /> <span className="hidden md:inline">Feedback</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
                            <div className="lg:col-span-1 h-full">
                                <ChatHistoryPanel
                                    conversations={conversations}
                                    selectedConversationId={selectedConversationId}
                                    onSelectConversation={handleSelectConversation}
                                    onNewConversation={handleNewConversation}
                                    onDeleteConversation={handleDeleteConversation}
                                    loading={loading}
                                    selectedAgent={selectedAgent}
                                    agents={clientAgents}
                                    onAgentChange={handleAgentSelect}
                                />
                            </div>
                            <div className="lg:col-span-3 h-full">
                                <ChatInterface
                                    key={`${selectedAgentName}-${selectedConversationId || 'new'}`}
                                    agent={selectedAgent}
                                    conversationId={selectedConversationId}
                                    onConversationCreated={handleConversationCreated}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="training" className="mt-6">
                        <TrainingInterface agent={selectedAgent} />
                    </TabsContent>

                    <TabsContent value="knowledge" className="mt-6">
                        <KnowledgeBase agentName={selectedAgentName} agents={clientAgents} />
                    </TabsContent>

                    <TabsContent value="feedback" className="mt-6">
                        <FeedbackLoop agentName={selectedAgentName} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
