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
  Menu
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
  SidebarFooter
} from '@/components/ui';

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
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-primary">Perdia Education</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
            SEO AUTOMATION • EMMA™
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
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
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
            <SidebarTrigger>
              <Menu className="h-6 w-6" />
            </SidebarTrigger>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-primary">Perdia Education</h1>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
