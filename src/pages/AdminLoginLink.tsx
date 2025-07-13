import React from 'react';

export default function AdminLoginLink() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Master Blaster</h1>
          <p className="text-gray-300 mb-6">Professional Audio Mastering</p>
          
          <a 
            href="/admin-login" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Access Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
}