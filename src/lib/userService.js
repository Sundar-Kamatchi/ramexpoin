// lib/userService.js
import { supabaseAdmin } from '@/lib/supabaseServer';

export class UserService {
  // Get all users (admin only)
  static async getAllUsers() {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { data: null, error: error.message };
    }
  }

  // Get user by ID
  static async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user:', error);
      return { data: null, error: error.message };
    }
  }

  // Create new user (admin only)
  static async createUser(userData) {
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password || 'TempPassword123!', // You might want to generate this
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name
        }
      });

      if (authError) throw authError;

      // Then create user profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role || 'staff',
          status: userData.status || 'active'
        }])
        .select()
        .single();

      if (error) throw error;
      return { data: { ...data, auth_user: authData.user }, error: null };
    } catch (error) {
      console.error('Error creating user:', error);
      return { data: null, error: error.message };
    }
  }

  // Update user (admin only)
  static async updateUser(userId, userData) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: userData.full_name,
          role: userData.role,
          status: userData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating user:', error);
      return { data: null, error: error.message };
    }
  }

  // Delete user (admin only)
  static async deleteUser(userId) {
    try {
      // First delete from user_profiles (this will cascade due to foreign key)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Then delete from auth.users (admin API required)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) throw authError;
      return { error: null };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { error: error.message };
    }
  }

  // Get user statistics
  static async getUserStats() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role, status');

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(user => user.status === 'active').length,
        inactive: data.filter(user => user.status === 'inactive').length,
        admins: data.filter(user => user.role === 'admin').length,
        managers: data.filter(user => user.role === 'manager').length,
        staff: data.filter(user => user.role === 'staff').length
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { data: null, error: error.message };
    }
  }

  // Check if current user is admin
  static async isCurrentUserAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Update user status (activate/deactivate)
  static async updateUserStatus(userId, status) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating user status:', error);
      return { data: null, error: error.message };
    }
  }
}