import { useState, useEffect } from "react";
import { MessageCircle, Languages, Menu as MenuIcon } from "lucide-react";
import { Button } from "@headlessui/react";
import { ChatPage } from "./pages/ChatPage";
import { TranslatePage } from "./pages/TranslatePage";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import { NavigationProvider, useNavigation } from "./contexts/NavigationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";

type Page = "chat" | "translate";

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("chat");
  const { showSidebar, setShowSidebar, toggleSidebar, sidebarContent } = useSidebar();
  const { leftActions, rightActions } = useNavigation();
  const [isClosing, setIsClosing] = useState(false);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      // Auto-close sidebar on mobile screens
      if (window.innerWidth < 768 && showSidebar) {
        setShowSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showSidebar, setShowSidebar]);

  // Handle mobile sidebar close animation
  const handleMobileSidebarClose = () => {
    if (window.innerWidth < 768) {
      setIsClosing(true);
      // Wait for animation to complete before actually closing
      setTimeout(() => {
        setShowSidebar(false);
        setIsClosing(false);
      }, 300); // Match the animation duration
    } else {
      setShowSidebar(false);
    }
  };

  const pages: { key: Page; label: string; icon: React.ReactNode }[] = [
    { key: "chat", label: "Chat", icon: <MessageCircle size={20} /> },
    { key: "translate", label: "Translate", icon: <Languages size={20} /> },
  ];

  return (
    <div className="h-dvh w-dvw flex overflow-hidden relative">
      {/* Mobile backdrop overlay */}
      {sidebarContent && (showSidebar || isClosing) && (
        <div 
          className={`fixed inset-0 bg-black/50 z-40 md:hidden ${
            isClosing ? 'mobile-backdrop-exit' : 'mobile-backdrop-enter'
          }`}
          onClick={handleMobileSidebarClose}
        />
      )}

      {/* Fixed hamburger button for mobile - only visible when sidebar is closed */}
      {sidebarContent && !showSidebar && (
        <div className="fixed top-0 left-0 z-30 md:hidden pt-safe-top pl-safe-left p-3">
          <Button
            className="menu-button"
            onClick={() => {
              // Provide haptic feedback on supported devices
              if ('vibrate' in navigator) {
                navigator.vibrate(50);
              }
              setShowSidebar(true);
            }}
            aria-label="Open sidebar"
          >
            <MenuIcon size={20} />
          </Button>
        </div>
      )}

      {/* Generic sidebar that can be controlled by any page */}
      {sidebarContent && (
        <aside
          className={`
            h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700
            ${showSidebar ? "w-64" : "w-0"} 
            md:flex-shrink-0 md:relative
            fixed left-0 top-0 z-50 md:z-auto
            ${(showSidebar || isClosing) ? "block" : "hidden md:block"}
            ${showSidebar && !isClosing ? "mobile-sidebar-enter" : ""}
            ${isClosing ? "mobile-sidebar-exit" : ""}
            md:transition-all md:duration-300 md:ease-in-out overflow-hidden
          `}
        >
          {sidebarContent}
        </aside>
      )}

      {/* Main app content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <nav className="px-3 py-2 pl-safe-left pr-safe-right pt-safe-top bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200/60 dark:border-neutral-700/60 flex-shrink-0 nav-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 w-1/3">
              {sidebarContent && (
                <Button
                  className={`menu-button hidden md:flex ${showSidebar ? 'sidebar-open' : ''}`}
                  onClick={toggleSidebar}
                  aria-label={showSidebar ? 'Close sidebar' : 'Open sidebar'}
                >
                  <MenuIcon size={20} />
                </Button>
              )}
              {leftActions}
            </div>
            
            <div className="flex space-x-1 sm:space-x-2">
              {pages.map(({ key, label, icon }) => (
                <Button
                  key={key}
                  onClick={() => setCurrentPage(key)}
                  className={`px-2 py-2 sm:px-4 font-medium rounded transition-colors flex items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                    currentPage === key
                      ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200"
                      : "bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 w-1/3 justify-end">
              <ThemeToggle />
              {rightActions}
            </div>
          </div>
        </nav>
        
        <div className="flex-1 overflow-hidden">
          {currentPage === "chat" && <ChatPage />}
          {currentPage === "translate" && <TranslatePage />}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <NavigationProvider>
          <AppContent />
        </NavigationProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
