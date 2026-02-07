import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  
  // Verify Cron Secret if set
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const supabase = createSupabaseServerClient();
    
    // Perform a simple query to keep the DB alive
    const { data, error } = await supabase.from('pre_gr_entry').select('id').limit(1);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Ping successful', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Ping failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
