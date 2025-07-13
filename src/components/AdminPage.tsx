import { useState } from "react";
import { AdminCheck } from "./AdminCheck";
import { UserManagement } from "./UserManagement";

// Mock data for demonstration
const mockUsers = [
  {
    _id: "1",
    email: "methodman@mail.com",
    name: "Admin User",
    profile: { role: "admin", subscriptionTier: "unlimited" },
    projectsCount: 5,
    storageUsed: 250 * 1024 * 1024 // 250MB
  },
  {
    _id: "2",
    email: "user@example.com",
    name: "Regular User",
    profile: { role: "user", subscriptionTier: "free" },
    projectsCount: 1,
    storageUsed: 40 * 1024 * 1024 // 40MB
  },
  {
    _id: "3",
    email: "pro@example.com",
    name: "Pro User",
    profile: { role: "user", subscriptionTier: "pro" },
    projectsCount: 12,
    storageUsed: 480 * 1024 * 1024 // 480MB
  }
];

const mockStats = {
  totalUsers: 3,
  totalProjects: 18,
  activeSubscriptions: 2,
  monthlyRevenue: 59.98,
  annualRevenue: 199.99,
  projectedAnnualRevenue: 719.76,
  userCounts: {
    free: 1,
    starter: 0,
    pro: 1,
    unlimited: 1
  }
};

export function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    
    // Simulate deletion
    setTimeout(() => {
      setIsDeleting(false);
      setShowConfirmation(false);
      alert("All user data has been deleted successfully");
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminSession");
    window.location.href = "/admin-login";
  };

  return (
    <AdminCheck>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-300">Manage system data and settings</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Logout
          </button>
        </div>
        
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-4 py-2 ${activeTab === "users" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-400"}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "manage" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-400"}`}
            onClick={() => setActiveTab("manage")}
          >
            User Management
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "stats" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-400"}`}
            onClick={() => setActiveTab("stats")}
          >
            Statistics
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "danger" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-400"}`}
            onClick={() => setActiveTab("danger")}
          >
            Danger Zone
          </button>
        </div>
        
        {activeTab === "users" && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Users Overview</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-gray-300">Email</th>
                    <th className="py-3 px-4 text-gray-300">Name</th>
                    <th className="py-3 px-4 text-gray-300">Role</th>
                    <th className="py-3 px-4 text-gray-300">Subscription</th>
                    <th className="py-3 px-4 text-gray-300">Projects</th>
                    <th className="py-3 px-4 text-gray-300">Storage</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user) => (
                    <tr key={user._id} className="border-b border-gray-800">
                      <td className="py-3 px-4 text-white">{user.email}</td>
                      <td className="py-3 px-4 text-white">{user.name || "--"}</td>
                      <td className="py-3 px-4 text-white">{user.profile?.role || "user"}</td>
                      <td className="py-3 px-4 text-white">{user.profile?.subscriptionTier || "free"}</td>
                      <td className="py-3 px-4 text-white">{user.projectsCount || 0}</td>
                      <td className="py-3 px-4 text-white">{Math.round((user.storageUsed || 0) / (1024 * 1024))} MB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === "manage" && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
            <UserManagement />
          </div>
        )}
        
        {activeTab === "stats" && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Subscription Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm mb-1">Total Users</h3>
                <p className="text-2xl font-bold text-white">{mockStats.totalUsers}</p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm mb-1">Total Projects</h3>
                <p className="text-2xl font-bold text-white">{mockStats.totalProjects}</p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm mb-1">Active Subscriptions</h3>
                <p className="text-2xl font-bold text-white">{mockStats.activeSubscriptions}</p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm mb-1">Monthly Revenue</h3>
                <p className="text-2xl font-bold text-white">${mockStats.monthlyRevenue.toFixed(2)}</p>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-3">Subscription Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(mockStats.userCounts).map(([tier, count]) => (
                <div key={tier} className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-gray-400 text-sm mb-1 capitalize">{tier}</h4>
                  <p className="text-xl font-bold text-white">{count} users</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === "danger" && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Database Management</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-red-400 mb-2">Danger Zone</h3>
                <p className="text-gray-300 mb-4">
                  These actions are destructive and cannot be undone. Please proceed with caution.
                </p>
                
                <button
                  onClick={() => setShowConfirmation(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete All User Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 p-6 rounded max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4 text-white">Confirm Data Deletion</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete ALL user data? This includes all projects, audio files, and settings.
                <br /><br />
                <span className="text-red-400 font-bold">This action cannot be undone.</span>
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllData}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminCheck>
  );
}