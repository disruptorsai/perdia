import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles
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
      <SidebarHeader className="border-b px-6 py-4 bg-gradient-to-br from-white to-gray-50">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                rotate: [0, 10, 0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-5 h-5 text-blue-600" />
            </motion.div>
            <h1 className="text-2xl font-bold text-primary">Perdia Education</h1>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
            SEO AUTOMATION • EMMA™
          </p>
        </motion.div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item, index) => {
                const isActive = location.pathname === item.url;
                return (
                  <motion.div
                    key={item.url}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="transition-smooth hover-lift"
                      >
                        <Link to={item.url} className="flex items-center gap-3 relative">
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                          )}
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <item.icon className="w-5 h-5" />
                          </motion.div>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-gradient-to-br from-gray-50 to-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="transition-smooth hover-lift">
              <Link to="/profile" className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white"
                >
                  <User className="w-4 h-4" />
                </motion.div>
                <div>
                  <p className="font-medium">My Profile</p>
                  <p className="text-xs text-muted-foreground">Settings & Account</p>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3
    }
  }
};

export default function AppLayout({ children }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          {/* Mobile header with glassmorphism */}
          <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-lg px-4 md:hidden shadow-sm"
          >
            <SidebarTrigger>
              <motion.div
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="h-6 w-6" />
              </motion.div>
            </SidebarTrigger>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{
                  rotate: [0, 10, 0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="w-5 h-5 text-blue-600" />
              </motion.div>
              <h1 className="text-lg font-bold text-primary">Perdia Education</h1>
            </div>
          </motion.header>

          {/* Main content with page transitions */}
          <main className="flex-1 bg-slate-50 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
