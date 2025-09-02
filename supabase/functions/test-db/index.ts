import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Test DB Function called!')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      'https://mdsaqgaxmkedrohxrqtl.supabase.co',
      'sb_publishable_cZVxCRqerAubPkIf8iZXSw_MzigZ6yC'
    )
    
    console.log('Testing database connection...')
    
    // Test 1: Check if gqr_entry table exists and has any records
    const { data: gqrCount, error: gqrError } = await supabaseClient
      .from('gqr_entry')
      .select('*', { count: 'exact', head: true })
    
    console.log('GQR count result:', gqrCount, 'Error:', gqrError)
    
    // Test 2: Get first few GQR records with all fields
    const { data: gqrRecords, error: gqrRecordsError } = await supabaseClient
      .from('gqr_entry')
      .select('*')
      .limit(3)
    
    console.log('GQR records result:', gqrRecords, 'Error:', gqrRecordsError)
    
    // Test 3: Check what statuses exist
    const { data: statuses, error: statusError } = await supabaseClient
      .from('gqr_entry')
      .select('gqr_status')
      .limit(10)
    
    console.log('Statuses result:', statuses, 'Error:', statusError)
    
    // Test 4: Check pre_gr_entry table
    const { data: preGrCount, error: preGrError } = await supabaseClient
      .from('pre_gr_entry')
      .select('*', { count: 'exact', head: true })
    
    console.log('Pre-GR count result:', preGrCount, 'Error:', preGrError)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database test completed',
        results: {
          gqrCount: gqrCount,
          gqrError: gqrError?.message,
          gqrRecords: gqrRecords,
          gqrRecordsError: gqrRecordsError?.message,
          statuses: statuses,
          statusError: statusError?.message,
          preGrCount: preGrCount,
          preGrError: preGrError?.message
        },
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Test Function Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: `Test function error: ${error.message}`
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
