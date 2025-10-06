import React from 'react';
import { formatDateDDMMYYYY } from '@/utils/dateUtils';

export const GQRPrint = ({ gqrData, actualCalculations, estimatedCalculations, adjustableDamageAllowed }) => {
  if (!gqrData) {
    return <div className="p-8 text-center">Loading print data...</div>;
  }
  
  const totalWastage = (gqrData.rot_weight || 0) + (gqrData.doubles_weight || 0) + (gqrData.sand_weight || 0) + (gqrData.weight_shortage_weight || gqrData.weight_shortage || 0);
  const finalRate = gqrData.volatile_po_rate ?? gqrData.rate ?? 0;
  const finalWastage = gqrData.volatile_wastage_kgs_per_ton ?? 0;
  const netWt = Number(actualCalculations?.totalCargo || 0);

  return (
    <>
      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          .print-container {
            height: 100vh !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            font-size: 10px !important;
            line-height: 1.2 !important;
            padding: 8px !important;
            margin: 0 !important;
          }
          .print-container * {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
      <div className="print-container bg-white text-black font-sans" style={{ 
        fontSize: '10px', 
        lineHeight: '1.2',
        padding: '8px',
        margin: '0',
        height: '100vh',
        overflow: 'hidden',
        pageBreakInside: 'avoid'
      }}>
      {/* Header - Better spacing */}
      <div className="text-center" style={{ marginBottom: '12px', marginTop: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
          <img src="/ramlogo.png" alt="Company Logo" style={{ width: '30px', height: '30px', marginRight: '8px' }} />
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: 'black', margin: '0' }}>
            Ramsamy Exports & Import Pvt Ltd
          </h1>
        </div>
        <h2 style={{ fontSize: '14px', fontWeight: 'semibold', margin: '0' }}>Goods Quality Report (GQR)</h2>
      </div>

      {/* PO Details + Office Info side-by-side (each 50%) */}
      <div style={{ marginBottom: '8px', display: 'flex', gap: '6px' }}>
        {/* PO Details */}
        <div style={{ padding: '4px', border: '1px solid black', borderRadius: '2px', width: '50%', fontSize: '9px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
            <span><strong>Item:</strong> {gqrData.item_name || 'N/A'}</span>
            <span><strong>Supplier:</strong> {gqrData.supplier_name}</span>
            <span><strong>PO Date:</strong> {gqrData.po_date ? formatDateDDMMYYYY(gqrData.po_date) : 'N/A'}</span>
            <span><strong>PO Rate:</strong> ₹{gqrData.po_rate?.toFixed(2) || gqrData.rate?.toFixed(2) || '0.00'}</span>
            <span><strong>Podi Rate:</strong> ₹{gqrData.podi_rate?.toFixed(2) || '0.00'}</span>
            <span><strong>PO Quantity:</strong> {gqrData.po_quantity || 0} MT</span>
            <span><strong>Wastage Allowed:</strong> {gqrData.damage_allowed_kgs_ton || 'N/A'} kgs/ton</span>
            <span><strong>Assured Cargo:</strong> {gqrData.cargo || gqrData.assured_cargo_percent || 'N/A'}%</span>
          </div>
        </div>
        {/* Office Info */}
        <div style={{ padding: '4px', border: '1px solid black', borderRadius: '2px', width: '50%', fontSize: '9px' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '3px' }}>Final Settlement</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
            <span><strong>Supplier:</strong></span>
            <span>{gqrData.supplier_name || 'N/A'}</span>
            <span><strong>GR No:</strong></span>
            <span>{gqrData.gr_no} / {formatDateDDMMYYYY(gqrData.gr_dt)}</span>
            <span><strong>Final Rate:</strong></span>
            <span>₹{Number(finalRate).toFixed(2)}</span>
            <span><strong>Final Wastage:</strong></span>
            <span>{Number(finalWastage).toFixed(2)} kgs/ton</span>
            <span><strong>Net Wt:</strong></span>
            <span>{netWt.toFixed(2)} kgs</span>
          </div>
        </div>
      </div>
      
      {/* Final Parameters */}
      <div style={{ marginBottom: '6px', padding: '4px', border: '1px solid black', borderRadius: '2px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '9px' }}>
            <span><strong>Final Rate:</strong> ₹{gqrData.volatile_po_rate || gqrData.rate}</span>
            <span><strong>Final Podi Rate:</strong> ₹{gqrData.volatile_podi_rate || gqrData.podi_rate}</span>
            <span><strong>Final Wastage:</strong> {gqrData.volatile_wastage_kgs_per_ton || adjustableDamageAllowed} kgs/ton</span>
        </div>
      </div>
      
      {/* Weight Details */}
      <div style={{ marginBottom: '6px', padding: '4px', border: '1px solid black', borderRadius: '2px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', fontSize: '9px' }}>
          <div><strong>Net Wt:</strong> {actualCalculations.totalCargo.toFixed(2)}</div>
          <div><strong>Export:</strong> {actualCalculations.exportQuality.toFixed(2)}</div>
          <div><strong>Podi:</strong> {actualCalculations.podiKgs.toFixed(2)}</div>
          <div><strong>Gap Items:</strong> {actualCalculations.gapKgs.toFixed(2)}</div>
          <div></div> {/* Empty cell */}
          <div><strong>ROT:</strong> {gqrData.rot_weight || 0}</div>
          <div><strong>Doubles:</strong> {gqrData.doubles_weight || 0}</div>
          <div><strong>Sand:</strong> {gqrData.sand_weight || 0}</div>
          <div><strong>Weight Shortage:</strong> {gqrData.weight_shortage_weight || gqrData.weight_shortage || 0}</div>
          <div><strong>Total Wastage:</strong> {totalWastage.toFixed(2)}</div>
        </div>
      </div>

      {/* Final Report Table */}
      <div style={{ flexGrow: 1, marginBottom: '6px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', textAlign: 'center' }}>Final Report</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '8px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left' }}>DESCRIPTION</th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>CALCULATED (20MT)</th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>ACTUAL</th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>DIFFERENCE</th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>TOTAL DIFFERENCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid black', padding: '2px', fontWeight: '600' }}>TOTAL RATE AFTER PODI & GAP ITEMS PKG</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>₹{estimatedCalculations.totalCargoAfterPodiRate.toFixed(2)}</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>₹{actualCalculations.totalCargoAfterPodiAndGapRate.toFixed(2)}</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>₹{(estimatedCalculations.totalCargoAfterPodiRate - actualCalculations.totalCargoAfterPodiAndGapRate).toFixed(2)}</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>-</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '2px', fontWeight: '600' }}>TOTAL RATE AFTER PODI & GAP ITEMS PMT</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>₹{(estimatedCalculations.totalCargoAfterPodiRate * 1000).toFixed(2)}</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>₹{(actualCalculations.totalCargoAfterPodiAndGapRate * 1000).toFixed(2)}</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>₹{Math.round((estimatedCalculations.totalCargoAfterPodiRate * 1000) - (actualCalculations.totalCargoAfterPodiAndGapRate * 1000))}</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>₹{Math.round((actualCalculations.totalCargoAfterPodiAndGapKgs * ((estimatedCalculations.totalCargoAfterPodiRate * 1000) - (actualCalculations.totalCargoAfterPodiAndGapRate * 1000))) / 1000).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '2px', fontWeight: '600' }}>PODI & CARGO ITEMS %</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{((estimatedCalculations.podiKgs / estimatedCalculations.totalCargo) * 100).toFixed(2)}%</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{(((actualCalculations.podiKgs + actualCalculations.gapKgs) / actualCalculations.totalCargo) * 100).toFixed(2)}%</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{(((estimatedCalculations.podiKgs / estimatedCalculations.totalCargo) * 100) - (((actualCalculations.podiKgs + actualCalculations.gapKgs) / actualCalculations.totalCargo) * 100)).toFixed(2)}%</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>-</td>
            </tr>
            <tr style={{ borderTop: '2px solid black' }}>
              <td style={{ border: '1px solid black', padding: '2px', fontWeight: '600' }}>WASTAGE KGS PMT</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{gqrData.volatile_wastage_kgs_per_ton || adjustableDamageAllowed}</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{Math.round(actualCalculations.totalCargo > 0 ? ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 1000) : 0)}</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>-{Math.abs(Math.round((gqrData.volatile_wastage_kgs_per_ton || adjustableDamageAllowed) - (actualCalculations.totalCargo > 0 ? ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 1000) : 0)))}</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>₹{(Math.round((gqrData.volatile_wastage_kgs_per_ton || adjustableDamageAllowed) - (actualCalculations.totalCargo > 0 ? ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 1000) : 0)) * (actualCalculations.totalCargo / 1000) * actualCalculations.totalCargoAfterPodiAndGapRate).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '2px', fontWeight: '600' }}>WASTAGE %</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{((estimatedCalculations.wastageKgs / estimatedCalculations.totalCargo) * 100).toFixed(2)}%</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 100).toFixed(2)}%</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{(((estimatedCalculations.wastageKgs / estimatedCalculations.totalCargo) * 100) - ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 100)).toFixed(2)}%</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>-</td>
            </tr>
            <tr style={{ borderTop: '2px solid black', backgroundColor: '#f0f0f0' }}>
              <td style={{ border: '1px solid black', padding: '2px', fontWeight: 'bold', textAlign: 'center' }}>TOTAL</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold' }}>-</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold' }}>-</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold' }}>-</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold' }}>₹{(Math.round((actualCalculations.totalCargoAfterPodiAndGapKgs * ((estimatedCalculations.totalCargoAfterPodiRate * 1000) - (actualCalculations.totalCargoAfterPodiAndGapRate * 1000))) / 1000) + (Math.round((gqrData.volatile_wastage_kgs_per_ton || adjustableDamageAllowed) - (actualCalculations.totalCargo > 0 ? ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 1000) : 0)) * (actualCalculations.totalCargo / 1000) * actualCalculations.totalCargoAfterPodiAndGapRate)).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Section */}
      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #ccc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', textAlign: 'center' }}>
          <div>
            <p style={{ fontWeight: '600', margin: '0' }}>Prepared by</p>
          </div>
          <div>
            <p style={{ fontWeight: '600', margin: '0' }}>Checked by</p>
          </div>
          <div>
            <p style={{ fontWeight: '600', margin: '0' }}>Authorised Signatory</p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

GQRPrint.displayName = 'GQRPrint';