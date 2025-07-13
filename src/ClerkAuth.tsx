import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Simplified Clerk provider component
export function ClerkAuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider 
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}
      appearance={{
        baseTheme: dark,
        elements: {
          card: "bg-gray-900 border border-gray-800",
          headerTitle: "text-white",
          headerSubtitle: "text-gray-400",
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
          formFieldInput: "bg-black/30 border border-gray-700 text-white",
        }
      }}
    >
      <ConvexProvider client={convex}>
        {children}
      </ConvexProvider>
    </ClerkProvider>
  );
}

// Simple authentication components
export function SignInButton() {
  return (
    <a 
      href="/sign-in"
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Sign In
    </a>
  );
}

export function SignUpButton() {
  return (
    <a 
      href="/sign-up"
      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
    >
      Sign Up
    </a>
  );
}

// Simple auth guard component
export function AuthGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}