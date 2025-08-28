'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient'; // Ensure this path is correct
import { UserGroupIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import  AddUserModal from '@/components/AddUserModal';
import EditUserModal from '@/components/EditUserModal';

export default function UserManagement() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // --- Fetch real user data from Supabase ---
  const fetchUsers = async () => {
    console.log('UserManagement: Starting fetchUsers, isAdmin:', isAdmin);
    setIsLoading(true);
    setError(null);
    try {
      // An admin can fetch all user profiles
      console.log('UserManagement: Querying user_profiles table...');
      console.log('UserManagement: Using supabase client:', supabase ? 'AVAILABLE' : 'NOT AVAILABLE');
      
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, role'); // Fetch the columns from your table

      console.log('UserManagement: Query result:', { data, fetchError });
      console.log('UserManagement: Data type:', typeof data);
      console.log('UserManagement: Data length:', data?.length);
      console.log('UserManagement: Error type:', typeof fetchError);
      console.log('UserManagement: Error details:', fetchError);

      if (fetchError) {
        console.error('UserManagement: Fetch error:', fetchError);
        throw fetchError;
      }
      
      console.log('UserManagement: Setting users:', data);
      setUsers(data || []);
    } catch (err) {
      console.error('UserManagement: Error in fetchUsers:', err);
      console.error('UserManagement: Error message:', err.message);
      console.error('UserManagement: Error stack:', err.stack);
      setError('Failed to load users: ' + err.message);
      // Don't throw the error, just set the error state
      // This prevents the delete function from failing
    } finally {
      console.log('UserManagement: Setting loading to false');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('UserManagement: useEffect triggered, isAdmin:', isAdmin, 'authLoading:', authLoading);
    if (isAdmin && !authLoading) {
      console.log('UserManagement: Calling fetchUsers');
      fetchUsers();
    } else {
      console.log('UserManagement: Not calling fetchUsers - isAdmin:', isAdmin, 'authLoading:', authLoading);
    }
  }, [isAdmin, authLoading]);

  // Handle edit user
  const handleEditUser = (user) => {
    console.log('UserManagement: Edit user:', user);
    setSelectedUser(user);
    setIsEditUserModalOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = async (user) => {
    console.log('UserManagement: Delete user:', user);
    if (confirm(`Are you sure you want to delete ${user.full_name} (${user.email})?`)) {
      try {
        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete user.');
        }
        
        console.log('UserManagement: User deleted successfully');
        alert('User deleted successfully');
        
        // Refresh the list after successful deletion
        try {
          await fetchUsers();
        } catch (fetchError) {
          console.error('UserManagement: Error refreshing user list after delete:', fetchError);
          // Don't show error to user since delete was successful
          // Just log it for debugging
        }
      } catch (err) {
        console.error('UserManagement: Error deleting user:', err);
        alert('Failed to delete user: ' + err.message);
      }
    }
  };

  // --- Render Logic ---
  if (authLoading) {
    console.log('UserManagement: Showing auth loading');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    console.log('UserManagement: Access denied - not admin');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  console.log('UserManagement: Rendering with users:', users.length, 'isLoading:', isLoading, 'error:', error);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Users</h2>
          <button 
            onClick={() => setIsAddUserModalOpen(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add User
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading users...</span>
          </div>
        ) : error ? (
            <div className="p-6 text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.full_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Edit user"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete user"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Cards (Now dynamically calculated) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold">Total Users</h3>
              <p className="text-2xl font-bold text-blue-600">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <UserGroupIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold">Admins</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {users.filter(user => user.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Render the modals */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSuccess={fetchUsers} // Pass the fetchUsers function to refresh the list on success
      />
      
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
}
