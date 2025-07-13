import { useAuth, useUser, SignIn, SignUp, UserButton } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

// Sign In component with multiple auth options
export function SignInComponent() {
  return (
    <div className="w-full max-w-md mx-auto">
      <SignIn
        appearance={{
          baseTheme: dark,
          elements: {
            rootBox: "w-full",
            card: "bg-gray-900 border border-gray-800 shadow-xl",
            headerTitle: "text-white text-2xl font-bold",
            headerSubtitle: "text-gray-400",
            formButtonPrimary: 
              "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl",
            formFieldInput: 
              "bg-black/30 border border-gray-700 text-white rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500",
            footerAction: "text-gray-400",
            footerActionLink: "text-blue-400 hover:text-blue-300",
          },
        }}
        signUpUrl="/sign-up"
        routing="path"
        path="/sign-in"
      />
    </div>
  );
}

// Sign Up component
export function SignUpComponent() {
  return (
    <div className="w-full max-w-md mx-auto">
      <SignUp
        appearance={{
          baseTheme: dark,
          elements: {
            rootBox: "w-full",
            card: "bg-gray-900 border border-gray-800 shadow-xl",
            headerTitle: "text-white text-2xl font-bold",
            headerSubtitle: "text-gray-400",
            formButtonPrimary: 
              "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl",
            formFieldInput: 
              "bg-black/30 border border-gray-700 text-white rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500",
            footerAction: "text-gray-400",
            footerActionLink: "text-blue-400 hover:text-blue-300",
          },
        }}
        signInUrl="/sign-in"
        routing="path"
        path="/sign-up"
      />
    </div>
  );
}

// User profile button
export function UserProfileButton() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  
  if (!isSignedIn || !user) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-300 hidden sm:block">
        {user.primaryEmailAddress?.emailAddress}
      </span>
      <UserButton
        appearance={{
          baseTheme: dark,
          elements: {
            userButtonBox: "hover:scale-105 transition-transform",
            userButtonTrigger: "border border-gray-700 hover:border-gray-600",
          },
        }}
        afterSignOutUrl="/"
      />
    </div>
  );
}

// Auth guard component
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isSignedIn) {
    return <SignInComponent />;
  }
  
  return <>{children}</>;
}