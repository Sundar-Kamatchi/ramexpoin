// src/app/api/admin/users/[id]/route.jsx
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function PUT(request, { params }) {
  console.log("--- API: PUT /api/admin/users/[id] route hit ---");
  const { id } = params;
  const cookieStore = cookies();

  // Create a standard server client to check the current user's session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );

  // --- Start Admin Check ---
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("API Error: No user session found. Access denied.");
    return NextResponse.json({ error: 'Authentication failed: No user session.' }, { status: 401 });
  }
  console.log(`API Check: User authenticated as ${user.email}`);

  // Use the service key to bypass RLS and securely get the user's role
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profileError || profile?.role !== 'admin') {
    console.error(`API Error: Authorization failed. User role is "${profile?.role}".`);
    return NextResponse.json({ error: 'Forbidden: Admin privileges required.' }, { status: 403 });
  }
  console.log("API Check: User is an admin. Proceeding...");
  // --- End Admin Check ---

  const { full_name, email, role } = await request.json();

  if (!full_name || !email || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Update the user profile
  const { error: updateError } = await supabaseAdmin
    .from('user_profiles')
    .update({ 
      full_name: full_name,
      email: email,
      role: role
    })
    .eq('id', id);

  if (updateError) {
    console.error('Error updating user:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'User updated successfully.' });
}

export async function DELETE(request, { params }) {
  console.log("--- API: DELETE /api/admin/users/[id] route hit ---");
  const { id } = params;
  const cookieStore = cookies();

  // Create a standard server client to check the current user's session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );

  // --- Start Admin Check ---
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("API Error: No user session found. Access denied.");
    return NextResponse.json({ error: 'Authentication failed: No user session.' }, { status: 401 });
  }
  console.log(`API Check: User authenticated as ${user.email}`);

  // Use the service key to bypass RLS and securely get the user's role
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profileError || profile?.role !== 'admin') {
    console.error(`API Error: Authorization failed. User role is "${profile?.role}".`);
    return NextResponse.json({ error: 'Forbidden: Admin privileges required.' }, { status: 403 });
  }
  console.log("API Check: User is an admin. Proceeding...");
  // --- End Admin Check ---

  // Delete the user profile first
  const { error: deleteProfileError } = await supabaseAdmin
    .from('user_profiles')
    .delete()
    .eq('id', id);

  if (deleteProfileError) {
    console.error('Error deleting user profile:', deleteProfileError);
    return NextResponse.json({ error: deleteProfileError.message }, { status: 500 });
  }

  // Then delete the auth user
  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (deleteAuthError) {
    console.error('Error deleting auth user:', deleteAuthError);
    return NextResponse.json({ error: deleteAuthError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'User deleted successfully.' });
} 