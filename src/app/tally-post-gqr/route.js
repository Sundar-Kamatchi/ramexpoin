import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This API route finalizes a GQR, posts to Tally, and updates the DB.
export async function POST(request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  
  try {
    const { gqrId, decision, amount, supplierName, gqrVoucherNumber } = await request.json();

    let tallyXmlObject;

    if (decision === 'payment') {
      // Construct Tally XML for a Payment Voucher
      tallyXmlObject = { /* ... your TALLY PAYMENT XML object ... */ };
      console.log(`Generating Payment Voucher for GQR-${gqrId} of amount ${amount}`);

    } else if (decision === 'debit_note') {
      // Construct Tally XML for a Debit Note
      tallyXmlObject = { /* ... your TALLY DEBIT NOTE XML object ... */ };
      console.log(`Generating Debit Note for GQR-${gqrId} of amount ${amount}`);

    } else {
      return NextResponse.json({ success: false, error: 'Invalid decision' }, { status: 400 });
    }

    // TODO: Send the 'tallyXmlObject' to your Tally server via a fetch call
    // const tallyResponse = await fetch('http://localhost:9000', { ... });
    // if (!tallyResponse.ok) throw new Error('Tally post failed');
    
    // If Tally post is successful, update the GQR status in Supabase
    const { error: updateError } = await supabase
      .from('gqr_entry')
      .update({ 
        status: `Finalized - ${decision}`,
        finalized_at: new Date().toISOString() 
      })
      .eq('id', gqrId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: `GQR finalized successfully as a ${decision}.` });

  } catch (error) {
    console.error('GQR Finalization Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}