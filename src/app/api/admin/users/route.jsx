// src/app/api/admin/users/route.jsx
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  console.log("--- API: POST /api/admin/users route hit ---");
  const cookieStore = cookies();

  // Debug environment variables
  console.log("API Debug: NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET");
  console.log("API Debug: SUPABASE_SERVICE_KEY:", process.env.SUPABASE_SERVICE_KEY ? "SET" : "NOT SET");
  console.log("API Debug: NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT SET");

  // Check if service key is available
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error("API Error: SUPABASE_SERVICE_KEY is not set");
    console.error("API Debug: Available env vars:", Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    return NextResponse.json({ error: 'Server configuration error: Service key not found. Please check your .env.local file.' }, { status: 500 });
  }

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

  const { full_name, username, password, role } = await request.json();

  if (!username || !password || !role || !full_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Use the same supabaseAdmin client for all privileged actions
  const email = `${username.toLowerCase()}@ramexpo.com`;

  const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { full_name: full_name }
  });

  if (createError) {
    console.error('Error creating user:', createError);
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  // The trigger 'on_auth_user_created' automatically creates the profile.
  // We just need to update the role.
  const { error: updateProfileError } = await supabaseAdmin
    .from('user_profiles')
    .update({ role: role, email: email, full_name: full_name })
    .eq('id', newUser.id);

  if (updateProfileError) {
    console.error('Error setting user role:', updateProfileError);
    // Clean up the created auth user if the profile update fails
    await supabaseAdmin.auth.admin.deleteUser(newUser.id);
    return NextResponse.json({ error: updateProfileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'User created successfully.' });
}
