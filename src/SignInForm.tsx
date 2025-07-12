"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="w-full px-4 py-3 rounded-lg bg-black/30 border border-gray-700 text-white placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none transition-all"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="w-full px-4 py-3 rounded-lg bg-black/30 border border-gray-700 text-white placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none transition-all"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button 
          className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit" 
          disabled={submitting}
        >
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-center text-sm text-gray-400">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-blue-400 hover:text-blue-300 hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-700" />
        <span className="mx-4 text-gray-400">or</span>
        <hr className="my-4 grow border-gray-700" />
      </div>
      <button 
        className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl"
        onClick={() => void signIn("anonymous")}
      >
        Sign in anonymously
      </button>
    </div>
  );
}