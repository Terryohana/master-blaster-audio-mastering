import React from "react";

type DashboardProps = {
  setCurrentPage: (page: string) => void;
  navigateToProcessor: (params: any) => void;
};

export function SimpleDashboard({ setCurrentPage, navigateToProcessor }: DashboardProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Welcome to Master Blaster</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Start Card */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Start</h2>
          <p className="text-gray-300 mb-4">
            Get started with audio mastering in just a few clicks.
          </p>
          <button
            onClick={() => setCurrentPage("processor")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Mastering
          </button>
        </div>
        
        {/* Recent Projects Card */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Projects</h2>
          <p className="text-gray-300 mb-4">
            You don't have any recent projects.
          </p>
          <button
            onClick={() => setCurrentPage("projects")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Projects
          </button>
        </div>
        
        {/* Subscription Card */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Subscription</h2>
          <p className="text-gray-300 mb-4">
            You're currently on the Free plan.
          </p>
          <button
            onClick={() => setCurrentPage("subscription")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
}