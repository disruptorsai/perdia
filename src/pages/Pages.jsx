/**
 * PERDIA EDUCATION - PAGES ROUTING
 * Main router component for the application
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

// Import all page components
import Dashboard from './Dashboard';
import AIAgents from './AIAgents';
import KeywordManager from './KeywordManager';
import ContentLibrary from './ContentLibrary';
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
  // TODO: Add actual auth check here once auth is working
  // For now, we'll just render the children
  return children;
}

export default function Pages() {
  return (
    <BrowserRouter>
      <AuthenticatedRoute>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ai-agents" element={<AIAgents />} />
            <Route path="/keywords" element={<KeywordManager />} />
            <Route path="/content" element={<ContentLibrary />} />
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
    </BrowserRouter>
  );
}
