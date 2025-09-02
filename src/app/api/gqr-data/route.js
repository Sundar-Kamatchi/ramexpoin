// src/app/api/gqr-data/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const postedOnly = searchParams.get('posted') === 'true';
    const limit = parseInt(searchParams.get('limit')) || 100; // Default limit of 100
    
    // Build the query
    let query = supabase
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
      .eq('gqr_status', 'Closed')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by tally posted status if specified
    if (postedOnly !== null) {
      query = query.eq('is_tally_posted', postedOnly);
    }

    const { data: gqrList, error: gqrError } = await query;

    if (gqrError) {
      console.error('Error fetching GQR data:', gqrError);
      return NextResponse.json({
        success: false,
        error: `Failed to fetch GQR data: ${gqrError.message}`
      }, { status: 500 });
    }

    if (!gqrList || gqrList.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No GQR records found',
        count: 0
      });
    }

    // Process all GQR records
    const tallyDataList = gqrList.map(gqrData => {
      const po = gqrData.pre_gr_entry?.purchase_orders;
      const supplier = po?.suppliers;
      const item = po?.item_master;
      const preGr = gqrData.pre_gr_entry;

      if (!po || !supplier || !item) {
        return null; // Skip incomplete records
      }

      // Calculate actual quantities and rates from GQR
      const actualCargoWeight = gqrData.export_quality_weight || gqrData.net_wt || 0;
      const actualPodiWeight = gqrData.podi_weight || 0;
      const actualGapWeight = gqrData.gap_items_weight || 0;
      const actualWastageWeight = (gqrData.rot_weight || 0) + (gqrData.doubles_weight || 0) + (gqrData.sand_weight || 0);
      
      // Use volatile rates if available, otherwise fallback to PO rates
      const actualRatePerKg = gqrData.volatile_po_rate || po.rate || 0;
      const actualPodiRatePerKg = gqrData.volatile_podi_rate || po.podi_rate || 0;
      const actualWastageKgsPerTon = gqrData.volatile_wastage_kgs_per_ton || po.damage_allowed_kgs_ton || 100;

      // Format data for Tally TDL consumption
      return {
        gqrId: gqrData.id,
        voucherNumber: `${preGr.vouchernumber}-GQR${gqrData.id}`,
        voucherDate: gqrData.date || po.date,
        supplierName: supplier.name,
        itemName: item.item_name,
        itemHSN: item.hsn_code,
        
        // Quantities in MT (converted from kgs)
        actualCargoWeight: (actualCargoWeight / 1000).toFixed(3),
        actualPodiWeight: (actualPodiWeight / 1000).toFixed(3),
        actualGapWeight: (actualGapWeight / 1000).toFixed(3),
        actualWastageWeight: (actualWastageWeight / 1000).toFixed(3),
        
        // Rates
        ratePerKg: actualRatePerKg,
        podiRatePerKg: actualPodiRatePerKg,
        wastageKgsPerTon: actualWastageKgsPerTon,
        
        // Calculated values
        cargoValue: (actualCargoWeight * actualRatePerKg).toFixed(2),
        podiValue: (actualPodiWeight * actualPodiRatePerKg).toFixed(2),
        gapValue: (actualGapWeight * actualPodiRatePerKg).toFixed(2),
        wastageValue: (actualWastageWeight * actualRatePerKg).toFixed(2),
        totalValue: ((actualCargoWeight * actualRatePerKg) + 
                     (actualPodiWeight * actualPodiRatePerKg) + 
                     (actualGapWeight * actualPodiRatePerKg) + 
                     (actualWastageWeight * actualRatePerKg)).toFixed(2),
        
        // Original PO data for reference
        poVoucherNumber: po.vouchernumber,
        poQuantity: po.quantity,
        poRate: po.rate,
        poPodiRate: po.podi_rate,
        poDamageAllowed: po.damage_allowed_kgs_ton,
        poCargo: po.cargo,
        
        // GQR specific data
        gqrStatus: gqrData.gqr_status,
        totalValueReceived: gqrData.total_value_received,
        isTallyPosted: gqrData.is_tally_posted || false,
        
        // Additional details for Tally
        netWeight: gqrData.net_wt || 0,
        exportQualityWeight: gqrData.export_quality_weight || 0,
        rotWeight: gqrData.rot_weight || 0,
        doublesWeight: gqrData.doubles_weight || 0,
        sandWeight: gqrData.sand_weight || 0,
        
        // Timestamps
        createdAt: gqrData.created_at,
        updatedAt: gqrData.updated_at
      };
    }).filter(item => item !== null); // Remove null items

    // Return data in a format that Tally TDL can easily parse
    return NextResponse.json({
      success: true,
      data: tallyDataList,
      count: tallyDataList.length,
      message: `Retrieved ${tallyDataList.length} GQR records`
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: `Internal server error: ${error.message}`
    }, { status: 500 });
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
