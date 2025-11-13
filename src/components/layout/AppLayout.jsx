import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  ListChecks,
  Tag,
  Settings,
  Plug,
  Sparkles,
  TrendingUp,
  Microscope,
  Brain,
  LayoutDashboard,
  User
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
  SidebarHeader,
  SidebarFooter,
  Badge
} from '@/components/ui';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import HelpMenu from '@/components/onboarding/HelpMenu';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Content Library',
    url: '/content',
    icon: FileText,
  },
  {
    title: 'Review Queue',
    url: '/approvals',
    icon: ListChecks,
  },
  {
    title: 'Keywords & Clusters',
    url: '/keywords',
    icon: Tag,
  },
  {
    title: 'Analytics',
    url: '/performance',
    icon: BarChart3,
  },
  {
    title: 'AI Training',
    url: '/ai-training',
    icon: Brain,
  },
  {
    title: 'Integrations',
    url: '/wordpress',
    icon: Plug,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
];

const aiTools = [
  {
    title: 'Generate Article',
    url: '/ai-agents',
    icon: Sparkles,
    featured: true
  },
  {
    title: 'Topic Discovery',
    url: '/topic-discovery',
    icon: TrendingUp,
  },
  {
    title: 'Site Analysis',
    url: '/site-analysis',
    icon: Microscope,
  },
];

function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 pb-6 pt-0">
        <div className="flex items-center justify-center w-full">
          <img
            src="/logo.png"
            alt="Perdia Education Logo"
            className="w-full h-auto object-contain"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        transition-all duration-200 rounded-lg mb-1
                        ${isActive
                          ? 'bg-blue-50 text-blue-700 font-medium shadow-sm border-l-4 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-700'
                        }
                      `}
                    >
                      <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-semibold text-emerald-600 uppercase tracking-wider px-3 mb-2">
            AI Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiTools.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        transition-all duration-200 rounded-lg mb-1
                        ${isActive
                          ? 'bg-emerald-50 text-emerald-700 font-medium shadow-sm border-l-4 border-emerald-600'
                          : 'text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                        }
                        ${item.featured ? 'border-2 border-emerald-200' : ''}
                      `}
                    >
                      <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm">{item.title}</span>
                        {item.featured && (
                          <span className="ml-auto text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-medium">
                            New
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

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
        </SidebarMenu>
        <div className="px-3 py-2">
          <HelpMenu />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AppLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
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
