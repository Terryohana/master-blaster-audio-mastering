// Check if the current user is an admin
export function isAdmin(): boolean {
  try {
    const adminSession = localStorage.getItem("adminSession");
    if (adminSession) {
      const session = JSON.parse(adminSession);
      return session.isAdmin && session.email === "methodman@mail.com";
    }
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Check if the current user is an admin impersonating another user
export function isImpersonating(): boolean {
  return localStorage.getItem("adminSessionBackup") !== null;
}

// Get the current user session (either real user or impersonated)
export function getCurrentUserSession() {
  try {
    // Check for impersonated user first
    const userSession = localStorage.getItem("userSession");
    if (userSession) {
      return JSON.parse(userSession);
    }
    
    // Otherwise check for admin
    const adminSession = localStorage.getItem("adminSession");
    if (adminSession) {
      return JSON.parse(adminSession);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user session:", error);
    return null;
  }
}

// End impersonation and return to admin
export function endImpersonation(): void {
  const adminSessionBackup = localStorage.getItem("adminSessionBackup");
  if (adminSessionBackup) {
    localStorage.setItem("adminSession", adminSessionBackup);
    localStorage.removeItem("adminSessionBackup");
    localStorage.removeItem("userSession");
    window.location.reload();
  }
}