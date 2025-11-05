
import React, { useState, useEffect, useCallback } from 'react';
import { SocialPost } from '@/api/entities';
import { Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SocialPostList from '../components/social/SocialPostList';
import SocialPostEditorModal from '../components/social/SocialPostEditorModal';

export default function SocialPostLibrary() {
    const [socialPosts, setSocialPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // This defines all channels that have a corresponding AI agent.
    const socialChannels = [
        'instagram',
        'facebook',
        'tiktok',
        'youtube',
        'reddit',
        'twitter',
        'linkedin'
    ];

    const loadSocialPosts = useCallback(async () => {
        setLoading(true);
        try {
            const postData = await SocialPost.list('-created_date');
            setSocialPosts(postData);
        } catch (error) {
            console.error("Failed to load social posts", error);
            toast.error("Could not load social posts.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSocialPosts();
    }, [loadSocialPosts, refreshTrigger]);

    const handlePostSelect = (post) => {
        setEditingPost(post);
    };

    const handlePostUpdate = async (updatedData) => {
        if (!editingPost) return;

        try {
            await SocialPost.update(editingPost.id, updatedData);
            toast.success(`Post for ${updatedData.channel} has been saved.`);
            setEditingPost(null);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Error updating post:", error);
            toast.error("Could not save the post. Please try again.");
        }
    };

    const handlePostDelete = async (post) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            await SocialPost.delete(post.id);
            toast.success(`Post for ${post.channel} has been deleted.`);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Could not delete the post. Please try again.");
        }
    };
    
    return (
        <div className="p-4 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Share2 className="w-8 h-8 pcc-text-blue" />
                            Social Post Library
                        </h1>
                        <p className="text-slate-600 mt-1 truncate">
                            Manage all generated and reviewed social media content.
                        </p>
                    </div>
                </div>

                {loading ? (
                     <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                    </div>
                ) : (
                    <SocialPostList 
                        posts={socialPosts} 
                        allChannels={socialChannels}
                        onPostSelect={handlePostSelect}
                        onPostDelete={handlePostDelete}
                    />
                )}
            </div>
            
            {editingPost && (
                <SocialPostEditorModal 
                    post={editingPost}
                    onSave={handlePostUpdate}
                    onClose={() => setEditingPost(null)}
                />
            )}
        </div>
    );
}
