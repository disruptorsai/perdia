
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FileText, 
  LayoutDashboard, 
  ListChecks, 
  Tag, 
  Settings, 
  BarChart3,
  Plug,
  Zap,
  Microscope,
  Sparkles,
  TrendingUp,
  Brain
} from "lucide-react";
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
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Content Library",
    url: createPageUrl("ContentLibrary"),
    icon: FileText,
  },
  {
    title: "Review Queue",
    url: createPageUrl("ReviewQueue"),
    icon: ListChecks,
  },
  {
    title: "Keywords & Clusters",
    url: createPageUrl("KeywordsAndClusters"),
    icon: Tag,
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: BarChart3,
  },
  {
    title: "AI Training",
    url: createPageUrl("AITraining"),
    icon: Brain,
  },
  {
    title: "Integrations",
    url: createPageUrl("Integrations"),
    icon: Plug,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

const aiTools = [
  {
    title: "Generate Article",
    url: createPageUrl("ArticleWizard"),
    icon: Sparkles,
    featured: true
  },
  {
    title: "Topic Discovery",
    url: createPageUrl("TopicDiscovery"),
    icon: TrendingUp,
  },
  {
    title: "Site Analysis",
    url: createPageUrl("SiteAnalysis"),
    icon: Microscope,
  },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200 bg-white">
          <SidebarHeader className="border-b border-gray-100 px-6 py-5 bg-gradient-to-r from-blue-700 to-blue-600">
            <div className="flex items-center gap-3">
              {/* GetEducated Owl Logo */}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-blue-700" fill="currentColor">
                  <path d="M12 2C10.5 2 9.2 2.4 8.1 3.1L6 5.2C5.4 5.8 5 6.6 5 7.5V10C5 10.6 5.2 11.1 5.5 11.5C5.2 12.2 5 13 5 13.8V17C5 19.2 6.8 21 9 21H15C17.2 21 19 19.2 19 17V13.8C19 13 18.8 12.2 18.5 11.5C18.8 11.1 19 10.6 19 10V7.5C19 6.6 18.6 5.8 18 5.2L15.9 3.1C14.8 2.4 13.5 2 12 2M9 6C9.6 6 10 6.4 10 7C10 7.6 9.6 8 9 8C8.4 8 8 7.6 8 7C8 6.4 8.4 6 9 6M15 6C15.6 6 16 6.4 16 7C16 7.6 15.6 8 15 8C14.4 8 14 7.6 14 7C14 6.4 14.4 6 15 6M12 9C13.1 9 14 9.9 14 11C14 12.1 13.1 13 12 13C10.9 13 10 12.1 10 11C10 9.9 10.9 9 12 9Z"/>
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-white text-lg tracking-tight">GetEducated</h2>
                <p className="text-xs text-emerald-400 font-medium">Content Engine</p>
              </div>
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
                      <SidebarMenuItem key={item.title}>
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
                      <SidebarMenuItem key={item.title}>
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
        </Sidebar>

        <main className="flex-1 flex flex-col bg-gray-50">
          {/* GetEducated Top Banner */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-3 shadow-md">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-400" fill="currentColor">
                  <path d="M12 2C10.5 2 9.2 2.4 8.1 3.1L6 5.2C5.4 5.8 5 6.6 5 7.5V10C5 10.6 5.2 11.1 5.5 11.5C5.2 12.2 5 13 5 13.8V17C5 19.2 6.8 21 9 21H15C17.2 21 19 19.2 19 17V13.8C19 13 18.8 12.2 18.5 11.5C18.8 11.1 19 10.6 19 10V7.5C19 6.6 18.6 5.8 18 5.2L15.9 3.1C14.8 2.4 13.5 2 12 2M9 6C9.6 6 10 6.4 10 7C10 7.6 9.6 8 9 8C8.4 8 8 7.6 8 7C8 6.4 8.4 6 9 6M15 6C15.6 6 16 6.4 16 7C16 7.6 15.6 8 15 8C14.4 8 14 7.6 14 7C14 6.4 14.4 6 15 6M12 9C13.1 9 14 9.9 14 11C14 12.1 13.1 13 12 13C10.9 13 10 12.1 10 11C10 9.9 10.9 9 12 9Z"/>
                </svg>
                <p className="text-sm font-medium">
                  The independent, trusted guide to online education for over 27 years!
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-400">Content Engine</span>
              </div>
            </div>
          </div>

          <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors" />
              <h1 className="text-lg font-bold text-blue-700">GetEducated</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
