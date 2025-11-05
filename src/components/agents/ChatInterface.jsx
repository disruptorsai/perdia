
import React, { useState, useEffect, useRef } from 'react';
import { agentSDK } from '@/agents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { Client } from '@/api/entities';
import { BlogPost } from '@/api/entities';
import { SocialPost } from '@/api/entities';
import { FileDocument } from '@/api/entities';
import { User } from '@/api/entities';
import { toast } from 'sonner';

const CONFIRMATION_SEPARATOR = '---|||---Ready to upload to the library?';

export default function ChatInterface({ agent, conversationId, onConversationCreated }) {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAgentThinking, setIsAgentThinking] = useState(false);
    const [clientData, setClientData] = useState(null);
    const [knowledgeFiles, setKnowledgeFiles] = useState([]);
    const [pendingContent, setPendingContent] = useState(null);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [error, setError] = useState(null);
    const [detailedError, setDetailedError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [authError, setAuthError] = useState(false);
    const viewportRef = useRef(null);
    const isSendingRef = useRef(false);

    const socialAgents = useRef([
        'instagram_content_creator',
        'facebook_content_creator',
        'tiktok_content_creator',
        'youtube_content_creator',
        'reddit_content_creator',
        'twitter_content_creator',
        'linkedin_content_creator'
    ]).current;

    useEffect(() => {
        const loadUserAndData = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user);
                setAuthError(false);
                console.log('[ChatInterface] User authenticated:', user.email);
            } catch (error) {
                console.error('[ChatInterface] Authentication error:', error);
                setAuthError(true);
                setError("You must be logged in to use AI agents.");
                setDetailedError("Please refresh the page and log in again.");
            }
        };
        loadUserAndData();
    }, []);

    useEffect(() => {
        const loadClientData = async () => {
            try {
                let clientInfo = await Client.list("name", 1);
                if (clientInfo.length > 0) {
                    setClientData(clientInfo[0]);
                }
            } catch (error) {
                console.error("Error loading client data:", error);
            }
        };
        loadClientData();
    }, []);

    useEffect(() => {
        const loadKnowledgeFiles = async () => {
            if (agent?.name) {
                try {
                    const agentSpecificFiles = await FileDocument.filter({ 
                        agent_name: agent.name 
                    });

                    const sharedFiles = await FileDocument.filter({
                        agent_name: 'shared'
                    });

                    const allFilesMap = new Map();
                    sharedFiles.forEach(file => allFilesMap.set(file.id, file));
                    agentSpecificFiles.forEach(file => allFilesMap.set(file.id, file));
                    
                    const combinedFiles = Array.from(allFilesMap.values());
                    setKnowledgeFiles(combinedFiles);

                } catch (error) {
                    console.error("Error loading knowledge base files:", error);
                    setKnowledgeFiles([]);
                }
            } else {
                setKnowledgeFiles([]);
            }
        };
        loadKnowledgeFiles();
    }, [agent]);
    
    useEffect(() => {
        const loadConversation = async () => {
            if (conversationId) {
                try {
                    setIsLoading(true);
                    setError(null);
                    setDetailedError(null);
                    const conv = await agentSDK.getConversation(conversationId);
                    setConversation(conv);
                    setMessages(conv.messages || []);
                } catch (error) {
                    console.error("Error loading conversation:", error);
                    setError("Failed to load conversation. Please try again.");
                    setDetailedError(JSON.stringify(error, null, 2));
                    setConversation(null);
                    setMessages([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                 setConversation(null);
                 setMessages([]);
                 setIsLoading(false);
                 setPendingContent(null);
                 setShowSaveConfirmation(false);
                 setIsAgentThinking(false);
                 setError(null);
                 setDetailedError(null);
            }
        };

        loadConversation();
    }, [conversationId]);
    
    useEffect(() => {
        if (conversation) {
            const unsubscribe = agentSDK.subscribeToConversation(conversation.id, (data) => {
                setMessages(data.messages || []);
            });
            return () => unsubscribe();
        }
    }, [conversation]);

    const saveSocialPost = async (contentToSave, originalPrompt) => {
        try {
            const channel = agent.name.replace('_content_creator', '');
            
            await SocialPost.create({
                channel: channel,
                content: contentToSave,
                original_prompt: originalPrompt || 'Generated content',
                status: 'Suggested',
                ai_generated: true
            });

            toast.success("Social post saved to Library", {
                description: `A new ${agent.display_name} post is now available in the Social Post Library.`,
                duration: 4000
            });

        } catch (error) {
            console.error("Error saving social post to library:", error);
            toast.error("Failed to save to Social Post Library", {
                description: "The post couldn't be saved. You can try again.",
                duration: 6000
            });
        }
    };
    
    const saveContentToLibrary = async (contentToSave, originalPrompt) => {
        if (agent?.name === 'blog_content_writer') {
            await saveBlogPost(contentToSave);
        } else if (socialAgents.includes(agent?.name)) {
            await saveSocialPost(contentToSave, originalPrompt);
        }
    };

    const saveBlogPost = async (contentToSave) => {
        try {
            const contentStartIndex = contentToSave.search(/<h[1-2][^>]*>|#\s/);
            const cleanContent = contentStartIndex !== -1 ? contentToSave.substring(contentStartIndex) : contentToSave;

            let title = 'AI Generated Blog Post';
            const titleMatch = cleanContent.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>|^#\s+(.+)/m);
            if (titleMatch) {
                title = (titleMatch[1] || titleMatch[2] || '').replace(/<[^>]*>/g, '').trim();
            }

            if (title.length > 100) {
                title = title.substring(0, 97) + '...';
            }
            
            await BlogPost.create({
                title: title,
                content: cleanContent,
                keywords: clientData?.focus_keywords || '',
                status: 'Draft',
                ai_generated: true
            });

            toast.success("Blog post saved to Library", {
                description: `"${title}" is now available in the Blog Library.`,
                duration: 4000
            });

        } catch (error) {
            console.error("Error saving blog content to library:", error);
            toast.error("Failed to save to Blog Library", {
                description: "The blog post couldn't be saved. You can try again.",
                duration: 6000
            });
        }
    };

    
    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({
                top: viewportRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }

        const lastMessage = messages[messages.length - 1];

        if (isAgentThinking && lastMessage?.role === 'assistant') {
            setIsAgentThinking(false);
        }

        const isSavableAgent = agent?.name === 'blog_content_writer' || socialAgents.includes(agent?.name);
        
        if (isSavableAgent && lastMessage?.role === 'assistant' && lastMessage.content?.includes(CONFIRMATION_SEPARATOR)) {
            const parts = lastMessage.content.split(CONFIRMATION_SEPARATOR);
            const content = parts[0];
            setPendingContent(content);
            setShowSaveConfirmation(true);
        } else {
            if(lastMessage?.role === 'user' || (lastMessage?.role === 'assistant' && !lastMessage?.content?.includes(CONFIRMATION_SEPARATOR))) {
                setShowSaveConfirmation(false);
                setPendingContent(null);
            }
        }
    }, [messages, agent, isAgentThinking, socialAgents]);

    const createConversationFromFirstMessage = async (firstMessage) => {
        try {
            if (!currentUser) {
                throw new Error('User not authenticated. Please refresh the page and log in.');
            }

            console.log('[ChatInterface] Creating conversation with agent:', agent?.name);
            console.log('[ChatInterface] Current user:', currentUser.email);
            
            if (!agent || !agent.name) {
                throw new Error('No agent selected or agent has no name');
            }

            const simpleTitle = firstMessage.length > 50 
                ? firstMessage.substring(0, 50) + '...' 
                : firstMessage;

            console.log('[ChatInterface] Creating conversation with data:', {
                agent_name: agent.name,
                metadata: { name: simpleTitle }
            });

            const newConv = await agentSDK.createConversation({
                agent_name: agent.name,
                metadata: {
                    name: simpleTitle,
                }
            });
            
            console.log('[ChatInterface] Conversation created successfully:', newConv);
            
            if (onConversationCreated) {
                onConversationCreated(newConv);
            }
            
            setConversation(newConv);
            setMessages(newConv.messages || []);
            return newConv;
        } catch (error) {
            console.error("[ChatInterface] Error creating conversation:", error);
            console.error("[ChatInterface] Error details:", {
                message: error.message,
                response: error.response,
                stack: error.stack
            });
            throw error;
        }
    };

    const handleSendMessage = async (messageText) => {
        if (authError) {
            toast.error("Authentication Required", {
                description: "Please refresh the page and log in to use AI agents.",
                duration: 5000
            });
            return;
        }

        if (isSendingRef.current) {
            console.log('[ChatInterface] Already sending, ignoring duplicate send');
            return;
        }

        const contentToSend = messageText || userInput;
        if (!contentToSend.trim()) {
            console.log('[ChatInterface] No content to send');
            return;
        }

        if (!agent || !agent.name) {
            const errorMsg = 'No agent selected. Please select an agent first.';
            console.error('[ChatInterface]', errorMsg);
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        if (!currentUser) {
            const errorMsg = 'You must be logged in to send messages.';
            console.error('[ChatInterface]', errorMsg);
            setError(errorMsg);
            setAuthError(true);
            toast.error("Please refresh and log in", {
                description: errorMsg,
                duration: 5000
            });
            return;
        }

        console.log('[ChatInterface] Sending message:', {
            agent: agent.name,
            user: currentUser.email,
            content: contentToSend.substring(0, 50) + '...',
            hasConversation: !!conversation
        });

        isSendingRef.current = true;
        
        setUserInput('');
        setShowSaveConfirmation(false);
        setIsAgentThinking(true);
        setError(null);
        setDetailedError(null);

        try {
            let currentConversation = conversation;
            
            if (!currentConversation) {
                console.log('[ChatInterface] No conversation exists, creating new one...');
                currentConversation = await createConversationFromFirstMessage(contentToSend);
                if (!currentConversation) {
                    throw new Error("Failed to create conversation");
                }
                console.log('[ChatInterface] New conversation created:', currentConversation.id);
            }

            console.log('[ChatInterface] Adding message to conversation:', currentConversation.id);
            await agentSDK.addMessage(currentConversation, {
                role: 'user',
                content: contentToSend,
            });
            console.log('[ChatInterface] Message added successfully');
            
        } catch (error) {
            console.error("[ChatInterface] Error sending message:", error);
            console.error("[ChatInterface] Full error object:", JSON.stringify(error, null, 2));
            
            const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
            const statusCode = error?.response?.status || error?.status;
            const responseData = error?.response?.data;
            
            let detailedErrorMsg = `Error: ${errorMessage}`;
            if (statusCode) {
                detailedErrorMsg += `\nStatus Code: ${statusCode}`;
            }
            if (responseData) {
                detailedErrorMsg += `\nResponse: ${JSON.stringify(responseData, null, 2)}`;
            }
            
            if (statusCode === 401 || statusCode === 403 || errorMessage.includes('authentication') || errorMessage.includes('logged in')) {
                setAuthError(true);
                setError("Authentication error - please refresh and log in");
                toast.error("Please Log In Again", {
                    description: "Your session may have expired. Please refresh the page and log in.",
                    duration: 8000
                });
            } else {
                setError(`Failed to send message (${statusCode || 'Error'})`);
                toast.error("Message Failed to Send", {
                    description: `${errorMessage}. Please try again or contact support.`,
                    duration: 8000
                });
            }
            
            setDetailedError(detailedErrorMsg);
            setUserInput(contentToSend);
            setIsAgentThinking(false);
        } finally {
            setTimeout(() => {
                isSendingRef.current = false;
            }, 1000);
        }
    };

    const handleConfirmation = async (shouldSave) => {
        setShowSaveConfirmation(false);
        if (shouldSave) {
            if (pendingContent) {
                const lastUserMessage = displayedMessages.filter(msg => msg.role === 'user').pop();
                const originalPrompt = lastUserMessage?.content || 'Generated content';
                
                await saveContentToLibrary(pendingContent, originalPrompt);
                setPendingContent(null);
            }
        } else {
            setPendingContent(null);
            toast.info("You can type your revisions below.", { duration: 3000 });
        }
    };

    const handleRetry = () => {
        setError(null);
        setDetailedError(null);
        setIsAgentThinking(false);
        isSendingRef.current = false;
        setAuthError(false);
    };

    const agentDisplayName = agent?.display_name || agent?.name?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'AI Agent';
    
    const displayedMessages = messages.map(msg => {
        if (msg.role === 'assistant' && msg.content?.includes(CONFIRMATION_SEPARATOR)) {
            return { ...msg, content: msg.content.split(CONFIRMATION_SEPARATOR)[0] };
        }
        return msg;
    });

    if (!agent) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8">
                <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Agent Selected</h3>
                <p className="text-sm text-slate-500 text-center max-w-md">
                    Please select an AI agent from the dropdown on the left to start a conversation.
                </p>
            </div>
        );
    }

    if (authError) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8">
                <Shield className="w-16 h-16 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Authentication Required</h3>
                <p className="text-sm text-slate-600 text-center max-w-md mb-4">
                    You must be logged in to use AI agents. Please refresh the page and log in.
                </p>
                <Button onClick={() => window.location.reload()} className="bg-blue-600 text-white">
                    Refresh Page
                </Button>
            </div>
        );
    }

    const showHumanizationReminder = agent?.name === 'seo_content_writer' || agent?.name === 'content_optimizer';

    return (
        <div className="flex flex-col h-full">
            <div className="border-b border-slate-200 p-4 bg-white">
                <h2 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                    {agentDisplayName}
                    {(agent?.name === 'blog_content_writer' || socialAgents.includes(agent?.name)) && (
                        <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded-full">
                            Library-Enabled
                        </span>
                    )}
                    {showHumanizationReminder && (
                        <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded-full">
                            Humanization Active
                        </span>
                    )}
                </h2>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                    <span>
                        Creating content for Perdia Education
                    </span>
                    {currentUser && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                            Logged in as {currentUser.email}
                        </span>
                    )}
                    {knowledgeFiles.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            {knowledgeFiles.length} reference file(s) available
                        </span>
                    )}
                </div>
                {showHumanizationReminder && (
                    <div className="mt-2 text-xs bg-orange-50 border border-orange-200 rounded px-2 py-1 text-orange-800">
                        🚨 <strong>Google Spam Update:</strong> Content will be humanized to pass AI detection
                    </div>
                )}
            </div>

            <ScrollArea className="flex-1 p-4 bg-slate-50" ref={viewportRef}>
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col justify-center items-center h-32 text-center px-4">
                        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                        <p className="text-sm text-red-600 mb-2 max-w-md font-semibold">{error}</p>
                        {detailedError && (
                            <details className="mt-2 max-w-2xl">
                                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                                    Show technical details
                                </summary>
                                <pre className="mt-2 p-3 bg-slate-100 rounded text-xs text-left overflow-auto max-h-64">
                                    {detailedError}
                                </pre>
                            </details>
                        )}
                        <p className="text-xs text-slate-500 mb-3 mt-2">
                            {authError 
                                ? "Please refresh the page and log in again." 
                                : "This might be a temporary issue. Try starting a new conversation."}
                        </p>
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2"
                                onClick={handleRetry}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                            {authError && (
                                <Button 
                                    size="sm" 
                                    className="mt-2 bg-blue-600 text-white"
                                    onClick={() => window.location.reload()}
                                >
                                    Refresh & Log In
                                </Button>
                            )}
                            {!authError && (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="mt-2"
                                    onClick={() => {
                                        setError(null);
                                        setDetailedError(null);
                                        setIsAgentThinking(false);
                                        isSendingRef.current = false;
                                        setConversation(null);
                                        setMessages([]);
                                    }}
                                >
                                    Start New Conversation
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {displayedMessages.length === 0 && !isAgentThinking && (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 max-w-md">
                                    <h3 className="font-semibold text-slate-900 mb-2">Start a conversation with {agentDisplayName}</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Type your message below to get started. The agent will help you create engaging content for Perdia Education targeting both administrators and adult learners.
                                    </p>
                                    {showHumanizationReminder && (
                                        <div className="text-xs bg-orange-50 border border-orange-200 rounded p-3 text-left mb-3">
                                            <p className="font-semibold text-orange-900 mb-1">🚨 Humanization Active</p>
                                            <p className="text-orange-800">All content will be written to sound authentically human and pass Google's spam filters. Content will include varied sentence structures, contractions, personality, and specific examples.</p>
                                        </div>
                                    )}
                                    {knowledgeFiles.length > 0 && (
                                        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                            📚 {knowledgeFiles.length} reference document(s) are available to help guide the content creation.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="space-y-4">
                            {displayedMessages.map((message, index) => (
                                <MessageBubble key={message.id || index} message={message} agent={agent} />
                            ))}
                        </div>
                        {isAgentThinking && (
                            <MessageBubble message={{ role: 'assistant' }} isTyping={true} />
                        )}
                    </>
                )}
            </ScrollArea>

            <div className="border-t border-slate-200 p-4 bg-white">
                 {showSaveConfirmation && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-800 text-center sm:text-left">Ready to save to the library?</p>
                        <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleConfirmation(true)}>Yes, Save</Button>
                            <Button size="sm" variant="outline" onClick={() => handleConfirmation(false)}>No, I have changes</Button>
                        </div>
                    </div>
                )}
                <div className="flex gap-2">
                    <Input
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={showSaveConfirmation ? "Type here to make revisions..." : (agent?.name === 'general_content_assistant' ? "Ask me anything..." : "Ask me to create content...")}
                        className="flex-1"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        disabled={isAgentThinking || isSendingRef.current || !agent || authError}
                    />
                    <Button 
                        onClick={() => handleSendMessage()} 
                        disabled={!userInput.trim() || isAgentThinking || isSendingRef.current || !agent || authError}
                        className="bg-blue-600 hover:opacity-90 text-white"
                    >
                        {(isAgentThinking || isSendingRef.current) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
