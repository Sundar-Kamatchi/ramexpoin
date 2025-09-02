import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
//supabase functions deploy new-gqr-data --no-verify-jwt
// LAST UPDATED: 2025-08-31 12:16 - Force redeploy
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // IMMEDIATE TEST - before anything else
  console.log('Function called! - Updated at 2025-08-31 12:16')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get query parameters
    const url = new URL(req.url)
    const postedOnly = url.searchParams.get('posted')
    const limit = parseInt(url.searchParams.get('limit') || '100')
    
    // Create Supabase client with hardcoded values (since env vars get truncated)
    console.log('Creating Supabase client...')
    const supabaseClient = createClient(
      'https://mdsaqgaxmkedrohxrqtl.supabase.co',
      'sb_publishable_cZVxCRqerAubPkIf8iZXSw_MzigZ6yC', // New publishable API key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    console.log('Supabase client created successfully')
    
    // Test the connection
    console.log('Testing Supabase connection...')
    const { data: testData, error: testError } = await supabaseClient
      .from('gqr_entry')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('Connection test failed:', testError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Connection test failed: ${testError.message}`,
          details: testError
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    console.log('Connection test successful, count:', testData)

    // COMPREHENSIVE QUERY - Get all GQR data with related information
    let query = supabaseClient
      .from('gqr_entry')
      .select(`
        *,
        pre_gr_entry (
          id,
          vouchernumber,
          net_wt,
          ladden_wt,
          empty_wt,
          date,
          gr_no,
          gr_dt,
          gap_item1_bags,
          gap_item2_bags,
          podi_bags,
          purchase_orders (
            id,
            vouchernumber,
            date,
            rate,
            podi_rate,
            quantity,
            damage_allowed_kgs_ton,
            cargo,
            suppliers (
              id,
              name
            ),
            item_master (
              id,
              item_name,
              hsn_code,
              item_unit
            )
          )
        )
      `)
      // .eq('gqr_status', 'Closed')  // TEMPORARILY COMMENTED OUT TO SEE ALL RECORDS
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filter if specified
    if (postedOnly !== null) {
      query = query.eq('is_tally_posted', postedOnly === 'true')
    }


    console.log('Executing query with gqr_status = Closed...')
    const { data: gqrList, error } = await query

    if (error) {
      console.error('Error fetching GQR data:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to fetch GQR data: ${error.message}`
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Query result: ${gqrList?.length || 0} records found`)
    
    // If no records found with 'Closed' status, let's check what statuses exist
    if (!gqrList || gqrList.length === 0) {
      console.log('No GQR records with status "Closed" found. Checking what statuses exist...')
      
      const { data: statusCheck, error: statusError } = await supabaseClient
        .from('gqr_entry')
        .select('gqr_status, count')
        .limit(10)
      
      if (statusError) {
        console.error('Status check failed:', statusError)
      } else {
        console.log('Available GQR statuses:', statusCheck)
      }
      
      // Let's also check if there are any GQR records at all
      const { data: allGqrCheck, error: allGqrError } = await supabaseClient
        .from('gqr_entry')
        .select('id, gqr_status, created_at')
        .limit(5)
      
      if (allGqrError) {
        console.error('All GQR check failed:', allGqrError)
      } else {
        console.log('All GQR records found:', allGqrCheck)
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          message: 'No GQR records found with status "Closed"',
          count: 0,
          debug: {
            availableStatuses: statusCheck,
            allGqrRecords: allGqrCheck
          }
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Found ${gqrList.length} GQR records`)

    // Transform the data to include all required fields
    const tallyDataList = gqrList.map((gqrData) => {
      try {
        const preGr = gqrData.pre_gr_entry
        const po = preGr?.purchase_orders
        const supplier = po?.suppliers
        const item = po?.item_master

        // Calculate quantities in MT (converted from kgs)
        const actualCargoWeight = gqrData.export_quality_weight || gqrData.net_wt || 0
        const actualPodiWeight = gqrData.podi_weight || 0
        const actualGapWeight = gqrData.gap_items_weight || 0
        const actualWastageWeight = (gqrData.rot_weight || 0) + (gqrData.doubles_weight || 0) + (gqrData.sand_weight || 0)

        // Calculate values
        const actualRatePerKg = gqrData.volatile_po_rate || po?.rate || 0
        const actualPodiRatePerKg = gqrData.volatile_podi_rate || po?.podi_rate || 0
        const actualGapRatePerKg = gqrData.volatile_gap_item_rate || po?.rate || 0

        return {
          // GR Info - Key fields first
          grNo: preGr?.gr_no || '',
          grDate: preGr?.gr_dt || '',
          grVoucherNumber: preGr?.vouchernumber || '',
          
          // GQR Basic Info
          gqrDate: gqrData.date,
          gqrStatus: gqrData.gqr_status,
          isTallyPosted: gqrData.is_tally_posted || false,
          
          // Purchase Order Info
          pono: po?.vouchernumber || '',
          podate: po?.date || '',
          poitem: item?.item_name || '',
          porate: po?.rate || 0,
          poQuantity: po?.quantity || 0,
          poDamageAllowed: po?.damage_allowed_kgs_ton || 0,
          poCargo: po?.cargo || 0,
          
          // Supplier Info
          supplierName: supplier?.name || '',
          supplierId: supplier?.id || 0,
          
          // Export Item Info
          exportItemName: item?.item_name || '',
          exportItemQty: (actualCargoWeight / 1000).toFixed(3), // Convert to MT
          exportItemRate: actualRatePerKg, // Volatile rate
          exportItemHSN: item?.hsn_code || '',
          exportItemUnit: item?.item_unit || '',
          
          // Podi Info
          podiQty: (actualPodiWeight / 1000).toFixed(3), // Convert to MT
          podiVolatileRate: actualPodiRatePerKg,
          podiBags: preGr?.podi_bags || 0,
          
          // Gap Items Info
          gapItem1Name: 'Gap Items', // Generic name since we don't have specific gap item names
          gapItem1Qty: (actualGapWeight / 1000).toFixed(3), // Convert to MT
          gapItem1Bags: preGr?.gap_item1_bags || 0,
          gapItem2Name: 'Additional Gap Items', // Generic name
          gapItem2Qty: 0, // Not currently tracked separately
          gapItem2Bags: preGr?.gap_item2_bags || 0,
          gapItemVolatileRate: actualGapRatePerKg,
          
          // Wastage Info
          wastageQty: (actualWastageWeight / 1000).toFixed(3), // Convert to MT
          rotWeight: gqrData.rot_weight || 0,
          doublesWeight: gqrData.doubles_weight || 0,
          sandWeight: gqrData.sand_weight || 0,
          
          // Weights (in kgs)
          netWeight: gqrData.net_wt || 0,
          exportQualityWeight: gqrData.export_quality_weight || 0,
          podiWeight: gqrData.podi_weight || 0,
          gapItemsWeight: gqrData.gap_items_weight || 0,
          
          // Calculated Values
          cargoValue: (actualCargoWeight * actualRatePerKg).toFixed(2),
          podiValue: (actualPodiWeight * actualPodiRatePerKg).toFixed(2),
          gapValue: (actualGapWeight * actualGapRatePerKg).toFixed(2),
          wastageValue: (actualWastageWeight * actualRatePerKg).toFixed(2),
          totalValue: gqrData.total_value_received || 0,
          
          // Timestamps
          createdAt: gqrData.created_at,
          updatedAt: gqrData.updated_at
        }
      } catch (err) {
        console.error(`Error processing GQR ${gqrData.id}:`, err)
        return null
      }
    }).filter(item => item !== null)

    console.log(`Processed ${tallyDataList.length} GQR records successfully`)

    // Return data
    return new Response(
      JSON.stringify({
        success: true,
        data: tallyDataList,
        count: tallyDataList.length,
        message: `Retrieved ${tallyDataList.length} GQR records with complete data`,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: `Internal server error: ${error.message}`
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
