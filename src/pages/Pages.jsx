/**
 * PERDIA EDUCATION - PAGES ROUTING
 * Main router component for the application
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import AppLayoutV2 from '@/components/layout/AppLayoutV2';
import { getCurrentUser, supabase } from '@/lib/supabase-client';

// Import all page components
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import AIAgents from './AIAgents';
import KeywordManager from './KeywordManager';
import ContentLibrary from './ContentLibrary';
import ContentEditor from './ContentEditor';
import ApprovalQueue from './ApprovalQueue';
import AutomationControls from './AutomationControls';
import WordPressConnection from './WordPressConnection';
import PerformanceDashboard from './PerformanceDashboard';
import BlogLibrary from './BlogLibrary';
import SocialPostLibrary from './SocialPostLibrary';
import ContentCalendar from './ContentCalendar';
import TeamChat from './TeamChat';
import Profile from './Profile';

// Perdia V2 - New Pages
import TopicQuestionsManager from './TopicQuestionsManager';
import PipelineConfiguration from './PipelineConfiguration';
import Settings from './Settings';

// Perdia V2 - Redesigned Pages (Simplified)
import DashboardV2 from './DashboardV2';
import ApprovalQueueV2 from './ApprovalQueueV2';
import TopicQuestionsManagerV2 from './TopicQuestionsManagerV2';
import SettingsV2 from './SettingsV2';
import ArticleReview from './ArticleReview';
import AITraining from './AITraining';

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009fde] mx-auto mb-4"></div>
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

        {/* Protected routes - V2 (Default, Simplified) */}
        <Route
          path="/v2/*"
          element={
            <AuthenticatedRoute>
              <AppLayoutV2>
                <Routes>
                  <Route path="/" element={<DashboardV2 />} />
                  <Route path="/approval" element={<ApprovalQueueV2 />} />
                  <Route path="/approval/:id/review" element={<ArticleReview />} />
                  <Route path="/ai-training" element={<AITraining />} />
                  <Route path="/topics" element={<TopicQuestionsManagerV2 />} />
                  <Route path="/settings" element={<SettingsV2 />} />
                  <Route path="*" element={<Navigate to="/v2" replace />} />
                </Routes>
              </AppLayoutV2>
            </AuthenticatedRoute>
          }
        />

        {/* Protected routes - V1 (Legacy, Full Feature Set) */}
        <Route
          path="/v1/*"
          element={
            <AuthenticatedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/ai-agents" element={<AIAgents />} />
                  <Route path="/keywords" element={<KeywordManager />} />
                  <Route path="/content" element={<ContentLibrary />} />
                  <Route path="/content/edit/:id" element={<ContentEditor />} />
                  <Route path="/approvals" element={<ApprovalQueue />} />
                  <Route path="/approval-queue" element={<ApprovalQueue />} />
                  <Route path="/automation" element={<AutomationControls />} />
                  <Route path="/wordpress" element={<WordPressConnection />} />
                  <Route path="/performance" element={<PerformanceDashboard />} />
                  <Route path="/blog" element={<BlogLibrary />} />
                  <Route path="/social" element={<SocialPostLibrary />} />
                  <Route path="/calendar" element={<ContentCalendar />} />
                  <Route path="/chat" element={<TeamChat />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/topic-questions" element={<TopicQuestionsManager />} />
                  <Route path="/pipeline-config" element={<PipelineConfiguration />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/v1" replace />} />
                </Routes>
              </AppLayout>
            </AuthenticatedRoute>
          }
        />

        {/* Default route - Redirect to V2 (Simplified) */}
        <Route
          path="/"
          element={
            <AuthenticatedRoute>
              <Navigate to="/v2" replace />
            </AuthenticatedRoute>
          }
        />

        {/* Profile route (accessible from both V1 and V2) */}
        <Route
          path="/profile"
          element={
            <AuthenticatedRoute>
              <AppLayoutV2>
                <Profile />
              </AppLayoutV2>
            </AuthenticatedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
