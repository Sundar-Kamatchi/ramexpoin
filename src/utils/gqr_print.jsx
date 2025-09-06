import React from 'react';
import { formatDateDDMMYYYY } from '@/utils/dateUtils';

export const GQRPrint = ({ gqrData, actualCalculations, estimatedCalculations, adjustableDamageAllowed }) => {
  if (!gqrData) {
    return <div className="p-8 text-center">Loading print data...</div>;
  }
  
  const totalWastage = (gqrData.rot_weight || 0) + (gqrData.doubles_weight || 0) + (gqrData.sand_weight || 0) + (gqrData.weight_shortage_weight || 0);
  const finalRate = (gqrData.volatile_po_rate ?? gqrData.rate) ?? 0;
  const finalWastage = (gqrData.volatile_wastage_kgs_per_ton ?? adjustableDamageAllowed) ?? 0;
  const netWt = Number(actualCalculations?.totalCargo || 0);

  return (
    <div className="print-container bg-white text-black p-2 font-sans" style={{ fontSize: '10px', lineHeight: '1.2' }}>
      {/* Header */}
      <div className="text-center mb-3">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
          <img src="/ramlogo.png" alt="Company Logo" style={{ width: '30px', height: '30px', marginRight: '8px' }} />
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: 'black', margin: '0' }}>
            Ramsamy Exports & Import Pvt Ltd
          </h1>
        </div>
        <h2 className="text-md font-semibold" style={{ margin: '0' }}>Goods Quality Report (GQR)</h2>
      </div>

      {/* PO Details + Office Info side-by-side (each 50%) */}
      <div className="mb-2 flex gap-2">
        {/* PO Details */}
        <div className="p-1 border border-black rounded w-1/2" style={{ fontSize: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div className="grid grid-cols-2 gap-x-4">
            <span><strong>Item:</strong> {gqrData.item_name || 'N/A'}</span>
            <span><strong>Supplier:</strong> {gqrData.supplier_name}</span>
            <span><strong>GR No:</strong> {gqrData.gr_no} / {formatDateDDMMYYYY(gqrData.gr_dt)}</span>
            <span><strong>PO Rate:</strong> ₹{gqrData.rate?.toFixed(2) || '0.00'}</span>
            <span><strong>Podi Rate:</strong> ₹{gqrData.podi_rate?.toFixed(2) || '0.00'}</span>
            <span><strong>Wastage Allowed:</strong> {gqrData.damage_allowed_kgs_ton || 'N/A'} kgs/ton</span>
            <span><strong>Assured Cargo:</strong> {gqrData.assured_cargo_percent || 'N/A'}%</span>
          </div>
        </div>
        {/* Office Info */}
        <div className="p-1 border border-black rounded w-1/2" style={{ fontSize: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div className="text-center font-bold mb-1">Final Settlement</div>
          <div className="grid grid-cols-2 gap-x-2">
            <span><strong>Supplier:</strong></span>
            <span>{gqrData.supplier_name || 'N/A'}</span>
            <span><strong>GR No:</strong></span>
            <span>{gqrData.gr_no || 'N/A'}</span>
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
      <div className="mb-2 p-1 border border-black rounded">
        <div className="grid grid-cols-3 gap-x-4" style={{ fontSize: '10px' }}>
            <span><strong>Final Rate:</strong> ₹{gqrData.volatile_po_rate || gqrData.rate}</span>
            <span><strong>Final Podi Rate:</strong> ₹{gqrData.volatile_podi_rate || gqrData.podi_rate}</span>
            <span><strong>Final Wastage:</strong> {gqrData.volatile_wastage_kgs_per_ton || adjustableDamageAllowed} kgs/ton</span>
        </div>
      </div>
      
      {/* Weight Details */}
      <div className="mb-2 p-1 border border-black rounded">
        <div className="grid grid-cols-5 gap-x-4" style={{ fontSize: '10px' }}>
          <div><strong>Net Wt:</strong> {actualCalculations.totalCargo.toFixed(2)}</div>
          <div><strong>Export:</strong> {actualCalculations.exportQuality.toFixed(2)}</div>
          <div><strong>Podi:</strong> {actualCalculations.podiKgs.toFixed(2)}</div>
          <div><strong>Gap Items:</strong> {actualCalculations.gapKgs.toFixed(2)}</div>
          <div><strong>Total Wastage:</strong> {totalWastage.toFixed(2)}</div>
          <div></div> {/* Spacer */}
          <div><strong>ROT:</strong> {gqrData.rot_weight || 0}</div>
          <div><strong>Doubles:</strong> {gqrData.doubles_weight || 0}</div>
          <div><strong>Sand:</strong> {gqrData.sand_weight || 0}</div>
          <div><strong>Weight Shortage:</strong> {gqrData.weight_shortage_weight || 0}</div>
        </div>
      </div>

      {/* Final Report Table */}
      <div className="flex-grow mb-2">
        <h3 className="text-md font-bold mb-2 text-center">Final Report</h3>
        <table className="w-full border-collapse border border-black" style={{ fontSize: '9px' }}>
          <thead>
            <tr className="bg-gray-200 ">
              <th className="border border-black p-0 px-1 py-1 text-left">DESCRIPTION</th>
              <th className="border border-black p-0 px-1 py-1 text-center">CALCULATED (20MT)</th>
              <th className="border border-black p-0 px-1 py-1 text-center">ACTUAL</th>
              <th className="border border-black p-0 px-1 py-1 text-center">DIFFERENCE</th>
              <th className="border border-black p-0 px-1 py-1 text-center">TOTAL DIFFERENCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-0 px-1 py-1 font-semibold">TOTAL RATE AFTER PODI & GAP ITEMS PKG</td>
              <td className="border border-black p-0 px-1 py-1 text-center">₹{estimatedCalculations.totalCargoAfterPodiRate.toFixed(2)}</td>
              <td className="border border-black p-0 px-1 py-1 text-center">₹{actualCalculations.totalCargoAfterPodiAndGapRate.toFixed(2)}</td>
              <td className="border border-black p-0 px-1 py-1 text-center">₹{(estimatedCalculations.totalCargoAfterPodiRate - actualCalculations.totalCargoAfterPodiAndGapRate).toFixed(2)}</td>
              <td className="border border-black p-0 px-1 py-1 text-center">-</td>
            </tr>
            <tr>
              <td className="border border-black p-0 px-1 py-1 font-semibold">TOTAL RATE AFTER PODI & GAP ITEMS PMT</td>
              <td className="border border-black p-0 px-1 py-1 text-center">₹{(estimatedCalculations.totalCargoAfterPodiRate * 1000).toFixed(2)}</td>
              <td className="border border-black p-0 px-1 py-1 text-center">₹{(actualCalculations.totalCargoAfterPodiAndGapRate * 1000).toFixed(2)}</td>
              <td className="border border-black p-0 px-1 py-1 text-center">₹{Math.round((estimatedCalculations.totalCargoAfterPodiRate * 1000) - (actualCalculations.totalCargoAfterPodiAndGapRate * 1000))}</td>
              <td className="border border-black p-0 px-1 py-1 text-center">₹{Math.round((actualCalculations.totalCargoAfterPodiAndGapKgs * ((estimatedCalculations.totalCargoAfterPodiRate * 1000) - (actualCalculations.totalCargoAfterPodiAndGapRate * 1000))) / 1000).toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-black p-0 px-1 py-1 font-semibold">PODI & CARGO ITEMS %</td>
              <td className="border border-black p-0 px-1 py-1 text-center">{((estimatedCalculations.podiKgs / estimatedCalculations.totalCargo) * 100).toFixed(2)}%</td>
              <td className="border border-black p-0 px-1 py-1 text-center">{(((actualCalculations.podiKgs + actualCalculations.gapKgs) / actualCalculations.totalCargo) * 100).toFixed(2)}%</td>
              <td className="border border-black p-0 px-1 py-1 text-center">{(((estimatedCalculations.podiKgs / estimatedCalculations.totalCargo) * 100) - (((actualCalculations.podiKgs + actualCalculations.gapKgs) / actualCalculations.totalCargo) * 100)).toFixed(2)}%</td>
              <td className="border border-black p-0 px-1 py-1 text-center">-</td>
            </tr>
            <tr className="border-t-2 border-black">
              <td className="border border-black p-0 px-1 py-1 font-semibold">WASTAGE KGS PMT</td>
              <td className="border border-black p-0 px-1 text-center">{gqrData.volatile_wastage_kgs_per_ton || adjustableDamageAllowed}</td>
              <td className="border border-black p-0 px-1 text-center">{Math.round(actualCalculations.totalCargo > 0 ? ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 1000) : 0)}</td>
              <td className="border border-black p-0 px-1 text-center">-{Math.abs(Math.round((gqrData.volatile_wastage_kgs_per_ton || adjustableDamageAllowed) - (actualCalculations.totalCargo > 0 ? ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 1000) : 0)))}</td>
              <td className="border border-black p-0 px-1 text-center">₹{(Math.round((gqrData.volatile_wastage_kgs_per_ton || adjustableDamageAllowed) - (actualCalculations.totalCargo > 0 ? ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 1000) : 0)) * (actualCalculations.totalCargo / 1000) * actualCalculations.totalCargoAfterPodiAndGapRate).toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-black p-0 px-1 py-1 font-semibold">WASTAGE %</td>
              <td className="border border-black p-0 px-1 py-1 text-center">{((estimatedCalculations.wastageKgs / estimatedCalculations.totalCargo) * 100).toFixed(2)}%</td>
              <td className="border border-black p-0 px-1 py-1 text-center">{((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 100).toFixed(2)}%</td>
              <td className="border border-black p-0 px-1 py-1 text-center">{(((estimatedCalculations.wastageKgs / estimatedCalculations.totalCargo) * 100) - ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 100)).toFixed(2)}%</td>
              <td className="border border-black p-0 px-1 py-1 text-center">-</td>
            </tr>
            <tr className="border-t-2 border-black bg-gray-100">
              <td className="border border-black p-1 py-1 font-bold text-center">TOTAL</td>
              <td className="border border-black p-1 py-1 text-center font-bold">-</td>
              <td className="border border-black p-1 py-1 text-center font-bold">-</td>
              <td className="border border-black p-1 py-1 text-center font-bold">-</td>
              <td className="border border-black p-1 py-1 text-center font-bold">₹{(Math.round((actualCalculations.totalCargoAfterPodiAndGapKgs * ((estimatedCalculations.totalCargoAfterPodiRate * 1000) - (actualCalculations.totalCargoAfterPodiAndGapRate * 1000))) / 1000) + (Math.round((gqrData.volatile_wastage_kgs_per_ton || adjustableDamageAllowed) - (actualCalculations.totalCargo > 0 ? ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 1000) : 0)) * (actualCalculations.totalCargo / 1000) * actualCalculations.totalCargoAfterPodiAndGapRate)).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Section */}
      <div className="mt-auto pt-6 border-t border-gray-300">
        <div className="flex justify-between items-center text-xs text-center mt-15">
          <div>
            <p className="font-semibold">Prepared by</p>
          </div>
          <div>
            <p className="font-semibold">Checked by</p>
          </div>
          <div>
            <p className="font-semibold">Authorised Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

GQRPrint.displayName = 'GQRPrint';