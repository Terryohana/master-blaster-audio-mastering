import { useState, useEffect } from "react";

export function AdminReturnBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  
  useEffect(() => {
    // Check if there's a backup admin session
    const adminSessionBackup = localStorage.getItem("adminSessionBackup");
    if (adminSessionBackup) {
      try {
        const session = JSON.parse(adminSessionBackup);
        if (session.email) {
          setAdminEmail(session.email);
          setShowBanner(true);
        }
      } catch (error) {
        console.error("Failed to parse admin session backup:", error);
      }
    }
  }, []);
  
  const handleReturnToAdmin = () => {
    // Restore admin session
    const adminSessionBackup = localStorage.getItem("adminSessionBackup");
    if (adminSessionBackup) {
      localStorage.setItem("adminSession", adminSessionBackup);
      localStorage.removeItem("adminSessionBackup");
      localStorage.removeItem("userSession");
      
      // Reload page
      window.location.reload();
    }
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-purple-900 text-white p-3 flex justify-between items-center z-50">
      <div className="flex items-center">
        <span className="mr-2">⚠️</span>
        <span>You are viewing as a user. Admin account: {adminEmail}</span>
      </div>
      <button
        onClick={handleReturnToAdmin}
        className="px-4 py-1 bg-purple-700 rounded hover:bg-purple-600 transition-colors"
      >
        Return to Admin
      </button>
    </div>
  );
}