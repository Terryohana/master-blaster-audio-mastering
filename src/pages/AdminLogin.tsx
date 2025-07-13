import { useState } from "react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState("methodman@mail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simple direct login check
      if (email === "methodman@mail.com" && password === "12345678") {
        toast.success("Admin login successful");
        
        // Store admin session in localStorage
        localStorage.setItem("adminSession", JSON.stringify({
          isAdmin: true,
          email,
          timestamp: Date.now()
        }));
        
        // Redirect to main page
        window.location.href = "/";
      } else {
        toast.error("Invalid email or password");
      }
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-gray-300">Master Blaster Audio Mastering</p>
        </div>
        
        <form 
          className="bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700"
          onSubmit={handleLogin}
        >
          <div className="mb-6">
            <label className="block text-gray-300 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-gray-700 text-white"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-gray-700 text-white"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}