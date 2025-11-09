import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIAgentChat from './AIAgentChat';
import TrainingInterface from '@/components/agents/TrainingInterface';
import KnowledgeBase from '@/components/agents/KnowledgeBase';
import FeedbackLoop from '@/components/agents/FeedbackLoop';

const AIContentEngine = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">AI Content Engine</h1>
      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="chat">
          <AIAgentChat />
        </TabsContent>
        <TabsContent value="training">
          <TrainingInterface />
        </TabsContent>
        <TabsContent value="knowledge">
          <KnowledgeBase />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackLoop />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIContentEngine;
