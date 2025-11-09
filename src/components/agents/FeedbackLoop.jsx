import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const FeedbackLoop = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [correctedResponse, setCorrectedResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('agent_conversations')
          .select('*')
          .eq('user_id', user.id);

        if (data) {
          setConversations(data);
        } else {
          console.error('Error fetching conversations:', error);
        }
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        const { data, error } = await supabase
          .from('agent_messages')
          .select('*')
          .eq('conversation_id', selectedConversation.id);

        if (data) {
          setMessages(data);
        } else {
          console.error('Error fetching messages:', error);
        }
      };
      fetchMessages();
    }
  }, [selectedConversation]);

  const handleSubmitFeedback = async () => {
    if (!selectedMessage || !rating) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('agent_feedback').insert({
        user_id: user.id,
        agent_name: selectedConversation.agent_name,
        conversation_id: selectedConversation.id,
        message_id: selectedMessage.id,
        rating,
        feedback_text: comments,
        // corrected_response: correctedResponse, // This column doesn't exist in the schema
      });

      if (error) {
        toast({
          title: 'Error',
          description: `Failed to submit feedback: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Feedback submitted successfully.',
        });
        // Reset form
        setSelectedConversation(null);
        setSelectedMessage(null);
        setRating(0);
        setComments('');
        setCorrectedResponse('');
      }
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Feedback Loop</h2>
      <div className="space-y-4">
        <Select onValueChange={(value) => setSelectedConversation(conversations.find(c => c.id === value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select a conversation" />
          </SelectTrigger>
          <SelectContent>
            {conversations.map(convo => (
              <SelectItem key={convo.id} value={convo.id}>
                {convo.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedConversation && (
          <Select onValueChange={(value) => setSelectedMessage(messages.find(m => m.id === value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select a message" />
            </SelectTrigger>
            <SelectContent>
              {messages.map(msg => (
                <SelectItem key={msg.id} value={msg.id}>
                  {msg.content.substring(0, 50)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedMessage && (
          <>
            <div>
              <label className="font-bold">Rating</label>
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    className={`cursor-pointer text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="comments" className="font-bold">Comments</label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide your feedback here..."
              />
            </div>
            {/* <div>
              <label htmlFor="correctedResponse" className="font-bold">Corrected Response (Optional)</label>
              <Textarea
                id="correctedResponse"
                value={correctedResponse}
                onChange={(e) => setCorrectedResponse(e.target.value)}
                placeholder="Provide an ideal response..."
              />
            </div> */}
            <Button onClick={handleSubmitFeedback} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackLoop;
