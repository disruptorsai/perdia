import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search,
  TrendingUp,
  Sparkles,
  Plus,
  ThumbsUp,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function TopicDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('queue');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    // TODO: Implement AI-powered topic discovery search
    // This will use InvokeLLM with internet context to find trending topics
    setTimeout(() => {
      setIsSearching(false);
    }, 2000);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">Topic Discovery</h1>
          </div>
          <p className="text-gray-600">
            Discover trending topics and content ideas from social media, news, and industry sources
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search for Topic Ideas
            </CardTitle>
            <CardDescription>
              Enter keywords or topics to discover trending content ideas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="e.g., online MBA programs, AI in education, career advice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Idea Queue
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="generated" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Generated
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No topics discovered yet</h3>
                <p className="text-gray-500 mb-6">
                  Use the search bar above to discover trending topics and content ideas
                </p>
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  Coming Soon: Full Implementation
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardContent className="p-12 text-center">
                <ThumbsUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No approved topics yet</h3>
                <p className="text-gray-500">
                  Approved topic ideas will appear here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generated">
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No generated articles yet</h3>
                <p className="text-gray-500">
                  Articles generated from discovered topics will appear here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
