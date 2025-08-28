// app/api/tally-companies/route.js
import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

const TALLY_API_URL = process.env.TALLY_API_URL || "http://localhost:9000";

export async function GET() {
  console.log('Tally API URL:', TALLY_API_URL); // Debug log
  
  if (!TALLY_API_URL) {
    console.error('TALLY_API_URL environment variable is not set');
    return NextResponse.json({ 
      companies: [], 
      error: 'TALLY_API_URL environment variable is not configured' 
    }, { status: 500 });
  }

  const xmlPayload = `
    <ENVELOPE>
        <HEADER>
            <VERSION>1</VERSION>
            <TALLYREQUEST>EXPORT</TALLYREQUEST>
            <TYPE>COLLECTION</TYPE>
            <ID>ListOfCompanies</ID>
        </HEADER>
        <BODY>
            <DESC>
                <STATICVARIABLES>
                    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                </STATICVARIABLES>
                <TDL>
                    <TDLMESSAGE>
                        <COLLECTION Name='ListOfCompanies'>
                            <TYPE>Company</TYPE>
                            <FETCH>Name,CompanyNumber</FETCH>
                        </COLLECTION>
                    </TDLMESSAGE>
                </TDL>
            </DESC>
        </BODY>
    </ENVELOPE>
  `.trim();

  try {
    console.log('Sending request to Tally API...'); // Debug log
    
    const response = await fetch(TALLY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml',
      },
      body: xmlPayload,
      signal: AbortSignal.timeout(15000) // Increased timeout
    });

    console.log('Response status:', response.status); // Debug log

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tally API error response:', errorText);
      throw new Error(`TallyPrime API error: ${response.status} - ${response.statusText} - ${errorText}`);
    }

    const xmlResponse = await response.text();
    console.log("Raw Tally Companies XML Response:", xmlResponse.substring(0, 500) + '...'); // Truncated log

    if (!xmlResponse || xmlResponse.trim() === '') {
      throw new Error('Empty response from Tally API');
    }

    const result = await parseStringPromise(xmlResponse, { 
      explicitArray: false, 
      mergeAttrs: true,
      trim: true,
      normalize: true
    });
    
    console.log("Parsed XML structure keys:", Object.keys(result?.ENVELOPE?.BODY || {}));

    // More robust path checking
    const companiesData = result?.ENVELOPE?.BODY?.DATA?.COLLECTION?.COMPANY;
    console.log("Companies data found:", !!companiesData);

    let companyList = [];

    if (companiesData) {
      // Ensure companiesData is always an array for consistent processing
      const companiesArray = Array.isArray(companiesData) ? companiesData : [companiesData];
      console.log("Number of companies found:", companiesArray.length);

      companyList = companiesArray.map((c, index) => {
        let companyName = '';
        
        // Enhanced name extraction with better error handling
        try {
          if (Array.isArray(c.NAME) && c.NAME.length > 0) {
            // The first element is the clean string from the attribute
            companyName = typeof c.NAME[0] === 'string' ? c.NAME[0] : '';
            // If first element is not a string, try the second element's text content
            if (!companyName && c.NAME[1] && typeof c.NAME[1] === 'object' && c.NAME[1]._ !== undefined) {
              companyName = c.NAME[1]._;
            }
          } else if (typeof c.NAME === 'string') {
            // Case where NAME is a simple string
            companyName = c.NAME;
          } else if (typeof c.NAME === 'object' && c.NAME !== null && c.NAME._ !== undefined) {
            // Case where NAME is an object with text content
            companyName = c.NAME._;
          }
        } catch (nameError) {
          console.error(`Error extracting name for company ${index}:`, nameError);
        }

        // Extract company number with better error handling
        let companyNum = '';
        try {
          if (c.COMPANYNUMBER) {
            if (typeof c.COMPANYNUMBER === 'string') {
              companyNum = c.COMPANYNUMBER;
            } else if (typeof c.COMPANYNUMBER === 'object' && c.COMPANYNUMBER !== null && c.COMPANYNUMBER._ !== undefined) {
              companyNum = c.COMPANYNUMBER._;
            }
          }
        } catch (numError) {
          console.error(`Error extracting company number for company ${index}:`, numError);
        }

        const company = {
          name: companyName ? companyName.trim() : '',
          companyNumber: companyNum ? companyNum.trim() : ''
        };

        console.log(`Company ${index}:`, company); // Debug individual companies
        return company;
      });
    } else {
      console.log("No companies data found in response structure");
      // Log the actual structure for debugging
      console.log("Available data structure:", JSON.stringify(result?.ENVELOPE?.BODY, null, 2));
    }
    
    const filteredCompanyList = companyList.filter(c => c.name && c.name.trim() !== '');
    console.log("Final filtered company count:", filteredCompanyList.length);

    return NextResponse.json({ companies: filteredCompanyList });

  } catch (error) {
    console.error('Error fetching Tally companies:', error);
    
    // More detailed error response
    const errorResponse = {
      companies: [],
      error: error.message || 'Failed to fetch Tally companies',
      details: {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}