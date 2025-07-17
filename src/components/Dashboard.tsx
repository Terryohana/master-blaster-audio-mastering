import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function Dashboard({ setCurrentPage, navigateToProcessor }) {
  const user = useQuery(api.users.getCurrentUser);
  const subscriptionLimits = useQuery(api.users.getSubscriptionLimits);
  const recentProjects = useQuery(api.projects.listProjects, {});
  const initializePresets = useMutation(api.eqPresets.initializePresets);

  // Initialize presets on first load
  useState(() => {
    if (initializePresets) {
      initializePresets();
    }
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back, {user?.profile?.firstName || "Producer"}! 🎵
        </h1>
        <p className="text-gray-300 text-lg">
          Ready to master your next track? Use our Live EQ processor for professional results.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tracks Used</p>
              <p className="text-2xl font-bold text-white">
                {subscriptionLimits?.used || 0} / {subscriptionLimits?.limit || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 14L11 10L15 14L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Subscription</p>
              <p className="text-2xl font-bold text-white capitalize">
                {subscriptionLimits?.tier || "Free"}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Projects</p>
              <p className="text-2xl font-bold text-white">
                {recentProjects?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18V5L21 3V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Admin Card - Only shown if user is admin */}
        {localStorage.getItem("adminSession") && (
          <div className="bg-purple-900/30 backdrop-blur-sm rounded-xl p-6 border border-purple-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm">Admin Panel</p>
                <p className="text-2xl font-bold text-white">Access</p>
              </div>
              <button
                onClick={() => setCurrentPage("admin")}
                className="w-12 h-12 bg-purple-800 rounded-lg flex items-center justify-center hover:bg-purple-700 transition-colors"
              >
                <span className="text-xl">⚙️</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live EQ Quick Access */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 19H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="17" cy="5" r="2" fill="currentColor"/>
                <circle cx="7" cy="12" r="2" fill="currentColor"/>
                <circle cx="12" cy="19" r="2" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Live Audio Processing</h3>
              <p className="text-gray-300">Process audio in real-time with professional EQ and compression</p>
            </div>
          </div>
          <button 
            onClick={() => navigateToProcessor({ projectName: "", projectId: null })}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
          >
            Open Live EQ
          </button>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Recent Projects</h2>
          <button 
            onClick={() => setCurrentPage("projects")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            View All →
          </button>
        </div>
        
        {recentProjects && recentProjects.length > 0 ? (
          <div className="space-y-4">
            {recentProjects.slice(0, 5).map((project) => (
              <div
              key={project._id}
              className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
              onClick={() => navigateToProcessor({ 
                  projectName: project.name, 
                  projectId: project._id 
                })}
              >
                <div>
                  <h3 className="text-white font-medium">{project.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {project.eqPreset} • {formatDate(project._creationTime)}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === "completed" 
                      ? "bg-green-600/20 text-green-400"
                      : project.status === "processing"
                      ? "bg-yellow-600/20 text-yellow-400"
                      : project.status === "failed"
                      ? "bg-red-600/20 text-red-400"
                      : "bg-blue-600/20 text-blue-400"
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-blue-400 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M3 19H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="17" cy="5" r="2" fill="currentColor"/>
                      <circle cx="7" cy="12" r="2" fill="currentColor"/>
                      <circle cx="12" cy="19" r="2" fill="currentColor"/>
                    </svg>
                    Live EQ
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-gray-300 mb-4">No projects yet. Get started with Live EQ!</p>
            <button 
              onClick={() => setCurrentPage("processor")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Live EQ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}