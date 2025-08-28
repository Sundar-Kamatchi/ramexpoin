// src/app/api/tally-post-po/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getPurchaseOrderTallyXmlObject } from '@/utils/tallyXmlTemplates';
import { create } from 'xmlbuilder2';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// Julian Day Number calculation for Tally
const getJulianDayNumber = (date) => {
  if (!date || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to getJulianDayNumber');
  }
  return Math.floor((date.getTime() / 86400000) + 25569);
};

// Format date for Tally display (19-Jul-25 format)
const formatDateForTally = (date) => {
  if (!date || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to formatDateForTally');
  }
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  
  return `${day}-${month}-${year}`;
};

export async function POST(request) {
  try {
    // Initialize Supabase client
    let sb = supabase;
    if (!sb || typeof sb.from !== 'function') {
      const { createClient } = await import('@supabase/supabase-js');
      sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    }

    const body = await request.json();
    console.log('Received request body:', body);

    const { purchaseOrderId, tallyData, supplierData, itemData, formData } = body;

    if (!purchaseOrderId) {
      return NextResponse.json({
        success: false,
        error: 'Purchase Order ID is required'
      }, { status: 400 });
    }

    // Fetch complete PO data from Supabase if not provided
    let completeFormData = formData;
    let completeSupplierData = supplierData;
    let completeItemData = itemData;

    if (!completeFormData || !completeSupplierData || !completeItemData) {
      const { data: poData, error: poError } = await sb
        .from('purchase_orders')
        .select(`
          *,
          suppliers:supplier_id (id, name),
          item_master:item_id (id, item_name, hsn_code, item_unit)
        `)
        .eq('id', purchaseOrderId)
        .single();

      if (poError) {
        console.error('Error fetching PO data:', poError);
        return NextResponse.json({
          success: false,
          error: `Failed to fetch purchase order data: ${poError.message}`
        }, { status: 500 });
      }

      completeFormData = {
        vouchernumber: poData.vouchernumber,
        date: poData.date,
        supplierId: poData.supplier_id,
        itemId: poData.item_id,
        quantity: poData.quantity,
        rate: poData.rate,
        damage_allowed: poData.damage_allowed_kgs_ton,
        cargo: poData.cargo
      };

      completeSupplierData = poData.suppliers;
      completeItemData = poData.item_master;
    }

    // Validate required data
    if (!completeSupplierData || !completeItemData) {
      return NextResponse.json({
        success: false,
        error: 'Supplier or Item data not found'
      }, { status: 400 });
    }

    // Determine units for Tally
    const isOnionItem = completeItemData.item_name.toLowerCase().includes('onion');
    let primaryUnitForTally = isOnionItem ? 'MT' : completeItemData.item_unit;
    let alternativeUnitForTally = isOnionItem ? 'Kgs' : completeItemData.item_unit;

    if (!primaryUnitForTally) {
      return NextResponse.json({
        success: false,
        error: `Item "${completeItemData.item_name}" is missing unit data`
      }, { status: 400 });
    }

    // Validate HSN code
    if (!completeItemData.hsn_code) {
      return NextResponse.json({
        success: false,
        error: `Item "${completeItemData.item_name}" is missing HSN code`
      }, { status: 400 });
    }

    // Generate Tally data if not provided
    let completeTallyData = tallyData || {};
    
    if (!tallyData) {
      const voucherGuid = uuidv4().toUpperCase();
      const voucherKey = `${voucherGuid}-0000008e`;
      const currentDate = new Date();
      const currentDateFormatted = format(currentDate, 'yyyyMMdd');
      
      const poDateObject = new Date(completeFormData.date);
      if (isNaN(poDateObject.getTime())) {
        return NextResponse.json({
          success: false,
          error: 'Invalid date format in purchase order'
        }, { status: 400 });
      }
      
      const poDateForTally = format(poDateObject, 'yyyyMMdd');
      const orderDueDate = poDateForTally;
      
      let orderDueDateJD, orderDueDateForTally;
      try {
        orderDueDateJD = getJulianDayNumber(poDateObject);
        orderDueDateForTally = formatDateForTally(poDateObject);
      } catch (dateError) {
        return NextResponse.json({
          success: false,
          error: `Date processing error: ${dateError.message}`
        }, { status: 400 });
      }

      completeTallyData = {
        ...completeTallyData,
        vouchernumber: completeFormData.vouchernumber,
        poDate: poDateForTally,
        voucherGuid: voucherGuid,
        voucherKey: voucherKey,
        supplierName: completeSupplierData.name,
        itemName: completeItemData.item_name,
        itemHSN: completeItemData.hsn_code,
        primaryUnit: primaryUnitForTally,
        alternativeUnit: alternativeUnitForTally,
        quantity: completeFormData.quantity,
        rate: completeFormData.rate,
        currentDateFormatted: currentDateFormatted,
        orderDueDate: orderDueDate,
        orderDueDateJD: orderDueDateJD,
        orderDueDateForTally: orderDueDateForTally,
        damageAllowed: completeFormData.damage_allowed_kgs_ton || 0,
        cargoPer: completeFormData.cargo || 0,
        selectedTallyCompany: completeTallyData.selectedTallyCompany || 'Default Company'
      };
    }

    //console.log('Complete Tally Data prepared:', completeTallyData);

    // Generate XML for Tally
    let tallyXmlString;
    try {
      const tallyXmlObject = getPurchaseOrderTallyXmlObject(completeTallyData);
      tallyXmlString = create(tallyXmlObject).end({ 
        prettyPrint: false, 
        indent: '', 
        newline: '' 
      });
    } catch (xmlError) {
      console.error('XML generation error:', xmlError);
      return NextResponse.json({
        success: false,
        error: `Failed to generate XML for Tally: ${xmlError.message}`
      }, { status: 500 });
    }

    console.log('Generated Tally XML (API):\n', tallyXmlString);

    // Post to TallyPrime
    try {
      const tallyEndpoint = process.env.TALLY_ENDPOINT || 'http://localhost:9000';
      
      const tallyResponse = await fetch(tallyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
        },
        body: tallyXmlString,
      });

      const tallyResponseText = await tallyResponse.text();
      console.log('Tally Response:', tallyResponseText);

      if (!tallyResponse.ok) {
        throw new Error(`Tally returned status ${tallyResponse.status}`);
      }

      // Check if Tally response indicates success
      const isSuccessResponse = tallyResponseText.includes('<CREATED>') || 
                               tallyResponseText.includes('1') ||
                               !tallyResponseText.includes('<ERROR>');

      if (!isSuccessResponse) {
        throw new Error('Tally returned an error response');
      }

      // Update the purchase order in Supabase using the sb client
      const { error: updateError } = await sb
        .from('purchase_orders')
        .update({
          tally_posted: true,
          tally_posted_at: new Date().toISOString(),
          tally_response: tallyResponseText
        })
        .eq('id', purchaseOrderId);

      if (updateError) {
        console.warn('Failed to update PO with Tally status:', updateError);
        // Continue despite update error
      }

      return NextResponse.json({
        success: true,
        message: 'Purchase Order posted to TallyPrime successfully',
        tallyResponse: tallyResponseText,
        purchaseOrderId: purchaseOrderId
      });

    } catch (tallyPostError) {
      console.error('Tally posting error:', tallyPostError);
      return NextResponse.json({
        success: false,
        error: `Failed to post to TallyPrime: ${tallyPostError.message}`,
        tallyRawResponse: tallyPostError.response?.text() || 'Connection failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: `Internal server error: ${error.message}`
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to submit purchase orders to Tally.'
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to submit purchase orders to Tally.'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to submit purchase orders to Tally.'
  }, { status: 405 });
}