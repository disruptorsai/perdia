/**
 * PERDIA EDUCATION - PAGES ROUTING
 * Main router component for the application
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
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

        {/* Protected routes */}
        <Route
          path="/*"
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
                  <Route path="/automation" element={<AutomationControls />} />
                  <Route path="/wordpress" element={<WordPressConnection />} />
                  <Route path="/performance" element={<PerformanceDashboard />} />
                  <Route path="/blog" element={<BlogLibrary />} />
                  <Route path="/social" element={<SocialPostLibrary />} />
                  <Route path="/calendar" element={<ContentCalendar />} />
                  <Route path="/chat" element={<TeamChat />} />
                  <Route path="/profile" element={<Profile />} />

                  {/* Catch-all redirect to dashboard */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            </AuthenticatedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
