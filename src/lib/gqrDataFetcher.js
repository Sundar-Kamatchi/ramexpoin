// Production-safe GQR data fetching utility
// This avoids relationship ambiguity issues by using separate queries

import { supabase } from './supabaseClient';

export const fetchGQRWithRelationships = async (gqrId) => {
  try {
    console.log('GQR Fetcher: Fetching GQR data for ID:', gqrId);
    
    // Step 1: Fetch GQR entry
    const { data: gqrData, error: gqrError } = await supabase
      .from('gqr_entry')
      .select('id, created_at, total_value_received, export_quality_weight, podi_weight, rot_weight, doubles_weight, sand_weight, gap_items_weight, weight_shortage_weight, gqr_status, pre_gr_id')
      .eq('id', gqrId)
      .single();

    if (gqrError) {
      console.error('GQR Fetcher: GQR query failed:', gqrError);
      throw gqrError;
    }

    if (!gqrData) {
      throw new Error('GQR not found');
    }

    console.log('GQR Fetcher: Found GQR data:', gqrData);

    // Step 2: Fetch Pre-GR entry
    const preGrId = gqrData.pre_gr_id;
    console.log('GQR Fetcher: Found Pre-GR ID:', preGrId);
    
    if (!preGrId) {
      console.warn('GQR Fetcher: No Pre-GR ID found');
      return {
        ...gqrData,
        pre_gr_entry: {
          gr_no: 'N/A',
          gr_dt: null,
          purchase_orders: {
            vouchernumber: 'N/A',
            date: null,
            suppliers: { name: 'N/A' }
          }
        }
      };
    }

    const { data: preGrData, error: preGrError } = await supabase
      .from('pre_gr_entry')
      .select('*')
      .eq('id', preGrId)
      .single();

    if (preGrError) {
      console.error('GQR Fetcher: Pre-GR query failed:', preGrError);
      // Return GQR data with minimal Pre-GR info
      return {
        ...gqrData,
        pre_gr_entry: {
          gr_no: 'N/A',
          gr_dt: null,
          purchase_orders: {
            vouchernumber: 'N/A',
            date: null,
            suppliers: { name: 'N/A' }
          }
        }
      };
    }

    console.log('GQR Fetcher: Found Pre-GR data:', preGrData);

    // Step 3: Fetch Purchase Order
    const poId = preGrData.po_id;
    let purchaseOrderData = null;

    if (poId) {
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers ( name ),
          item_master ( item_name )
        `)
        .eq('id', poId)
        .single();

      if (!poError && poData) {
        purchaseOrderData = poData;
        console.log('GQR Fetcher: Found Purchase Order data:', poData);
      } else {
        console.warn('GQR Fetcher: Purchase Order query failed:', poError);
      }
    }

    // Step 4: Combine the data
    const result = {
      ...gqrData,
      pre_gr_entry: {
        ...preGrData,
        purchase_orders: purchaseOrderData || {
          vouchernumber: 'N/A',
          date: null,
          suppliers: { name: 'N/A' },
          item_master: { item_name: 'N/A' }
        }
      }
    };

    console.log('GQR Fetcher: Combined result:', result);
    return result;

  } catch (error) {
    console.error('GQR Fetcher: Error fetching GQR data:', error);
    throw error;
  }
};

export const fetchGQRListWithRelationships = async () => {
  try {
    console.log('GQR Fetcher: Fetching GQR list...');
    
    // Step 1: Fetch all GQR entries
    const { data: gqrData, error: gqrError } = await supabase
      .from('gqr_entry')
      .select('id, created_at, total_value_received, pre_gr_id, gqr_status')
      .order('created_at', { ascending: false });

    if (gqrError) {
      console.error('GQR Fetcher: GQR list query failed:', gqrError);
      throw gqrError;
    }

    if (!gqrData || gqrData.length === 0) {
      console.log('GQR Fetcher: No GQR entries found');
      return [];
    }

    console.log('GQR Fetcher: Found', gqrData.length, 'GQR entries');

    // Step 2: Fetch Pre-GR entries
    const preGrIds = gqrData.map(gqr => gqr.pre_gr_id).filter(id => id);
    console.log('GQR Fetcher: Found Pre-GR IDs:', preGrIds);
    
    if (preGrIds.length === 0) {
      return gqrData.map(item => ({
        ...item,
        pre_gr_entry: {
          gr_no: 'N/A',
          gr_dt: null,
          purchase_orders: {
            vouchernumber: 'N/A',
            date: null,
            suppliers: { name: 'N/A' }
          }
        }
      }));
    }

    const { data: preGrData, error: preGrError } = await supabase
      .from('pre_gr_entry')
      .select('id, gr_no, gr_dt, po_id')
      .in('id', preGrIds);

    if (preGrError) {
      console.error('GQR Fetcher: Pre-GR list query failed:', preGrError);
      return gqrData.map(item => ({
        ...item,
        pre_gr_entry: {
          gr_no: 'N/A',
          gr_dt: null,
          purchase_orders: {
            vouchernumber: 'N/A',
            date: null,
            suppliers: { name: 'N/A' }
          }
        }
      }));
    }

    // Step 3: Fetch Purchase Orders
    const poIds = preGrData.map(pg => pg.po_id).filter(id => id);
    let purchaseOrdersData = [];
    
    if (poIds.length > 0) {
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          vouchernumber,
          date,
          suppliers ( name )
        `)
        .in('id', poIds);
      
      if (!poError && poData) {
        purchaseOrdersData = poData;
      }
    }

    // Step 4: Join the data
    const result = gqrData.map(gqr => {
      const preGr = preGrData.find(pg => pg.id === gqr.pre_gr_id);
      const po = preGr ? purchaseOrdersData.find(p => p.id === preGr.po_id) : null;
      
      return {
        ...gqr,
        pre_gr_entry: preGr ? {
          ...preGr,
          purchase_orders: po || {
            vouchernumber: 'N/A',
            date: null,
            suppliers: { name: 'N/A' }
          }
        } : {
          gr_no: 'N/A',
          gr_dt: null,
          purchase_orders: {
            vouchernumber: 'N/A',
            date: null,
            suppliers: { name: 'N/A' }
          }
        }
      };
    });

    console.log('GQR Fetcher: GQR list result:', result);
    return result;

  } catch (error) {
    console.error('GQR Fetcher: Error fetching GQR list:', error);
    throw error;
  }
};
