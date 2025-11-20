
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const createPageUrl = (pageName) => `/${pageName}`;
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  LayoutDashboard, 
  ListChecks, 
  Tag, 
  Settings, 
  BarChart3,
  Plug,
  Sparkles,
  TrendingUp,
  Brain,
  CheckCircle2,
  Search,
  User,
  LogOut
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AutomationEngine from "@/components/automation/AutomationEngine";

const navigationGroups = [
  {
    label: "Workspace",
    items: [
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
        title: "Analytics",
        url: createPageUrl("Analytics"),
        icon: BarChart3,
      },
    ]
  },
  {
    label: "Content Tools",
    items: [
      {
        title: "Keywords & Clusters",
        url: createPageUrl("KeywordsAndClusters"),
        icon: Tag,
      },
      {
        title: "Site Catalog",
        url: createPageUrl("SiteCatalog"),
        icon: ListChecks,
      },
      {
        title: "Site Analysis",
        url: createPageUrl("SiteAnalysis"),
        icon: Search,
      },
    ]
  },
  {
    label: "Configuration",
    items: [
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
    ]
  }
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Get current page title from path
  const getCurrentPageTitle = () => {
    const path = location.pathname.split('/').pop();
    for (const group of navigationGroups) {
      const item = group.items.find(item => item.url.includes(path));
      if (item) return item.title;
    }
    return 'Dashboard';
  };

  const currentPageTitle = getCurrentPageTitle();
  
  const getCurrentIcon = () => {
    const path = location.pathname.split('/').pop();
    for (const group of navigationGroups) {
      const item = group.items.find(item => item.url.includes(path));
      if (item) return item.icon;
    }
    return LayoutDashboard;
  };
  
  const PageIcon = getCurrentIcon();

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const getInitials = () => {
    if (!user) return 'U';
    const names = user.full_name?.split(' ') || [];
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <>
      <AutomationEngine />
      <div className="min-h-screen flex flex-col w-full bg-gray-25">
        {/* Top Header Bar - Minimal */}
        <div className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Perdia</h1>
            <div className="h-6 w-px bg-gray-300"></div>
            <span className="text-sm text-gray-600">{currentPageTitle}</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrator' : 'User'}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{getInitials()}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{user?.full_name || 'User'}</span>
                  <span className="text-xs text-gray-500 font-normal">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(createPageUrl('Profile'))}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Content Area - Sidebar and Content */}
        <div className="flex flex-1 overflow-hidden">
          <SidebarProvider defaultOpen={true}>
            <Sidebar collapsible="icon" className="border-r border-gray-200 bg-white">
              <SidebarContent className="px-2 py-4">
                <div className="px-2 mb-6 flex items-center justify-between">
                  <SidebarTrigger />
                </div>
                
                {navigationGroups.map((group, groupIndex) => (
                  <SidebarGroup key={groupIndex} className="mb-4">
                    <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                      {group.label}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => {
                          const isActive = location.pathname === item.url;
                          return (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton 
                                asChild 
                                className={`
                                  transition-all duration-200 rounded-lg mb-1
                                  ${isActive 
                                    ? 'bg-blue-600 text-white font-medium shadow-sm hover:bg-blue-700' 
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
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
                ))}
              </SidebarContent>
            </Sidebar>

            <main className="flex-1 overflow-auto bg-gray-50">
              {children}
            </main>
          </SidebarProvider>
        </div>
      </div>
    </>
  );
}
