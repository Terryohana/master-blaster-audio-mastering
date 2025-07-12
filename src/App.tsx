import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { ProjectsPage } from "./components/ProjectsPage";
import { SubscriptionPage } from "./components/SubscriptionPage";
import { ProfilePage } from "./components/ProfilePage";
import { SplashScreen } from "./components/SplashScreen";
import { OnboardingFlow } from "./components/OnboardingFlow";
import LiveAudioProcessorDual from "./components/LiveAudioProcessorDual";
import { AdminPage } from "./components/AdminPage";

type Page = "dashboard" | "projects" | "subscription" | "profile" | "processor" | "admin";

// Session storage key
const SESSION_STORAGE_KEY = "masterblaster-session";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [processorParams, setProcessorParams] = useState({ projectName: "", projectId: null });

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
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("masterblaster-onboarding", "true");
    setShowOnboarding(false);
  };

  const navigateToProcessor = (params) => {
    setProcessorParams(params);
    setCurrentPage("processor");
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Authenticated>
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="flex-1">
          {currentPage === "dashboard" && <Dashboard setCurrentPage={setCurrentPage} navigateToProcessor={navigateToProcessor} />}
          {currentPage === "projects" && <ProjectsPage navigateToProcessor={navigateToProcessor} />}
          {currentPage === "subscription" && <SubscriptionPage />}
          {currentPage === "profile" && <ProfilePage />}
          {currentPage === "processor" && <LiveAudioProcessorDual projectName={processorParams.projectName} projectId={processorParams.projectId} />}
          {currentPage === "admin" && <AdminPage />}
        </main>
      </Authenticated>

      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Master Blaster</h1>
              <p className="text-gray-300">Professional Audio Mastering</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Toaster theme="dark" />
    </div>
  );
}

function Header({ currentPage, setCurrentPage }: { 
  currentPage: Page; 
  setCurrentPage: (page: Page) => void; 
}) {
  const user = useQuery(api.users.getCurrentUser);
  const createUserProfile = useMutation(api.users.createUserProfile);

  // Create profile if user exists but has no profile
  useEffect(() => {
    if (user && !user.profile) {
      createUserProfile();
    }
  }, [user, createUserProfile]);

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: "🎵" },
    { id: "projects" as const, label: "Projects", icon: "📁" },
    { id: "processor" as const, label: "Live EQ", icon: "🎛️" },
    { id: "subscription" as const, label: "Subscription", icon: "💎" },
    { id: "profile" as const, label: "Profile", icon: "👤" },
    { id: "admin" as const, label: "Admin", icon: "⚙️" },
  ];

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
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}