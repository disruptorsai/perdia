import React, { useState, useEffect } from 'react';
import { agentSDK } from '@/lib/agent-sdk';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AIAgentChat = () => {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      const agentList = await agentSDK.listAgents();
      setAgents(agentList);
    };
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      const fetchConversations = async () => {
        const convos = await agentSDK.listConversations({ agent_name: selectedAgent.agent_name });
        setConversations(convos);
      };
      fetchConversations();
    }
  }, [selectedAgent]);

  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        const msgs = await agentSDK.getConversation({ conversation_id: selectedConversation.id });
        setMessages(msgs.messages);
      };
      fetchMessages();
    }
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    const userMessage = { role: 'user', content: newMessage };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');

    let conversationToUpdate = selectedConversation;

    try {
      // If no conversation is selected, create a new one
      if (!conversationToUpdate) {
        if (!selectedAgent) {
          console.error("No agent selected");
          setLoading(false);
          return;
        }
        const newConversation = await agentSDK.createConversation({
          agent_name: selectedAgent.agent_name,
          initial_message: newMessage
        });
        setSelectedConversation(newConversation);
        // createConversation with initial_message already includes the messages
        setMessages(newConversation.messages || []);
        setConversations(prevConvos => [newConversation, ...prevConvos]);
      } else {
        // Send message to existing conversation
        const response = await agentSDK.sendMessage({
          conversation_id: conversationToUpdate.id,
          message: newMessage
        });
        setMessages(prevMessages => [...prevMessages, response.assistant_message]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToContentLibrary = (content) => {
    // This will be implemented later.
    console.log('Saving to content library:', content);
  };

  return (
    <div className="flex h-[calc(100vh-10rem)]">
      <div className="w-1/4 border-r p-4">
        <h2 className="text-xl font-bold mb-4">AI Agents</h2>
        <Select onValueChange={(value) => {
          const agent = agents.find(a => a.agent_name === value);
          setSelectedAgent(agent);
          setSelectedConversation(null); // Reset conversation when agent changes
          setMessages([]); // Clear messages
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map(agent => (
              <SelectItem key={agent.agent_name} value={agent.agent_name}>
                {agent.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedAgent && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Conversations</h3>
              <Button size="sm" onClick={() => {
                setSelectedConversation(null);
                setMessages([]);
              }}>New Chat</Button>
            </div>
            <ScrollArea className="h-96">
              {conversations.map(convo => (
                <div key={convo.id} onClick={() => setSelectedConversation(convo)} className="p-2 cursor-pointer hover:bg-gray-200 rounded-md">
                  {convo.title}
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>
      <div className="w-3/4 flex flex-col">
        <div className="flex-grow p-4">
          <ScrollArea className="h-full">
            {messages.map((msg, index) => (
              <Card key={index} className={`mb-4 ${msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <CardHeader>
                  <CardTitle className="capitalize">{msg.role}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{msg.content}</p>
                  {msg.role === 'assistant' && (
                    <Button onClick={() => handleSaveToContentLibrary(msg.content)} className="mt-2">
                      Save to Content Library
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </div>
        <div className="p-4 border-t">
          <div className="flex">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={!selectedAgent || loading}
            />
            <Button onClick={handleSendMessage} disabled={!selectedAgent || loading} className="ml-2">
              {loading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentChat;
