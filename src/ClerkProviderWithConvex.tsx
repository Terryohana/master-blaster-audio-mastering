import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ReactNode, useEffect } from "react";
import { ConvexReactClient } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAction, ConvexProvider } from "convex/react";

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// Clerk-Convex provider component
export function ClerkProviderWithConvex({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
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