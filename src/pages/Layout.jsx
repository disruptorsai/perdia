

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User as UserIcon, BrainCircuit, FileText, TrendingUp, Settings, BarChart3, CheckSquare, Zap, Globe } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("index"), 
    icon: BarChart3,
  },
  {
    title: "AI Content Engine",
    url: createPageUrl("AIAgents"),
    icon: BrainCircuit,
  },
  {
    title: "Keyword Manager",
    url: createPageUrl("KeywordManager"),
    icon: TrendingUp,
  },
  {
    title: "Content Library",
    url: createPageUrl("ContentLibrary"),
    icon: FileText,
  },
  {
    title: "Approval Queue",
    url: createPageUrl("ApprovalQueue"),
    icon: CheckSquare,
  },
  {
    title: "Automation Controls",
    url: createPageUrl("AutomationControls"),
    icon: Zap,
  },
  {
    title: "WordPress Connection",
    url: createPageUrl("WordPressConnection"),
    icon: Globe,
  },
  {
    title: "Performance Dashboard",
    url: createPageUrl("PerformanceDashboard"),
    icon: BarChart3,
  },
];

const profileItem = {
  title: "My Profile",
  url: createPageUrl("Profile"),
  icon: UserIcon,
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
      <SidebarProvider>
        <style jsx global>{`
          :root {
            --color-primary: #2563eb;
            --color-primary-dark: #1e40af;
            --color-success: #10b981;
            --color-warning: #f59e0b;
            --color-danger: #ef4444;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            font-weight: 400;
            line-height: 1.5;
            color: #0a0a0a;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background: #fafafa;
          }

          h1, h2, h3, h4, h5, h6 {
            font-weight: 600;
          }
        `}</style>
        <div className="min-h-screen flex w-full max-w-full overflow-hidden bg-slate-50">
          <Sidebar className="border-r border-slate-200 bg-white">
            <SidebarHeader className="border-b border-slate-200 p-6">
              <Link to={createPageUrl("index")} className="flex flex-col items-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">Perdia Education</div>
                <div className="text-xs font-semibold text-slate-600 tracking-wide">SEO AUTOMATION • EMMA™</div>
              </Link>
            </SidebarHeader>
            
            <SidebarContent className="p-4 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 py-2">
                    Navigation
                  </SidebarGroupLabel>
                  <SidebarGroupContent className="space-y-1">
                    <SidebarMenu>
                      {navigationItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            className={`group relative rounded-lg mb-1 transition-all duration-200 ${
                              location.pathname === item.url 
                                ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-inset ring-blue-200' 
                                : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-4 py-3 relative">
                              {location.pathname === item.url && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"></div>
                              )}
                              <item.icon className={`w-5 h-5 transition-colors relative z-10 ${
                                location.pathname === item.url ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'
                              }`} />
                              <span className="font-medium relative z-10">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </div>

              <div className="mt-auto">
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                </div>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={`group relative rounded-lg mb-1 transition-all duration-200 ${
                        location.pathname === profileItem.url 
                          ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-inset ring-blue-200' 
                          : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <Link to={profileItem.url} className="flex items-center gap-3 px-4 py-3 relative">
                        {location.pathname === profileItem.url && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"></div>
                        )}
                        <profileItem.icon className={`w-5 h-5 transition-colors ${
                          location.pathname === profileItem.url ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'
                        }`} />
                        <span className="font-medium">{profileItem.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 bg-slate-50 overflow-hidden min-w-0">
            <header className="bg-white border-b border-slate-200 px-4 py-4 md:hidden sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors flex-shrink-0" />
                <h1 className="text-xl font-bold text-blue-600 truncate">Perdia Education</h1>
              </div>
            </header>

            <div className="flex-1 overflow-auto w-full h-full">
              <div className="w-full max-w-full h-full">
                {children}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
  );
}

