import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('GQR Excel Export Function called!')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      'https://mdsaqgaxmkedrohxrqtl.supabase.co',
      'sb_publishable_cZVxCRqerAubPkIf8iZXSw_MzigZ6yC'
    )
    
    console.log('Creating Supabase client...')
    
    // Get GQR data with all related information
    const { data: gqrList, error } = await supabaseClient
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
      .eq('gqr_status', 'Closed')
      .order('created_at', { ascending: false })
      .limit(100)

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
          message: 'No GQR records found to export',
          count: 0
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Processing ${gqrList.length} GQR records for Excel export`)

    // Transform data for Excel format
    const excelData = gqrList.map((gqrData) => {
      const preGr = gqrData.pre_gr_entry
      const po = preGr?.purchase_orders
      const supplier = po?.suppliers
      const item = po?.item_master

      // Calculate quantities in MT
      const actualCargoWeight = gqrData.export_quality_weight || gqrData.net_wt || 0
      const actualPodiWeight = gqrData.podi_weight || 0
      const actualGapWeight = gqrData.gap_items_weight || 0
      const actualWastageWeight = (gqrData.rot_weight || 0) + (gqrData.doubles_weight || 0) + (gqrData.sand_weight || 0)

      // Calculate rates
      const actualRatePerKg = gqrData.volatile_po_rate || po?.rate || 0
      const actualPodiRatePerKg = gqrData.volatile_podi_rate || po?.podi_rate || 0
      const actualGapRatePerKg = gqrData.volatile_gap_item_rate || po?.rate || 0

      return {
        // Row 1: Headers
        'GQR_ID': gqrData.id,
        'GQR_Date': gqrData.date,
        'GQR_Status': gqrData.gqr_status,
        'Is_Tally_Posted': gqrData.is_tally_posted || false,
        
        // Row 2: PO Information
        'PO_Number': po?.vouchernumber || '',
        'PO_Date': po?.date || '',
        'PO_Item': item?.item_name || '',
        'PO_Rate': po?.rate || 0,
        'PO_Quantity': po?.quantity || 0,
        'PO_Damage_Allowed': po?.damage_allowed_kgs_ton || 0,
        'PO_Cargo': po?.cargo || 0,
        
        // Row 3: Supplier Information
        'Supplier_Name': supplier?.name || '',
        'Supplier_ID': supplier?.id || 0,
        
        // Row 4: GR Information
        'GR_Number': preGr?.gr_no || '',
        'GR_Date': preGr?.gr_dt || '',
        'GR_Voucher_Number': preGr?.vouchernumber || '',
        
        // Row 5: Export Item Information
        'Export_Item_Name': item?.item_name || '',
        'Export_Item_Qty_MT': (actualCargoWeight / 1000).toFixed(3),
        'Export_Item_Rate': actualRatePerKg,
        'Export_Item_HSN': item?.hsn_code || '',
        'Export_Item_Unit': item?.item_unit || '',
        
        // Row 6: Podi Information
        'Podi_Qty_MT': (actualPodiWeight / 1000).toFixed(3),
        'Podi_Rate': actualPodiRatePerKg,
        'Podi_Bags': preGr?.podi_bags || 0,
        
        // Row 7: Gap Items Information
        'Gap_Item1_Qty_MT': (actualGapWeight / 1000).toFixed(3),
        'Gap_Item1_Bags': preGr?.gap_item1_bags || 0,
        'Gap_Item_Rate': actualGapRatePerKg,
        
        // Row 8: Wastage Information
        'Wastage_Qty_MT': (actualWastageWeight / 1000).toFixed(3),
        'Rot_Weight_Kg': gqrData.rot_weight || 0,
        'Doubles_Weight_Kg': gqrData.doubles_weight || 0,
        'Sand_Weight_Kg': gqrData.sand_weight || 0,
        
        // Row 9: Weights (in kgs)
        'Net_Weight_Kg': gqrData.net_wt || 0,
        'Export_Quality_Weight_Kg': gqrData.export_quality_weight || 0,
        'Podi_Weight_Kg': gqrData.podi_weight || 0,
        'Gap_Items_Weight_Kg': gqrData.gap_items_weight || 0,
        
        // Row 10: Calculated Values
        'Cargo_Value': (actualCargoWeight * actualRatePerKg).toFixed(2),
        'Podi_Value': (actualPodiWeight * actualPodiRatePerKg).toFixed(2),
        'Gap_Value': (actualGapWeight * actualGapRatePerKg).toFixed(2),
        'Wastage_Value': (actualWastageWeight * actualRatePerKg).toFixed(2),
        'Total_Value': gqrData.total_value_received || 0,
        
        // Row 11: Timestamps
        'Created_At': gqrData.created_at,
        'Updated_At': gqrData.updated_at
      }
    })

    // Create CSV content (Excel can open CSV files)
    const headers = Object.keys(excelData[0])
    const csvContent = [
      headers.join(','),
      ...excelData.map(row => 
        headers.map(header => {
          const value = row[header]
          // Handle values that need quotes (strings with commas)
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    // Create Excel-like XML format (simpler than full Excel)
    const excelXml = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="GQR_Data">
    <Table>
      <Row>
        ${headers.map(header => `<Cell><Data ss:Type="String">${header}</Data></Cell>`).join('')}
      </Row>
      ${excelData.map(row => `
        <Row>
          ${headers.map(header => {
            const value = row[header]
            const type = typeof value === 'number' ? 'Number' : 'String'
            return `<Cell><Data ss:Type="${type}">${value}</Data></Cell>`
          }).join('')}
        </Row>
      `).join('')}
    </Table>
  </Worksheet>
</Workbook>`

    // Store in Supabase Storage
    const fileName = `gqr_data_${new Date().toISOString().split('T')[0]}.xml`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('gqr-exports')
      .upload(fileName, excelXml, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // Fallback: return CSV data directly
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Excel export completed (CSV format)',
          data: csvContent,
          count: excelData.length,
          format: 'csv',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get public URL for the uploaded file
    const { data: publicUrl } = supabaseClient.storage
      .from('gqr-exports')
      .getPublicUrl(fileName)

    console.log(`Excel file uploaded successfully: ${fileName}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Excel export completed successfully',
        fileName: fileName,
        downloadUrl: publicUrl.publicUrl,
        count: excelData.length,
        format: 'excel',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Excel Export Function Error:', error)
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
