
import React, { useState, useEffect, useCallback } from 'react';
import { BlogPost } from '@/api/entities';
import PostList from '../components/blog/PostList';
import PostEditorModal from '../components/blog/PostEditorModal';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function BlogLibrary() {
    const [blogPosts, setBlogPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [editingPost, setEditingPost] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const loadBlogPosts = useCallback(async () => {
        setLoadingPosts(true);
        try {
            const postData = await BlogPost.list('-created_date');
            setBlogPosts(postData);
        } catch (error) {
            console.error("Failed to load blog posts", error);
            toast.error("Could not load blog posts.");
        } finally {
            setLoadingPosts(false);
        }
    }, []);

    useEffect(() => {
        loadBlogPosts();
    }, [loadBlogPosts, refreshTrigger]);

    const handlePostSelect = (post) => {
        setEditingPost(post);
    };

    const handlePostUpdate = async (updatedData) => {
        if (!editingPost) return;

        try {
            await BlogPost.update(editingPost.id, updatedData);
            toast.success(`"${updatedData.title}" has been saved successfully.`);
            setEditingPost(null);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Error updating post:", error);
            toast.error("Could not save the article. Please try again.");
        }
    };

    const handlePostDelete = async (post) => {
        try {
            await BlogPost.delete(post.id);
            toast.success(`"${post.title}" has been deleted successfully.`);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Could not delete the article. Please try again.");
        }
    };
    
    return (
        <div className="p-4 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <FileText className="w-8 h-8 pcc-text-blue" />
                            Blog Post Library
                        </h1>
                        <p className="text-slate-600 mt-1 truncate">
                            Manage all generated and reviewed blog content in one place.
                        </p>
                    </div>
                </div>

                <PostList 
                    posts={blogPosts} 
                    isLoading={loadingPosts}
                    onPostSelect={handlePostSelect}
                    onPostDelete={handlePostDelete}
                />
            </div>
            
            {editingPost && (
                <PostEditorModal 
                    post={editingPost}
                    onSave={handlePostUpdate}
                    onClose={() => setEditingPost(null)}
                />
            )}
        </div>
    );
}
