import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function AdminPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const deleteAllUserData = useMutation(api.admin.deleteAllUserData);

  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    try {
      await deleteAllUserData();
      toast.success("All user data has been deleted successfully");
      setShowConfirmation(false);
    } catch (error) {
      toast.error("Failed to delete user data: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
        <p className="text-gray-300">Manage system data and settings</p>
      </div>

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
  );
}