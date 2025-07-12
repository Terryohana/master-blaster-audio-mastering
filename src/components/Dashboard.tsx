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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tracks Used</p>
              <p className="text-2xl font-bold text-white">
                {subscriptionLimits?.used || 0} / {subscriptionLimits?.limit || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
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
              <span className="text-xl">💎</span>
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
              <span className="text-xl">🎼</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live EQ Quick Access */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">🎛️ Live Audio Processing</h3>
            <p className="text-gray-300">Process audio in real-time with professional EQ and compression</p>
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
                  <span className="text-blue-400 text-sm">
                  🎛️ Live EQ
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