
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Instagram, Facebook, Youtube, Twitch, Twitter, Linkedin, Edit, Trash2, MessageSquare, Share2 } from 'lucide-react';

const channelIcons = {
    instagram: <Instagram className="w-4 h-4" />,
    facebook: <Facebook className="w-4 h-4" />,
    tiktok: <Twitch className="w-4 h-4" />, // Placeholder
    youtube: <Youtube className="w-4 h-4" />,
    reddit: <Twitch className="w-4 h-4" />, // Placeholder
    twitter: <Twitter className="w-4 h-4" />,
    linkedin: <Linkedin className="w-4 h-4" />,
};

const channelColors = {
    instagram: "pcc-bg-coral",
    facebook: "pcc-bg-blue",
    tiktok: "bg-black",
    youtube: "bg-red-600",
    reddit: "bg-orange-500",
    twitter: "bg-sky-500",
    linkedin: "pcc-bg-blue",
};

const channelDisplayNames = {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube",
    reddit: "Reddit",
    twitter: "X (Twitter)",
    linkedin: "LinkedIn",
};

export default function SocialPostList({ posts, allChannels, onPostSelect, onPostDelete }) {

    const groupedPosts = posts.reduce((acc, post) => {
        const channel = post.channel || 'other';
        if (!acc[channel]) {
            acc[channel] = [];
        }
        acc[channel].push(post);
        return acc;
    }, {});

    const getPostPreview = (content) => {
        // Remove markdown and get first 100 characters
        const plainText = content.replace(/[#*_`~]/g, '').replace(/\n/g, ' ');
        return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
    };

    const getPromptSnippet = (prompt) => {
        if (!prompt) return 'Generated content';
        // Get first 80 characters of the original prompt
        return prompt.length > 80 ? prompt.substring(0, 80) + '...' : prompt;
    };

    const formatLocalDateTime = (dateString) => {
        try {
            const date = new Date(dateString);
            // Ensure the date is valid and format in user's local timezone
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return format(date, 'MMM d, yyyy @ h:mm a');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    if (allChannels.length === 0) {
        return null;
    }

    return (
        <Tabs defaultValue={allChannels[0]} className="w-full">
            <TabsList className="grid w-full h-auto p-2 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg pcc-cultural-card" style={{ gridTemplateColumns: `repeat(${Math.min(allChannels.length, 7)}, 1fr)` }}>
                {allChannels.map(channel => (
                    <TabsTrigger key={channel} value={channel} className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:pcc-text-blue transition-all duration-300 rounded-lg font-sans">
                        {React.cloneElement(channelIcons[channel] || <MessageSquare className="w-4 h-4" />, { className: "w-4 h-4" })}
                        <span className="hidden sm:inline font-medium">{channelDisplayNames[channel] || channel}</span>
                        <span className="sm:hidden font-medium">{channel}</span>
                        <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-xs font-sans">
                            {groupedPosts[channel]?.length || 0}
                        </Badge>
                    </TabsTrigger>
                ))}
            </TabsList>

            {allChannels.map(channel => (
                <TabsContent key={channel} value={channel} className="mt-6">
                    {(groupedPosts[channel] && groupedPosts[channel].length > 0) ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {groupedPosts[channel].map(post => (
                                <Card 
                                    key={post.id} 
                                    className="group relative pcc-cultural-card border-0 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                                    onClick={() => onPostSelect(post)}
                                >
                                    <div className={`absolute top-0 left-0 right-0 h-1 ${channelColors[channel] || 'bg-slate-400'} rounded-t-lg`}></div>
                                    <CardContent className="p-4 pt-6 relative">
                                        <div className="absolute right-2 top-2 w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {React.cloneElement(channelIcons[channel] || <MessageSquare className="w-4 h-4" />, { 
                                                    className: "w-4 h-4 text-slate-600" 
                                                })}
                                                <span className="text-sm font-medium text-slate-600 capitalize font-sans">
                                                    {channelDisplayNames[channel] || channel} Post
                                                </span>
                                            </div>
                                            <Badge variant="outline" className={`text-xs font-sans ${post.status === 'Suggested' ? 'pcc-bg-yellow bg-opacity-20 text-yellow-800 border-yellow-300' : post.status === 'Scheduled' ? 'pcc-bg-coral bg-opacity-20 pcc-text-coral border-current' : 'pcc-bg-green bg-opacity-20 text-green-800 border-green-300'}`}>
                                                {post.status}
                                            </Badge>
                                        </div>
                                        
                                        <div className="mb-3 p-2 bg-slate-50/50 rounded-lg border-l-2 pcc-text-blue">
                                            <p className="text-xs text-slate-600 italic">
                                                "{getPromptSnippet(post.original_prompt)}"
                                            </p>
                                        </div>
                                        
                                        <p className="text-slate-700 text-sm leading-relaxed mb-4 line-clamp-3">
                                            {getPostPreview(post.content)}
                                        </p>
                                        
                                        <div className="flex items-center justify-between text-xs text-slate-500 font-sans pt-2 border-t border-slate-100">
                                            <span className="font-medium">{formatLocalDateTime(post.created_date)}</span>
                                            <span className="text-slate-400 group-hover:pcc-text-blue transition-colors">Click to view</span>
                                        </div>
                                    </CardContent>
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 bg-white/80 hover:bg-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPostSelect(post);
                                            }}
                                        >
                                            <Edit className="w-3 h-3 text-slate-600" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 bg-white/80 hover:bg-white hover:bg-red-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPostDelete(post);
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl pcc-cultural-card">
                            {React.cloneElement(channelIcons[channel] || <Share2 className="w-16 h-16" />, { className: "w-16 h-16 text-slate-300 mx-auto mb-6" })}
                            <p className="text-xl font-medium mb-3 font-sans">No posts found for {channelDisplayNames[channel] || channel}</p>
                            <p className="text-sm mb-4">Use the AI Content Agents to generate your first post for this channel.</p>
                            <div className="flex justify-center">
                              <div className="w-16 h-0.5 pcc-bg-coral rounded-full"></div>
                            </div>
                        </div>
                    )}
                </TabsContent>
            ))}
        </Tabs>
    );
}
