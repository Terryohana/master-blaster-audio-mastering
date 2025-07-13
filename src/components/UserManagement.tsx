import { useState } from "react";
import { toast } from "sonner";

// Mock user data
const initialUsers = [
  {
    _id: "1",
    email: "methodman@mail.com",
    name: "Admin User",
    role: "admin",
    subscriptionTier: "unlimited"
  },
  {
    _id: "2",
    email: "user@example.com",
    name: "Regular User",
    role: "user",
    subscriptionTier: "free"
  },
  {
    _id: "3",
    email: "pro@example.com",
    name: "Pro User",
    role: "user",
    subscriptionTier: "pro"
  }
];

export function UserManagement() {
  const [users, setUsers] = useState(() => {
    // Try to load users from localStorage
    const savedUsers = localStorage.getItem("mb_admin_users");
    return savedUsers ? JSON.parse(savedUsers) : initialUsers;
  });
  
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "user",
    subscriptionTier: "free",
    password: "password123" // Default password
  });
  
  // Save users to localStorage
  const saveUsers = (updatedUsers) => {
    localStorage.setItem("mb_admin_users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Create new user
  const handleCreateUser = () => {
    const newUser = {
      _id: Date.now().toString(),
      email: formData.email,
      name: formData.name,
      role: formData.role,
      subscriptionTier: formData.subscriptionTier
    };
    
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    setShowCreateModal(false);
    setFormData({
      email: "",
      name: "",
      role: "user",
      subscriptionTier: "free",
      password: "password123"
    });
    toast.success(`User ${newUser.name} created successfully`);
  };
  
  // Start editing user
  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      password: "password123" // Default password
    });
  };
  
  // Update user
  const handleUpdateUser = () => {
    const updatedUsers = users.map(user => 
      user._id === editingUser._id 
        ? { 
            ...user, 
            email: formData.email,
            name: formData.name,
            role: formData.role,
            subscriptionTier: formData.subscriptionTier
          } 
        : user
    );
    
    saveUsers(updatedUsers);
    setEditingUser(null);
    toast.success(`User ${formData.name} updated successfully`);
  };
  
  // Delete user
  const handleDeleteUser = () => {
    const updatedUsers = users.filter(user => user._id !== userToDelete._id);
    saveUsers(updatedUsers);
    setShowDeleteModal(false);
    setUserToDelete(null);
    toast.success(`User deleted successfully`);
  };
  
  // Login as user
  const handleLoginAs = (user) => {
    // Store the admin session for returning later
    const adminSession = localStorage.getItem("adminSession");
    localStorage.setItem("adminSessionBackup", adminSession);
    
    // Create a user session
    localStorage.setItem("userSession", JSON.stringify({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      timestamp: Date.now()
    }));
    
    toast.success(`Logged in as ${user.name}`);
    
    // Redirect to main page
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">User Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Create User
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="py-3 px-4 text-gray-300">Email</th>
              <th className="py-3 px-4 text-gray-300">Name</th>
              <th className="py-3 px-4 text-gray-300">Role</th>
              <th className="py-3 px-4 text-gray-300">Subscription</th>
              <th className="py-3 px-4 text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b border-gray-800">
                <td className="py-3 px-4 text-white">{user.email}</td>
                <td className="py-3 px-4 text-white">{user.name}</td>
                <td className="py-3 px-4 text-white capitalize">{user.role}</td>
                <td className="py-3 px-4 text-white capitalize">{user.subscriptionTier}</td>
                <td className="py-3 px-4 flex space-x-2">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setUserToDelete(user);
                      setShowDeleteModal(true);
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleLoginAs(user)}
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
                  >
                    Login As
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4 text-white">Create New User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded text-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Subscription</label>
                <select
                  name="subscriptionTier"
                  value={formData.subscriptionTier}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded text-white"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="unlimited">Unlimited</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Password</label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded text-white"
                  required
                />
                <p className="text-gray-500 text-xs mt-1">Default password for all users</p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4 text-white">Edit User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded text-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Subscription</label>
                <select
                  name="subscriptionTier"
                  value={formData.subscriptionTier}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded text-white"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="unlimited">Unlimited</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4 text-white">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete user <span className="font-semibold">{userToDelete.name}</span>?
              <br /><br />
              <span className="text-red-400 font-bold">This action cannot be undone.</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}