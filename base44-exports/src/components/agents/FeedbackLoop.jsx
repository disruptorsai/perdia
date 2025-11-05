import React, { useState, useEffect } from 'react';
import { agentSDK } from '@/agents';
import { AgentFeedback } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from "@/lib/utils";

export default function FeedbackLoop({ agentName }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [correctedResponse, setCorrectedResponse] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convos = await agentSDK.listConversations({ agent_name: agentName });
        setConversations(convos);
      } catch (error) {
        console.error("Error loading conversations:", error);
      }
    };
    loadConversations();
  }, [agentName]);
  
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const assistantMessages = selectedConversation?.messages.filter(m => m.role === 'assistant' && m.content) || [];

  const handleSubmitFeedback = async () => {
    if (!selectedMessage || rating === 0) {
      toast({
        title: "Incomplete Feedback",
        description: "Please select a message and provide a rating.",
        variant: "destructive",
      });
      return;
    }

    try {
      await AgentFeedback.create({
        agent_name: agentName,
        conversation_id: selectedConversationId,
        message_id: selectedMessage.id, // Assuming messages have IDs
        rating,
        corrected_response: correctedResponse,
        comments,
      });

      toast({
        title: "Feedback Submitted",
        description: "Thank you! Your feedback helps improve the agent.",
      });
      
      // Reset form
      setSelectedConversationId('');
      setSelectedMessage(null);
      setRating(0);
      setComments('');
      setCorrectedResponse('');

    } catch(error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle>Provide Feedback on Agent Responses</CardTitle>
        <CardDescription>
          Your feedback is crucial for improving the agent's performance. Select a recent conversation and a specific agent response to review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="conversation-select">1. Select a Conversation</Label>
          <Select value={selectedConversationId} onValueChange={setSelectedConversationId}>
            <SelectTrigger id="conversation-select">
              <SelectValue placeholder="Choose a conversation..." />
            </SelectTrigger>
            <SelectContent>
              {conversations.map(convo => (
                <SelectItem key={convo.id} value={convo.id}>
                  {convo.metadata?.name || `Conversation ${convo.id.slice(0, 6)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedConversation && (
          <div className="space-y-2">
            <Label htmlFor="message-select">2. Select an Agent Response to Review</Label>
            <Select onValueChange={(msgId) => setSelectedMessage(assistantMessages.find(m => m.id === msgId))}>
              <SelectTrigger id="message-select">
                <SelectValue placeholder="Choose a message..." />
              </SelectTrigger>
              <SelectContent>
                {assistantMessages.map((msg, idx) => (
                  <SelectItem key={msg.id || idx} value={msg.id}>
                    <p className="truncate pr-4">{`Response: "${msg.content.slice(0, 50)}..."`}</p>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {selectedMessage && (
            <div className="p-4 border rounded-md bg-slate-50">
                <p className="font-semibold text-sm mb-2">Selected Response:</p>
                <p className="text-sm text-slate-700 italic">"{selectedMessage.content}"</p>
            </div>
        )}

        <div className="space-y-2">
          <Label>3. Rate the Response</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Button key={star} variant="ghost" size="icon" onClick={() => setRating(star)}>
                <Star className={cn("w-6 h-6", rating >= star ? "text-yellow-400 fill-yellow-400" : "text-slate-300")} />
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="corrected-response">4. (Optional) Provide a Corrected or Better Response</Label>
          <Textarea
            id="corrected-response"
            value={correctedResponse}
            onChange={(e) => setCorrectedResponse(e.target.value)}
            placeholder="What the agent should have said..."
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comments">5. (Optional) Additional Comments</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Explain why the response was good or bad..."
            rows={3}
          />
        </div>

        <Button onClick={handleSubmitFeedback} disabled={!selectedMessage || rating === 0}>
          Submit Feedback
        </Button>
      </CardContent>
    </Card>
  );
}