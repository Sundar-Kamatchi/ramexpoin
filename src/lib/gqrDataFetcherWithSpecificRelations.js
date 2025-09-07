// Alternative GQR data fetching using specific relationship names
// This uses the exact relationship names from the Supabase error details

import { supabase } from './supabaseClient';

export const fetchGQRWithSpecificRelations = async (gqrId) => {
  try {
    console.log('GQR Fetcher (Specific Relations): Fetching GQR data for ID:', gqrId);
    
    // Try with the relationship name: gqr_entry_pre_gr_id_fkey (using pre_gr_id column)
    console.log('GQR Fetcher: Trying with gqr_entry_pre_gr_id_fkey...');
    const result1 = await supabase
      .from('gqr_entry')
      .select(`
        *,
        pre_gr_entry!gqr_entry_pre_gr_id_fkey (
          *,
          purchase_orders (
            *,
            suppliers ( name ),
            item_master ( item_name )
          )
        )
      `)
      .eq('id', gqrId)
      .single();
    
    if (result1.error) {
      console.error('GQR Fetcher: gqr_entry_pre_gr_id_fkey failed:', result1.error);
      throw result1.error;
    }
    
    console.log('GQR Fetcher: gqr_entry_pre_gr_id_fkey successful');
    return result1.data;
    
  } catch (error) {
    console.error('GQR Fetcher (Specific Relations): Error fetching GQR data:', error);
    throw error;
  }
};

export const fetchGQRListWithSpecificRelations = async () => {
  try {
    console.log('GQR Fetcher (Specific Relations): Fetching GQR list...');
    
    // Try with the relationship name: gqr_entry_pre_gr_id_fkey (using pre_gr_id column)
    console.log('GQR Fetcher: Trying with gqr_entry_pre_gr_id_fkey...');
    const result1 = await supabase
      .from('gqr_entry')
      .select(`
        id,
        created_at,
        total_value_received,
        pre_gr_entry!gqr_entry_pre_gr_id_fkey (
          gr_no,
          gr_dt,
          purchase_orders (
            vouchernumber,
            date,
            suppliers ( name )
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    if (result1.error) {
      console.error('GQR Fetcher: gqr_entry_pre_gr_id_fkey failed:', result1.error);
      throw result1.error;
    }
    
    console.log('GQR Fetcher: gqr_entry_pre_gr_id_fkey successful');
    return result1.data;
    
  } catch (error) {
    console.error('GQR Fetcher (Specific Relations): Error fetching GQR list:', error);
    throw error;
  }
};
