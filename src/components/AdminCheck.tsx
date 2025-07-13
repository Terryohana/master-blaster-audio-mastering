import { useEffect, useState } from "react";

interface AdminCheckProps {
  children: React.ReactNode;
}

export function AdminCheck({ children }: AdminCheckProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if admin session exists
    const adminSession = localStorage.getItem("adminSession");
    
    if (!adminSession) {
      window.location.href = "/admin-login";
      return;
    }
    
    try {
      const session = JSON.parse(adminSession);
      
      // Check if session is valid and not expired (24 hours)
      const isValid = session.isAdmin && 
        session.email === "methodman@mail.com" &&
        session.timestamp && 
        (Date.now() - session.timestamp < 24 * 60 * 60 * 1000);
      
      if (!isValid) {
        localStorage.removeItem("adminSession");
        window.location.href = "/admin-login";
        return;
      }
      
      setIsAdmin(true);
      setLoading(false);
    } catch (error) {
      localStorage.removeItem("adminSession");
      window.location.href = "/admin-login";
    }
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return null;
  }
  
  return <>{children}</>;
}