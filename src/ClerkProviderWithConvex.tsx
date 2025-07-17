import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ReactNode, useEffect } from "react";
import { ConvexReactClient } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAction, ConvexProvider } from "convex/react";

// Initialize Convex client with fallback URL
const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://famous-scorpion-680.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

// Clerk-Convex provider component
export function ClerkProviderWithConvex({ children }: { children: ReactNode }) {
  // Fallback for Clerk publishable key
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_c3VyZS10ZXJyYXBpbi0xNS5jbGVyay5hY2NvdW50cy5kZXYk";
  
  return (
    <ClerkProvider publishableKey={clerkKey}>
      <ConvexProvider client={convex}>
        <UserSynchronizer>{children}</UserSynchronizer>
      </ConvexProvider>
    </ClerkProvider>
  );
}

// Component to sync Clerk user data with Convex
function UserSynchronizer({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const syncUser = useAction(api.auth.syncUser);

  useEffect(() => {
    // Only sync when auth is loaded and user is signed in
    if (isLoaded && isSignedIn) {
      // Sync user data with Convex
      syncUser().catch(console.error);
    }
  }, [isLoaded, isSignedIn, syncUser]);

  return <>{children}</>;
}