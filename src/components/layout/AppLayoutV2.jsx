/**
 * PERDIA V2 - SIMPLIFIED APP LAYOUT
 * ==================================
 * Streamlined navigation with only 3 core screens
 *
 * V2 Philosophy:
 * - Single-purpose focus (blog writing for GetEducated.com)
 * - Questions-first strategy
 * - Simplified workflow (80% of time in Approval Queue)
 * - Minimal settings (only essentials)
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  MessageCircleQuestion,
  Settings as SettingsIcon,
  User,
  Menu,
  LogOut,
  Sparkles,
  DollarSign,
  Clock,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  Badge,
  Button,
  Separator,
} from '@/components/ui';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { signOut } from '@/lib/supabase-client';
import { toast } from 'sonner';

// V2 SIMPLIFIED NAVIGATION (Only 3 Core Screens)
const v2NavigationItems = [
  {
    title: 'Approval Queue',
    url: '/v2/approval',
    icon: CheckSquare,
    description: 'Review and approve articles',
    badge: null, // Will be populated with pending count
  },
  {
    title: 'Topics & Questions',
    url: '/v2/topics',
    icon: MessageCircleQuestion,
    description: 'Generate articles from questions',
    badge: null,
  },
  {
    title: 'Settings',
    url: '/v2/settings',
    icon: SettingsIcon,
    description: 'Configure automation & integrations',
    badge: null,
  },
];

// Stats for V2 mode (displayed in header)
function V2StatsBar() {
  // TODO: Replace with real data from Supabase
  const stats = {
    pendingArticles: 5,
    avgCostPerArticle: 0.07,
    articlesThisMonth: 23,
    slaExpiringToday: 2,
  };

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4" />
        <span>{stats.pendingArticles} pending</span>
      </div>
      <Separator orientation="vertical" className="h-4" />
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{stats.slaExpiringToday} expiring today</span>
      </div>
      <Separator orientation="vertical" className="h-4" />
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4" />
        <span>${stats.avgCostPerArticle}/article</span>
      </div>
      <Separator orientation="vertical" className="h-4" />
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        <span>{stats.articlesThisMonth} this month</span>
      </div>
    </div>
  );
}

function V2Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <Sidebar className="border-r">
      {/* Logo Header */}
      <SidebarHeader className="border-b px-4 pb-6 pt-0">
        <div className="flex flex-col items-center justify-center w-full gap-2">
          <img
            src="/logo.png"
            alt="Perdia Education Logo"
            className="w-full h-auto object-contain"
          />
          <Badge variant="secondary" className="text-xs font-medium">
            <Sparkles className="h-3 w-3 mr-1" />
            V2 Simplified
          </Badge>
        </div>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Core Workflow</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {v2NavigationItems.map((item) => {
                const isActive = location.pathname === item.url;

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="transition-all duration-200"
                      tooltip={item.description}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="destructive" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => navigate('/v2/topics')}
              >
                <MessageCircleQuestion className="h-4 w-4 mr-2" />
                Find New Questions
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => navigate('/v2/approval')}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Review Articles
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Help Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Perdia V2</p>
              <p className="text-xs">
                Simplified blog writer for GetEducated.com
              </p>
              <Separator className="my-2" />
              <div className="flex flex-col gap-1 text-xs">
                <a
                  href="/docs/PERDIA_V2_QUICK_START.md"
                  className="hover:text-primary transition-colors"
                >
                  Quick Start Guide
                </a>
                <a
                  href="/docs/DEPLOYMENT_GUIDE_V2.md"
                  className="hover:text-primary transition-colors"
                >
                  Deployment Guide
                </a>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Profile & Sign Out */}
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/profile" className="flex items-center gap-3">
                <User className="w-5 h-5" />
                <span>My Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AppLayoutV2({ children }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <V2Sidebar />

        <div className="flex-1 flex flex-col">
          {/* Mobile header */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
            <SidebarTrigger>
              <Menu className="h-6 w-6" />
            </SidebarTrigger>
            <img
              src="/logo.png"
              alt="Perdia Education Logo"
              className="h-10 w-auto"
            />
            <Badge variant="secondary" className="ml-auto text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              V2
            </Badge>
          </header>

          {/* Desktop stats bar */}
          <div className="hidden md:flex items-center justify-between h-14 px-6 border-b bg-background">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Perdia V2</h2>
              <Badge variant="outline" className="text-xs">
                Simplified Workflow
              </Badge>
            </div>
            <V2StatsBar />
          </div>

          {/* Main content */}
          <main className="flex-1 bg-slate-50">
            <ErrorBoundary errorMessage="An error occurred while loading this page.">
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
