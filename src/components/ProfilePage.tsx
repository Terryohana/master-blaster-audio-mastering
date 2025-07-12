import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function ProfilePage() {
  const user = useQuery(api.users.getCurrentUser);
  const subscriptionLimits = useQuery(api.users.getSubscriptionLimits);
  const updateProfile = useMutation(api.users.updateProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.profile?.firstName || "");
  const [lastName, setLastName] = useState(user?.profile?.lastName || "");

  const handleSave = async () => {
    try {
      await updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => {
    setFirstName(user?.profile?.firstName || "");
    setLastName(user?.profile?.lastName || "");
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-purple-200">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Personal Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Edit
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-gray-400 cursor-not-allowed"
                />
                <p className="text-purple-300 text-xs mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter first name"
                    className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                      isEditing
                        ? "bg-black/30 border-purple-500/30 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                        : "bg-black/20 border-purple-500/20 text-purple-200 cursor-not-allowed"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter last name"
                    className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                      isEditing
                        ? "bg-black/30 border-purple-500/30 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                        : "bg-black/20 border-purple-500/20 text-purple-200 cursor-not-allowed"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 mt-6">
            <h2 className="text-xl font-semibold text-white mb-6">Account Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-purple-500/20">
                <div>
                  <h3 className="text-white font-medium">Email Notifications</h3>
                  <p className="text-purple-300 text-sm">Receive updates about your projects</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-purple-500/20">
                <div>
                  <h3 className="text-white font-medium">Marketing Emails</h3>
                  <p className="text-purple-300 text-sm">Receive tips and product updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="space-y-6">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Subscription</h2>
            
            {subscriptionLimits && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-200">Current Plan</span>
                    <span className="text-white font-semibold capitalize">
                      {subscriptionLimits.tier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-200">Tracks Used</span>
                    <span className="text-white">
                      {subscriptionLimits.used} / {subscriptionLimits.limit}
                    </span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((subscriptionLimits.used / subscriptionLimits.limit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <button className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Manage Subscription
                </button>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Stats</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-purple-200">Member Since</span>
                <span className="text-white">
                  {user?._creationTime 
                    ? new Date(user._creationTime).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                      })
                    : "Unknown"
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-200">Total Projects</span>
                <span className="text-white">{subscriptionLimits?.used || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-200">Account Status</span>
                <span className="text-green-400">Active</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-900/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/20">
            <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
            
            <div className="space-y-3">
              <button className="w-full py-2 px-4 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors">
                Reset Password
              </button>
              <button className="w-full py-2 px-4 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
