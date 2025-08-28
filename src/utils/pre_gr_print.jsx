import React from 'react';
import { formatDateDDMMYYYY } from '@/utils/dateUtils';

// Helper component for creating paired data rows
const PairedRow = ({ label1, value1, label2, value2 }) => (
  <div className="flex justify-between items-center py-4 border-b border-gray-200">
    <p className="w-1/2 break-words text-xs"><span className="text-gray-500">{label1}:</span> <span className="font-semibold text-black ml-1">{value1 || '—'}</span></p>
    {label2 && <p className="w-1/2 break-words text-xs"><span className="text-gray-500">{label2}:</span> <span className="font-semibold text-black ml-1">{value2 || '—'}</span></p>}
  </div>
);

// Helper for single-line items
const SingleRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-4 border-b border-gray-200">
        <p className="text-xs"><span className="text-gray-500">{label}:</span> <span className="font-semibold text-black ml-1">{value || '—'}</span></p>
    </div>
);

export const PreGrPrintLayout = ({ data }) => {
  const {
    grNo, grDate, poVoucherNumber, selectedPo, supplierName, itemQuality, loadedFrom, vehicleNo,
    weightBridgeName, bags, poDamageAllowed, poCargo, ladenWtTons, ladenWtKgs, emptyWtTons,
    emptyWtKgs, goodsWtTons, goodsWtKgs, podiBags, gapItem1Id, gapItem1Bags, gapItem2Id,
    gapItem2Bags, gapItems, isAdminApproved, advanceAmount, adminRemark, preparedBy
  } = data;
  
  // Find the gap item name from the array
  const gapItem1Name = gapItems.find(item => item.id === parseInt(gapItem1Id))?.name || 'Gap Item 1';

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.1in;
            size: A4;
          }
          .print-container {
            font-size: 11px !important;
            line-height: 1.2 !important;
            min-height: 75vh !important;
            padding: 8px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
          }
          .print-footer {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            border-top: 1px solid #d1d5db !important;
            padding-top: 4px !important;
            background: white !important;
          }
          /* Hide all UI elements */
          header, nav, .auth-button-component, .sidebar, footer, button {
            display: none !important;
          }
        }
      `}</style>

      <div className="print-container font-sans" style={{ 
        padding: '5px',
        margin: '0',
        position: 'relative',
        minHeight: '95vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start'
      }}>
        
        {/* --- Header --- */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '6px',
          flex: '0 0 auto'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '2px'
          }}>
            <img 
              src="/ramlogo.png" 
              alt="Company Logo" 
              style={{ 
                width: '30px', 
                height: '30px', 
                marginRight: '6px' 
              }} 
            />
            <h1 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: 'black',
              margin: '0'
            }}>
              Ramasamy Export & Import Private Ltd
            </h1>
          </div>
          <h2 style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#374151',
            margin: '0'
          }}>
            PRE GR
          </h2>
        </div>

        {/* --- Main Content --- */}
        <div style={{ flex: '1' }}>
          {/* --- Main Details --- */}
          <section style={{ marginBottom: '2px' }}>
              <PairedRow label1="GR No." value1={grNo} label2="GR Date" value2={grDate} />
              <PairedRow label1="PO No." value1={poVoucherNumber} label2="PO Date" value2={selectedPo ? formatDateDDMMYYYY(selectedPo.date) : '—'} />
              <SingleRow label="Supplier" value={supplierName} />
              <SingleRow label="Item / Quality" value={itemQuality} />
              <PairedRow label1="Loaded From" value1={loadedFrom} label2="Vehicle No." value2={vehicleNo} />
              <PairedRow label1="Weight Bridge" value1={weightBridgeName} label2="No. of Bags" value2={bags} />
              <PairedRow label1="Damage per ton kg" value1={poDamageAllowed ? `${poDamageAllowed} kg` : '—'} label2="Assured Cargo" value2={poCargo ? `${poCargo}%` : '—'} />
          </section>

          {/* --- Weight Details --- */}
          <section style={{ marginBottom: '2px', marginTop: '50px' }}>
              <h3 style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: 'black', 
                marginBottom: '2px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1px'
              }}>
                Weight Details
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '4px', 
                textAlign: 'center',
                padding: '2px 0'
              }}>
                  <div>
                      <p style={{ color: '#6b7280', fontSize: '10px', margin: '0 0 1px 0' }}>Laden Weight</p>
                      <p style={{ fontWeight: 'bold', color: 'black', fontSize: '12px', margin: '0' }}>
                        {ladenWtTons || '0'} T / {ladenWtKgs || '0'} kg
                      </p>
                  </div>
                  <div>
                      <p style={{ color: '#6b7280', fontSize: '10px', margin: '0 0 1px 0' }}>Empty Weight</p>
                      <p style={{ fontWeight: 'bold', color: 'black', fontSize: '12px', margin: '0' }}>
                        {emptyWtTons || '0'} T / {emptyWtKgs || '0'} kg
                      </p>
                  </div>
                  <div>
                      <p style={{ color: '#6b7280', fontSize: '10px', margin: '0 0 1px 0' }}>Goods Weight</p>
                      <p style={{ fontWeight: 'bold', color: 'black', fontSize: '12px', margin: '0' }}>
                        {goodsWtTons || '0'} T / {goodsWtKgs || '0'} kg
                      </p>
                  </div>
              </div>
          </section>
          
          {/* --- Additional Details --- */}
          <section style={{ marginBottom: '2px', marginTop: '50px' }}>
              <h3 style={{ 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  color: 'black', 
                  marginBottom: '2px',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '1px'
                }}>
                  Additional Details
                </h3>
              <PairedRow 
                  label1="Podi Bags" 
                  value1={podiBags || '0'} 
                  label2={gapItem1Name}
                  value2={gapItem1Bags ? `${gapItem1Bags} Bags` : '—'} 
              />
          </section>

          {/* --- Admin Approval Section --- */}
          {isAdminApproved && (
              <section style={{
                border: '1px solid #10b981',
                backgroundColor: '#ecfdf5',
                padding: '4px',
                borderRadius: '3px',
                marginBottom: '2px',
                marginTop: '50px'
              }}>
                  <h3 style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    color: '#065f46',
                    marginBottom: '8px',
                  }}>
                    Admin Approval
                  </h3>
                  <div style={{ fontSize: '11px', marginTop: '10px' }}>
                      <p style={{ margin: '1px 0' }}>
                        <span style={{ color: '#6b7280' }}>Advance Amount:</span> 
                        <span style={{ fontWeight: '600', color: 'black', marginLeft: '4px' }}>
                          {`₹ ${advanceAmount || '0.00'}`}
                        </span>
                      </p>
                      <p style={{ margin: '1px 0', marginTop: '10px'}}>
                        <span style={{ color: '#6b7280', marginTop: '10px'   }}>Admin Remark:</span> 
                        <span style={{ fontWeight: '600', color: 'black', marginLeft: '4px', marginTop: '10px'}}>
                          {adminRemark || '—'}
                        </span>
                      </p>
                  </div>
              </section>
          )}
        </div>
        <div className="hidden print:flex justify-between items-center p-2 py-1 border-b border-gray-200 mt-2">
          <div>
            <p style={{ fontSize: '9px', fontWeight: 600, color: 'black', margin: 0 }}>Prepared By ({preparedBy || 'User'})</p>
          </div>
          <div>
            <p style={{ fontSize: '9px', fontWeight: 600, color: 'black', margin: 0 }}>Approved By Admin</p>
          </div>
          <div>
            <p style={{ fontSize: '9px', fontWeight: 600, color: 'black', margin: 0 }}>Authrozed Signatory</p>
          </div>
        </div>
      </div>
    </>
  );
};