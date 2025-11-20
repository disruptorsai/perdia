/**
 * PERDIA EDUCATION - PAGES ROUTING
 * Main router component for the application (v3 structure)
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, supabase } from '@/lib/supabase-client';

// Import Layout
import Layout from './Layout';

// Import page components
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import ContentLibrary from './ContentLibrary';
import KeywordManager from './KeywordManager';
import PerformanceDashboard from './PerformanceDashboard';
import WordPressConnection from './WordPressConnection';
import ApprovalQueue from './ApprovalQueue';
import ContentEditor from './ContentEditor';
import Profile from './Profile';
import AutomationControls from './AutomationControls';
import AIAgents from './AIAgents';

// Import newly created v4 pages
import ArticleWizard from './ArticleWizard';
import ArticleEditor from './ArticleEditor';
import ReviewQueue from './ReviewQueue';
import TopicDiscovery from './TopicDiscovery';
import Settings from './Settings';
import AITraining from './AITraining';
import Integrations from './Integrations';

// Auth wrapper component
function AuthenticatedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check current user
    checkUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function Pages() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes with Layout */}
        <Route
          element={
            <AuthenticatedRoute>
              <Layout />
            </AuthenticatedRoute>
          }
        >
          {/* Content Section */}
          <Route index element={<Dashboard />} />
          <Route path="content-library" element={<ContentLibrary />} />
          <Route path="review-queue" element={<ReviewQueue />} />

          {/* Generate Section */}
          <Route path="article-wizard" element={<ArticleWizard />} />
          <Route path="topic-discovery" element={<TopicDiscovery />} />

          {/* Research Section */}
          <Route path="keywords" element={<KeywordManager />} />

          {/* Reports Section */}
          <Route path="analytics" element={<PerformanceDashboard />} />

          {/* Configure Section */}
          <Route path="integrations" element={<Integrations />} />
          <Route path="settings" element={<Settings />} />
          <Route path="ai-training" element={<AITraining />} />

          {/* Article Editor with optional ID */}
          <Route path="article-editor" element={<ArticleEditor />} />
          <Route path="article-editor/:id" element={<ArticleEditor />} />

          {/* Profile */}
          <Route path="profile" element={<Profile />} />

          {/* Legacy route redirects */}
          <Route path="content" element={<Navigate to="/content-library" replace />} />
          <Route path="approvals" element={<Navigate to="/review-queue" replace />} />
          <Route path="performance" element={<Navigate to="/analytics" replace />} />
          <Route path="wordpress" element={<Navigate to="/integrations" replace />} />
          <Route path="ai-agents" element={<Navigate to="/ai-training" replace />} />
          <Route path="automation" element={<Navigate to="/settings" replace />} />

          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
