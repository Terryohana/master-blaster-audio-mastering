import { useEffect, useState } from "react";
import App from "./App";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import { useAuth } from "@clerk/clerk-react";

export default function Router() {
  const { isSignedIn, isLoaded } = useAuth();
  const [path, setPath] = useState(window.location.pathname);
  
  // Listen for path changes
  useEffect(() => {
    const handlePathChange = () => {
      setPath(window.location.pathname);
    };
    
    window.addEventListener("popstate", handlePathChange);
    
    return () => {
      window.removeEventListener("popstate", handlePathChange);
    };
  }, []);
  
  // Show loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Route to the appropriate page
  if (path === "/sign-in") {
    return <SignInPage />;
  }
  
  if (path === "/sign-up") {
    return <SignUpPage />;
  }
  
  // If signed in, show the app, otherwise redirect to sign-in
  if (isSignedIn) {
    return <App />;
  } else {
    window.history.pushState({}, "", "/sign-in");
    return <SignInPage />;
  }
}