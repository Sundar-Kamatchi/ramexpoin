import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Make sure this path is correct
import { AlertCircle, CheckCircle, Send, Loader2 } from 'lucide-react';

/**
 * Builds a valid Tally-compatible XML string for a Purchase Order.
 * @param {object} data - The data for the purchase order.
 * @returns {string} - The complete XML envelope string.
 */
const buildTallyPurchaseOrderXml = (data) => {
  // Escape special XML characters in data
  const escapeXml = (unsafe) => {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  };

  return `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(data.companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase Order" ACTION="Create">
            <DATE>${data.poDate}</DATE>
            <GUID>${data.voucherGuid}</GUID>
            <VOUCHERTYPENAME>Purchase Order</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(data.vouchernumber)}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${escapeXml(data.supplierName)}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Order Details</PERSISTEDVIEW>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(data.supplierName)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>-${data.itemAmount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Purchase Account</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>${data.itemAmount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLINVENTORYENTRIES.LIST>
              <STOCKITEMNAME>${escapeXml(data.itemName)}</STOCKITEMNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <RATE>${data.rate}/${data.alternativeUnit}</RATE>
              <AMOUNT>${data.itemAmount}</AMOUNT>
              <ACTUALQTY>${data.quantity} ${data.primaryUnit}</ACTUALQTY>
              <BILLEDQTY>${data.quantity} ${data.primaryUnit}</BILLEDQTY>
              <BATCHALLOCATIONS.LIST>
                <GODOWNNAME>Main Location</GODOWNNAME>
                <BATCHNAME>${escapeXml(data.vouchernumber)}</BATCHNAME>
                <ORDERDUEDATE>${data.orderDueDate}</ORDERDUEDATE>
                <BILLEDQTY>${data.quantity} ${data.primaryUnit}</BILLEDQTY>
                <ACTUALQTY>${data.quantity} ${data.primaryUnit}</ACTUALQTY>
              </BATCHALLOCATIONS.LIST>
            </ALLINVENTORYENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
  `;
};

const TallyPurchaseOrderComponent = ({
  purchaseOrderId,
  companyName = "Ramasamy Exports & Imports Pvt.Ltd [22 - 23]",
  apiUrl,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const TALLY_API_URL = apiUrl || '/api/tally-post-po'; // Point to your own API route

  const handlePostToTally = async () => {
    if (!purchaseOrderId) {
      setResponse({ success: false, error: 'Purchase Order ID is missing.' });
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      // 1. Fetch Purchase Order details from Supabase (Real Query)
      const { data: purchaseOrder, error: poError } = await supabase
        .from('purchase_orders')
        .select(`*, suppliers(name), item_master(item_name, hsn_code, item_unit)`)
        .eq('id', purchaseOrderId)
        .single();

      if (poError || !purchaseOrder) {
        throw new Error(poError?.message || 'Purchase Order not found in the database.');
      }

      // 2. Prepare data for the XML template
      const primaryUnit = purchaseOrder.item_master?.item_unit || 'Nos';
      const quantityInPrimaryUnit = purchaseOrder.quantity || 0;
      const ratePerAlternativeUnit = purchaseOrder.rate || 0;
      // This calculation assumes MT to Kgs conversion. Adjust if needed.
      const calculatedItemAmount = (quantityInPrimaryUnit * 1000 * ratePerAlternativeUnit).toFixed(2);
      const poDateObj = new Date(purchaseOrder.date);

      const templateData = {
        companyName,
        vouchernumber: purchaseOrder.vouchernumber || purchaseOrder.id.toString(),
        poDate: poDateObj.toISOString().slice(0, 10).replace(/-/g, ''), // YYYYMMDD
        voucherGuid: crypto.randomUUID(),
        supplierName: purchaseOrder.suppliers?.name || 'Unknown Supplier',
        itemName: purchaseOrder.item_master?.item_name || 'Unknown Item',
        primaryUnit,
        alternativeUnit: 'Kgs', // Assuming alternative unit is always Kgs
        quantity: quantityInPrimaryUnit,
        rate: ratePerAlternativeUnit,
        itemAmount: calculatedItemAmount,
        orderDueDate: poDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-'), // e.g., 24-Jul-25
      };

      // 3. Build the valid Tally XML string
      const tallyXml = buildTallyPurchaseOrderXml(templateData);

      // 4. Send XML to your own API route, which then forwards it to Tally
      const apiResponse = await fetch(TALLY_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: tallyXml,
      });

      const responseText = await apiResponse.text();

      if (!apiResponse.ok) {
        throw new Error(`API Error: ${responseText}`);
      }
      
      const successResponse = {
        success: true,
        message: 'Data successfully posted to Tally!',
        tallyRawResponse: responseText,
      };
      setResponse(successResponse);
      if (onSuccess) onSuccess(successResponse);

    } catch (error) {
      console.error('Error posting to Tally:', error);
      const errorResponse = {
        success: false,
        error: 'Failed to post to Tally.',
        details: error.message,
      };
      setResponse(errorResponse);
      if (onError) onError(errorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold text-lg mb-4">Tally Integration</h3>
        <button
            onClick={handlePostToTally}
            disabled={isLoading}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : (
                <><Send className="w-5 h-5" /> Post Purchase Order to Tally</>
            )}
        </button>

        {response && (
            <div className={`mt-4 p-4 rounded-lg border ${response.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2">
                    {response.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                    <h4 className={`font-semibold ${response.success ? 'text-green-800' : 'text-red-800'}`}>
                        {response.success ? 'Success' : 'Error'}
                    </h4>
                </div>
                <p className={`mt-1 text-sm ${response.success ? 'text-green-700' : 'text-red-700'}`}>
                    {response.message || response.error}
                </p>
                {response.details && <p className="text-xs text-gray-600 mt-2"><strong>Details:</strong> {response.details}</p>}
                {response.tallyRawResponse && (
                    <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Tally Raw Response:</p>
                        <pre className="text-xs bg-gray-100 p-2 rounded border overflow-x-auto">{response.tallyRawResponse}</pre>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default TallyPurchaseOrderComponent;