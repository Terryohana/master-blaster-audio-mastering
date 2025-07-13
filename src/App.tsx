import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { SimpleDashboard } from "./components/SimpleDashboard";
import { ProjectsPage } from "./components/ProjectsPage";
import { SubscriptionPage } from "./components/SubscriptionPage";
import { ProfilePage } from "./components/ProfilePage";
import { SplashScreen } from "./components/SplashScreen";
import { OnboardingFlow } from "./components/OnboardingFlow";
import LiveAudioProcessorDual from "./components/LiveAudioProcessorDual";
import { AdminPage } from "./components/AdminPage";
import { AuthGuard } from "./ClerkAuth";
import { useAuth } from "@clerk/clerk-react";
import { AdminReturnBanner } from "./components/AdminReturnBanner";
import { isAdmin } from "./utils/authHelpers";

type Page = "dashboard" | "projects" | "subscription" | "profile" | "processor" | "admin";

// Session storage key
const SESSION_STORAGE_KEY = "masterblaster-session";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [processorParams, setProcessorParams] = useState({ projectName: "", projectId: null });
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useAuth();
  
  // Error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Caught error:", event.error);
      setError("An error occurred. Please try again later.");
      event.preventDefault();
    };
    
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  // Load session data on initial render
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        if (sessionData.page) {
          setCurrentPage(sessionData.page);
        }
        if (sessionData.processorParams) {
          setProcessorParams(sessionData.processorParams);
        }
      } catch (error) {
        console.error("Failed to parse session data:", error);
      }
    }
  }, []);

  // Save session data when page or processor params change
  useEffect(() => {
    const sessionData = {
      page: currentPage,
      processorParams
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  }, [currentPage, processorParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Check if user has seen onboarding
      const hasSeenOnboarding = localStorage.getItem("masterblaster-onboarding");
      if (!hasSeenOnboarding && isSignedIn) {
        setShowOnboarding(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSignedIn]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("masterblaster-onboarding", "true");
    setShowOnboarding(false);
  };

  const navigateToProcessor = (params) => {
    setProcessorParams(params);
    setCurrentPage("processor");
  };

  // Show error message if there's an error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-300">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  if (showSplash) {
    return <SplashScreen />;
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <AuthGuard>
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="flex-1">
          {currentPage === "dashboard" && <Dashboard setCurrentPage={setCurrentPage} navigateToProcessor={navigateToProcessor} />}
          {currentPage === "projects" && <ProjectsPage navigateToProcessor={navigateToProcessor} />}
          {currentPage === "subscription" && <SubscriptionPage />}
          {currentPage === "profile" && <ProfilePage />}
          {currentPage === "processor" && <LiveAudioProcessorDual projectName={processorParams.projectName} projectId={processorParams.projectId} />}
          {currentPage === "admin" && isAdmin && <AdminPage />}
        </main>
      </AuthGuard>

      <Toaster theme="dark" />
      <AdminReturnBanner />
    </div>
  );
}

function Header({ currentPage, setCurrentPage }: { 
  currentPage: Page; 
  setCurrentPage: (page: Page) => void; 
}) {
  const user = useQuery(api.users.getCurrentUser);
  // Check if user is admin from localStorage
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const adminSession = localStorage.getItem("adminSession");
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        if (session.isAdmin && session.email === "methodman@mail.com") {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Failed to parse admin session:", error);
      }
    }
  }, []);

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: "🎵" },
    { id: "projects" as const, label: "Projects", icon: "📁" },
    { id: "processor" as const, label: "Live EQ", icon: "🎛️" },
    { id: "subscription" as const, label: "Subscription", icon: "💎" },
    { id: "profile" as const, label: "Profile", icon: "👤" },
  ];
  
  // Only show admin page to users with admin role
  const adminSession = localStorage.getItem("adminSession");
  if (adminSession) {
    try {
      const session = JSON.parse(adminSession);
      if (session.isAdmin && session.email === "methodman@mail.com") {
        navItems.push({ id: "admin" as const, label: "Admin", icon: "⚙️" });
      }
    } catch (error) {
      console.error("Failed to parse admin session:", error);
    }
  }

  return (
    <header className="bg-black/30 backdrop-blur-sm border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-white">Master Blaster</h1>
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-300 hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem("adminSession");
                window.location.href = "/sign-in";
              }}
              className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-sm hover:shadow"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}