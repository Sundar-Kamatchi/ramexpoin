import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // SIMPLIFIED QUERY - First get basic GQR data
    let query = supabaseClient
      .from('gqr_entry')
      .select('*')
      .eq('gqr_status', 'Closed')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filter if specified
    if (postedOnly !== null) {
      query = query.eq('is_tally_posted', postedOnly === 'true')
    }

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

    if (!gqrList || gqrList.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          message: 'No GQR records found',
          count: 0
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Now fetch related data for each GQR
    const enrichedData = await Promise.all(
      gqrList.map(async (gqrData) => {
        try {
          // Get pre_gr_entry data
          const { data: preGrData } = await supabaseClient
            .from('pre_gr_entry')
            .select('id, vouchernumber, net_wt, ladden_wt, empty_wt, date')
            .eq('id', gqrData.pre_gr_entry_id)
            .single()

          if (!preGrData) return null

          // Get purchase order data
          const { data: poData } = await supabaseClient
            .from('purchase_orders')
            .select('id, vouchernumber, date, rate, podi_rate, quantity, damage_allowed_kgs_ton, cargo')
            .eq('id', preGrData.purchase_order_id)
            .single()

          if (!poData) return null

          // Get supplier data
          const { data: supplierData } = await supabaseClient
            .from('suppliers')
            .select('id, name')
            .eq('id', poData.supplier_id)
            .single()

          if (!supplierData) return null

          // Get item data
          const { data: itemData } = await supabaseClient
            .from('item_master')
            .select('id, item_name, hsn_code, item_unit')
            .eq('id', poData.item_id)
            .single()

          if (!itemData) return null

          // Calculate actual quantities and rates
          const actualCargoWeight = gqrData.export_quality_weight || gqrData.net_wt || 0
          const actualPodiWeight = gqrData.podi_weight || 0
          const actualGapWeight = gqrData.gap_items_weight || 0
          const actualWastageWeight = (gqrData.rot_weight || 0) + (gqrData.doubles_weight || 0) + (gqrData.sand_weight || 0)
          
          const actualRatePerKg = gqrData.volatile_po_rate || poData.rate || 0
          const actualPodiRatePerKg = gqrData.volatile_podi_rate || poData.podi_rate || 0

          return {
            gqrId: gqrData.id,
            voucherNumber: `${preGrData.vouchernumber}-GQR${gqrData.id}`,
            voucherDate: gqrData.date || poData.date,
            supplierName: supplierData.name,
            itemName: itemData.item_name,
            itemHSN: itemData.hsn_code,
            
            // Quantities in MT (converted from kgs)
            actualCargoWeight: (actualCargoWeight / 1000).toFixed(3),
            actualPodiWeight: (actualPodiWeight / 1000).toFixed(3),
            actualGapWeight: (actualGapWeight / 1000).toFixed(3),
            actualWastageWeight: (actualWastageWeight / 1000).toFixed(3),
            
            // Rates
            ratePerKg: actualRatePerKg,
            podiRatePerKg: actualPodiRatePerKg,
            
            // Calculated values
            cargoValue: (actualCargoWeight * actualRatePerKg).toFixed(2),
            podiValue: (actualPodiWeight * actualPodiRatePerKg).toFixed(2),
            gapValue: (actualGapWeight * actualPodiRatePerKg).toFixed(2),
            wastageValue: (actualWastageWeight * actualRatePerKg).toFixed(2),
            totalValue: ((actualCargoWeight * actualRatePerKg) + 
                         (actualPodiWeight * actualPodiRatePerKg) + 
                         (actualGapWeight * actualPodiRatePerKg) + 
                         (actualWastageWeight * actualRatePerKg)).toFixed(2),
            
            // Original PO data
            poVoucherNumber: poData.vouchernumber,
            poQuantity: poData.quantity,
            poRate: poData.rate,
            poPodiRate: poData.podi_rate,
            poDamageAllowed: poData.damage_allowed_kgs_ton,
            poCargo: poData.cargo,
            
            // GQR specific data
            gqrStatus: gqrData.gqr_status,
            totalValueReceived: gqrData.total_value_received,
            isTallyPosted: gqrData.is_tally_posted || false,
            
            // Additional details
            netWeight: gqrData.net_wt || 0,
            exportQualityWeight: gqrData.export_quality_weight || 0,
            rotWeight: gqrData.rot_weight || 0,
            doublesWeight: gqrData.doubles_weight || 0,
            sandWeight: gqrData.sand_weight || 0,
            
            // Timestamps
            createdAt: gqrData.created_at,
            updatedAt: gqrData.updated_at
          }
        } catch (err) {
          console.error(`Error processing GQR ${gqrData.id}:`, err)
          return null
        }
      })
    )

    const tallyDataList = enrichedData.filter(item => item !== null)

    // Return data
    return new Response(
      JSON.stringify({
        success: true,
        data: tallyDataList,
        count: tallyDataList.length,
        message: `Retrieved ${tallyDataList.length} GQR records`,
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
