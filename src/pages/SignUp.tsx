import { SignUp } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Master Blaster</h1>
          <p className="text-gray-300">Professional Audio Mastering</p>
        </div>
        
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
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}