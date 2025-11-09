import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BrainCircuit,
  TrendingUp,
  FileText,
  CheckSquare,
  Zap,
  Globe,
  User,
  Menu,
  BookOpen
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
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
    icon: BarChart3,
  },
  {
    title: 'AI Content Engine',
    url: '/ai-agents',
    icon: BrainCircuit,
  },
  {
    title: 'Keyword Manager',
    url: '/keywords',
    icon: TrendingUp,
  },
  {
    title: 'Content Library',
    url: '/content',
    icon: FileText,
  },
  {
    title: 'Approval Queue',
    url: '/approvals',
    icon: CheckSquare,
  },
  {
    title: 'Blog Library',
    url: '/blog',
    icon: BookOpen,
  },
  {
    title: 'Automation Controls',
    url: '/automation',
    icon: Zap,
  },
  {
    title: 'WordPress Connection',
    url: '/wordpress',
    icon: Globe,
  },
  {
    title: 'Performance Dashboard',
    url: '/performance',
    icon: BarChart3,
  },
];

function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-12">
        <div className="flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Perdia Education Logo"
            className="h-80 w-auto"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;

                // Handle "Coming Soon" items
                if (item.comingSoon) {
                  return (
                    <SidebarMenuItem key={item.url}>
                      <div className="flex items-center justify-between px-3 py-2 cursor-not-allowed opacity-50">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-muted-foreground" />
                          <span className="text-muted-foreground">{item.title}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                    </SidebarMenuItem>
                  );
                }

                // Regular navigation items
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="transition-all duration-200"
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
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
          {/* Mobile header */}
          <header className="sticky top-0 z-30 flex h-32 items-center gap-4 border-b bg-background px-4 md:hidden">
            <SidebarTrigger>
              <Menu className="h-6 w-6" />
            </SidebarTrigger>
            <img
              src="/logo.png"
              alt="Perdia Education Logo"
              className="h-28 w-auto"
            />
            <div className="ml-auto">
              <HelpMenu />
            </div>
          </header>

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
