// nextjs-app/app/api/tally-status/route.ts
import { NextResponse } from 'next/server';

// TallyPrime's default API port
const TALLY_API_URL = process.env.TALLY_API_URL;

export async function GET() {
  try {
    // Attempt a simple GET request to check TallyPrime status
    // TallyPrime usually responds with plain text like 'Running'
    const response = await fetch(TALLY_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
      },
      // Add a timeout to prevent hanging if Tally isn't responsive
      signal: AbortSignal.timeout(5000) // 5 seconds timeout
    });

    if (response.ok) {
      const text = await response.text();
      if (text.includes('Running')) {
        return NextResponse.json({ status: 'Running' });
      }
    }
    // If not OK or doesn't include 'Running', assume not running
    return NextResponse.json({ status: 'Not Running' });

  } catch (error) {
    // Handle network errors (e.g., TallyPrime not open, connection refused)
    if (error.name === 'AbortError') {
      return NextResponse.json({ status: 'Timeout', message: 'TallyPrime connection timed out.' });
    }
    if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({ status: 'Not Running', message: 'Connection refused. TallyPrime might not be open.' });
    }
    console.error('Error fetching Tally status:', error);
    return NextResponse.json({ status: 'Error', message: error.message || 'Unknown error checking Tally status' });
  }
}