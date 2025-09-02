// src/app/api/gqr-data/update-status/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const body = await request.json();
    const { gqrId, isPosted } = body;

    if (gqrId === undefined || isPosted === undefined) {
      return NextResponse.json({
        success: false,
        error: 'GQR ID and isPosted status are required'
      }, { status: 400 });
    }

    // Update the GQR entry in Supabase
    const { error: updateError } = await supabase
      .from('gqr_entry')
      .update({
        is_tally_posted: isPosted,
        updated_at: new Date().toISOString()
      })
      .eq('id', gqrId);

    if (updateError) {
      console.error('Error updating GQR status:', updateError);
      return NextResponse.json({
        success: false,
        error: `Failed to update GQR status: ${updateError.message}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `GQR ${gqrId} tally posted status updated to ${isPosted}`,
      gqrId: gqrId,
      isTallyPosted: isPosted
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
