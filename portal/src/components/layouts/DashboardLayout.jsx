//src/components/layouts/DashboardLayout.jsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UserCog,
  LogOut,
  Shield,
  X,
  ChevronRight,
  ChevronLeft,
  Flame,
  FileText,
  Building,
} from "lucide-react";
import Header from "./Header";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Navigation items for fire emergency system
  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/",
      description: "Overview of emergencies and staff",
    },
    {
      title: "Staff Management",
      icon: UserCog,
      href: "/admin/users",
      description: "Manage staff members and responders",
    },
    {
      title: "Clients",
      icon: Building,
      href: "/admin/clients",
      description: "Client buildings and locations",
    },
    {
      title: "Emergencies",
      icon: Flame,
      href: "/admin/emergencies/",
      description: "View and manage ongoing emergencies",
    },
    
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 lg:hidden z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 bg-card border-r transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-20",
          "lg:transform-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn(
          "flex h-16 items-center px-4 border-b",
          isSidebarOpen ? "justify-between" : "justify-center"
        )}>
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Fire Emergency</h1>
            </div>
          )}
          {!isSidebarOpen && (
            <Shield className="h-8 w-8 text-primary" />
          )}
          <button
            onClick={() => {
              if (windowWidth >= 1024) {
                setIsSidebarOpen(!isSidebarOpen);
              } else {
                setIsMobileMenuOpen(false);
              }
            }}
            className="p-1 rounded-full hover:bg-muted transition-colors hidden lg:flex"
          >
            {isSidebarOpen ? 
              <ChevronLeft className="h-5 w-5 text-foreground" /> : 
              <ChevronRight className="h-5 w-5 text-foreground" />
            }
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1 hover:bg-muted rounded"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="py-4 flex flex-col h-[calc(100%-4rem)] justify-between">
          <TooltipProvider delayDuration={isSidebarOpen ? 700 : 0}>
            <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.comingSoon ? "#" : item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                        onClick={(e) => {
                          if (item.comingSoon) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <item.icon className={cn(
                          "flex-shrink-0",
                          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground",
                          isSidebarOpen ? "h-5 w-5" : "h-6 w-6"
                        )} />
                        {isSidebarOpen && (
                          <span className="truncate">{item.title}</span>
                        )}
                        {isSidebarOpen && item.comingSoon && (
                          <span className="absolute right-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            Soon
                          </span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {(!isSidebarOpen || item.comingSoon) && (
                      <TooltipContent side="right" className="max-w-xs">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                          {item.comingSoon && (
                            <p className="text-xs mt-1 font-medium text-yellow-600">Coming Soon</p>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </TooltipProvider>

          <div className="px-3 mt-auto">
            <TooltipProvider delayDuration={isSidebarOpen ? 700 : 0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center gap-3 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive",
                      !isSidebarOpen && "justify-center px-0"
                    )}
                    onClick={() => logout()}
                  >
                    <LogOut className="h-5 w-5" />
                    {isSidebarOpen && <span>Logout</span>}
                  </Button>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    <p className="font-medium">Logout</p>
                    <p className="text-xs text-muted-foreground">Sign out of your account</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            {isSidebarOpen && (
              <div className="mt-4 p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Fire Emergency Response</p>
                <p>Version 1.0.0</p>
                <p className="mt-1">© 2023 Fire Response Systems</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isSidebarOpen ? "lg:pl-64" : "lg:pl-20"
      )}>
        <Header 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          isSidebarCollapsed={!isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};