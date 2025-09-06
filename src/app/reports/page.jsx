'use client';

import React, { useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  const router = useRouter();
  const [reportData, setReportData] = useState([]);
  const [supplierCargoData, setSupplierCargoData] = useState([]);
  const [rawCargoData, setRawCargoData] = useState([]);
  const [basicGqrData, setBasicGqrData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

     // Helper function to get supplier names for GQRs - more direct approach
   const getSupplierNamesForGQRs = async (gqrIds) => {
     if (!gqrIds || gqrIds.length === 0) return {};
     
     try {
       // First, get the pre_gr_entry IDs for these GQRs
       const { data: gqrData, error: gqrError } = await supabase
         .from('gqr_entry')
         .select('id, pre_gr_entry_id')
         .in('id', gqrIds);
       
       if (gqrError) {
         console.error('Error fetching GQR pre_gr_entry_ids:', gqrError);
         return {};
       }
       
       const preGrIds = gqrData.map(g => g.pre_gr_entry_id).filter(Boolean);
       if (preGrIds.length === 0) {
         console.log('No pre_gr_entry_ids found for GQRs');
         return {};
       }
       
       // Then get the purchase order IDs for these pre_gr_entries
       const { data: preGrData, error: preGrError } = await supabase
         .from('pre_gr_entry')
         .select('id, purchase_order_id')
         .in('id', preGrIds);
       
       if (preGrError) {
         console.error('Error fetching pre_gr_entry purchase_order_ids:', preGrError);
         return {};
       }
       
       const poIds = preGrData.map(p => p.purchase_order_id).filter(Boolean);
       if (poIds.length === 0) {
         console.log('No purchase_order_ids found for pre_gr_entries');
         return {};
       }
       
       // Finally get the supplier names for these purchase orders
       const { data: poData, error: poError } = await supabase
         .from('purchase_orders')
         .select('id, supplier_id, cargo')
         .in('id', poIds);
       
       if (poError) {
         console.error('Error fetching purchase_orders supplier_ids:', poError);
         return {};
       }
       
       const supplierIds = poData.map(p => p.supplier_id).filter(Boolean);
       if (supplierIds.length === 0) {
         console.log('No supplier_ids found for purchase_orders');
         return {};
       }
       
       // Get supplier names
       const { data: supplierData, error: supplierError } = await supabase
         .from('suppliers')
         .select('id, name')
         .in('id', supplierIds);
       
       if (supplierError) {
         console.error('Error fetching supplier names:', supplierError);
         return {};
       }
       
       // Create a map of purchase_order_id to supplier name and cargo
       const poToSupplierMap = {};
       poData.forEach(po => {
         const supplier = supplierData.find(s => s.id === po.supplier_id);
         if (supplier) {
           poToSupplierMap[po.id] = {
             name: supplier.name,
             cargo: po.cargo
           };
         }
       });
       
       // Create a map of pre_gr_entry_id to supplier info
       const preGrToSupplierMap = {};
       preGrData.forEach(preGr => {
         const poInfo = poToSupplierMap[preGr.purchase_order_id];
         if (poInfo) {
           preGrToSupplierMap[preGr.id] = poInfo;
         }
       });
       
       // Create final map of GQR ID to supplier info
       const supplierMap = {};
       gqrData.forEach(gqr => {
         const supplierInfo = preGrToSupplierMap[gqr.pre_gr_entry_id];
         if (supplierInfo) {
           supplierMap[gqr.id] = supplierInfo;
         }
       });
       
       console.log('Supplier mapping created:', supplierMap);
       return supplierMap;
     } catch (err) {
       console.error('Error in getSupplierNamesForGQRs:', err);
       return {};
     }
   };

  // Function to process supplier cargo data
  const processSupplierCargoData = (rawData) => {
    console.log('Processing raw data:', rawData);
    const supplierMap = new Map();

    if (!rawData || !Array.isArray(rawData)) {
      console.warn('Invalid raw data provided to processSupplierCargoData:', rawData);
      return [];
    }

    rawData.forEach(entry => {
      console.log('Processing entry:', entry);
      
      // Handle different data structures
      let supplierName = 'Unknown';
      let committedCargo = 0;
      let exportQualityWeight = entry.export_quality_weight || 0;
      
             // Calculate net weight from available fields since net_wt column doesn't exist
       let netWeight = 0;
       if (exportQualityWeight > 0) {
         // Calculate net weight from export quality weight and wastage
         const wastageWeight = (entry.rot_weight || 0) + (entry.doubles_weight || 0) + 
                              (entry.sand_weight || 0) + (entry.gap_items_weight || 0) + 
                              (entry.podi_weight || 0) + (entry.total_wastage_weight || 0);
         netWeight = exportQualityWeight + wastageWeight;
       }

             // Try to get supplier info from nested structure
       if (entry.supplierName) {
         // Supplier name was added by the fallback logic
         supplierName = entry.supplierName;
         committedCargo = entry.committedCargo || entry.pre_gr_entry?.purchase_orders?.cargo || 85;
       } else if (entry.pre_gr_entry?.purchase_orders?.suppliers?.name) {
         supplierName = entry.pre_gr_entry.purchase_orders.suppliers.name;
         committedCargo = entry.pre_gr_entry.purchase_orders.cargo || 0;
       } else if (entry.pre_gr_entry?.purchase_orders?.cargo) {
         committedCargo = entry.pre_gr_entry.purchase_orders.cargo;
         supplierName = 'Supplier (No Name)';
       } else {
         // Fallback: Use a default supplier name and estimate committed cargo
         supplierName = 'Unknown Supplier';
         committedCargo = 85; // Default committed cargo percentage
       }

      console.log('Extracted data:', { supplierName, committedCargo, netWeight, exportQualityWeight });

             if (netWeight > 0 && exportQualityWeight > 0) {
         const actualCargo = (exportQualityWeight / netWeight) * 100;
         const variance = actualCargo - committedCargo;

        if (supplierMap.has(supplierName)) {
          const existing = supplierMap.get(supplierName);
          existing.totalCommitted += committedCargo;
          existing.totalActual += actualCargo;
          existing.totalNetWeight += netWeight;
          existing.totalExportWeight += exportQualityWeight;
          existing.entries.push({
            committed: committedCargo,
            actual: actualCargo,
            variance: variance,
            netWeight: netWeight,
            exportWeight: exportQualityWeight
          });
        } else {
          supplierMap.set(supplierName, {
            supplierName: supplierName,
            totalCommitted: committedCargo,
            totalActual: actualCargo,
            totalNetWeight: netWeight,
            totalExportWeight: exportQualityWeight,
            entries: [{
              committed: committedCargo,
              actual: actualCargo,
              variance: variance,
              netWeight: netWeight,
              exportWeight: exportQualityWeight
            }]
          });
        }
      }
    });

    console.log('Supplier map:', supplierMap);

    // Calculate averages and prepare chart data
    return Array.from(supplierMap.values()).map(supplier => ({
      supplierName: supplier.supplierName,
      committedCargo: supplier.totalCommitted / supplier.entries.length,
      actualCargo: supplier.totalActual / supplier.entries.length,
      variance: (supplier.totalActual / supplier.entries.length) - (supplier.totalCommitted / supplier.entries.length),
      totalEntries: supplier.entries.length,
      totalNetWeight: supplier.totalNetWeight,
      totalExportWeight: supplier.totalExportWeight,
      overallYield: (supplier.totalExportWeight / supplier.totalNetWeight) * 100
    }));
  };

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        // Fetch vendor performance data
        const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_performance_report');
        if (vendorError) {
          console.warn('Vendor performance RPC failed, trying direct query:', vendorError);
        } else {
          setReportData(vendorData || []);
        }

                 // First, let's check if there are any GQR entries at all
         console.log('Checking basic GQR entries...');
         const { data: basicGqrData, error: basicGqrError } = await supabase
           .from('gqr_entry')
           .select('*');
         
         console.log('Basic GQR data:', basicGqrData);
         console.log('Basic GQR error:', basicGqrError);
         
         // Debug: Show available columns in the first GQR entry
         if (basicGqrData && basicGqrData.length > 0) {
           console.log('Available columns in GQR data:', Object.keys(basicGqrData[0]));
           console.log('Sample GQR entry:', basicGqrData[0]);
         }
         
         // Store basic GQR data for debugging
         setBasicGqrData(basicGqrData || []);
         console.log('Basic GQR data stored, length:', (basicGqrData || []).length);
         
         // Fetch supplier cargo analysis data from GQR - using only existing columns
         const { data: cargoData, error: cargoError } = await supabase
           .from('gqr_entry')
           .select(`
             id,
             export_quality_weight,
             rot_weight,
             doubles_weight,
             sand_weight,
             gap_items_weight,
             podi_weight,
             total_wastage_weight,
             pre_gr_entry (
               id,
                                 gr_no,
               purchase_orders (
                 id,
                 cargo,
                 suppliers (
                   id,
                   name
                 )
               )
             )
           `);

         console.log('Raw cargo data:', cargoData);
         console.log('Cargo data length:', cargoData?.length || 0);
         console.log('Cargo error:', cargoError);
         console.log('Cargo error type:', typeof cargoError);
         console.log('Cargo error keys:', cargoError ? Object.keys(cargoError) : 'No error');
         
         // Debug: Show sample of the data structure
         if (cargoData && cargoData.length > 0) {
           console.log('Sample cargo data entry:', cargoData[0]);
           console.log('Sample pre_gr_entry:', cargoData[0]?.pre_gr_entry);
           console.log('Sample purchase_orders:', cargoData[0]?.pre_gr_entry?.purchase_orders);
           console.log('Sample suppliers:', cargoData[0]?.pre_gr_entry?.purchase_orders?.suppliers);
         }
         
         // Store raw data for debugging
         setRawCargoData(cargoData || []);

         if (cargoError) {
           console.error('Failed to fetch cargo data:', cargoError);
           console.error('Error details:', {
             message: cargoError?.message || 'No message',
             details: cargoError?.details || 'No details',
             hint: cargoError?.hint || 'No hint',
             code: cargoError?.code || 'No code',
             error: cargoError
           });
           
           // Try a simpler fallback query that still includes supplier info
           console.log('Trying simpler fallback query with supplier info...');
           try {
             const { data: simpleData, error: simpleError } = await supabase
               .from('gqr_entry')
               .select(`
                 id,
                 export_quality_weight,
                 rot_weight,
                 doubles_weight,
                 sand_weight,
                 gap_items_weight,
                 podi_weight,
                 total_wastage_weight,
                 pre_gr_entry (
                   id,
                   gr_no,
                   purchase_orders (
                     id,
                     cargo,
                     suppliers (
                       id,
                       name
                     )
                   )
                 )
               `);
             
                            if (simpleError) {
                 console.error('Simple fallback query also failed:', simpleError);
                 console.error('Simple error details:', {
                   message: simpleError?.message || 'No message',
                   details: simpleError?.details || 'No details',
                   hint: simpleError?.hint || 'No hint',
                   code: simpleError?.code || 'No code',
                   error: simpleError
                 });
               // Try an even simpler approach - get supplier info separately
               console.log('Trying to fetch supplier info separately...');
               try {
                                    const { data: supplierData, error: supplierError } = await supabase
                     .from('gqr_entry')
                     .select(`
                       id,
                       export_quality_weight,
                       rot_weight,
                       doubles_weight,
                       sand_weight,
                       gap_items_weight,
                       podi_weight,
                       total_wastage_weight
                     `);
                 
                                    if (supplierError) {
                     console.error('Supplier query failed:', supplierError);
                     console.error('Supplier error details:', {
                       message: supplierError?.message || 'No message',
                       details: supplierError?.details || 'No details',
                       hint: supplierError?.hint || 'No hint',
                       code: supplierError?.code || 'No code',
                       error: supplierError
                     });
                   const processedData = processSupplierCargoData(basicGqrData || []);
                   setSupplierCargoData(processedData);
                          } else {
           // Try to get supplier names from a separate query
           const supplierInfo = await getSupplierNamesForGQRs(supplierData.map(g => g.id));
           const enrichedData = supplierData.map(gqr => {
             const info = supplierInfo[gqr.id];
             return {
               ...gqr,
               supplierName: info ? info.name : 'Unknown Supplier',
               committedCargo: info ? info.cargo : 85
             };
           });
           const processedData = processSupplierCargoData(enrichedData);
           setSupplierCargoData(processedData);
         }
               } catch (supplierErr) {
                 console.error('Supplier fallback failed:', supplierErr);
                 const processedData = processSupplierCargoData(basicGqrData || []);
                 setSupplierCargoData(processedData);
               }
             } else {
               console.log('Simple fallback query succeeded, processing data...');
               const processedData = processSupplierCargoData(simpleData || []);
               setSupplierCargoData(processedData);
             }
           } catch (fallbackErr) {
             console.error('Fallback query failed:', fallbackErr);
             // Use basic GQR data as final fallback
             const processedData = processSupplierCargoData(basicGqrData || []);
             setSupplierCargoData(processedData);
           }
         } else if (!cargoData || cargoData.length === 0) {
           // No error but no data - use fallback
           console.log('No cargo data returned, using basic GQR data as fallback...');
           const processedData = processSupplierCargoData(basicGqrData || []);
           setSupplierCargoData(processedData);
         } else {
           // Process the data to calculate supplier performance
           console.log('Processing joined cargo data...');
           
           // Filter data to only include entries with complete supplier information
           const completeData = cargoData.filter(entry => 
             entry.pre_gr_entry?.purchase_orders?.suppliers?.name &&
             entry.pre_gr_entry?.purchase_orders?.cargo
           );
           
           console.log('Complete data entries:', completeData.length);
           console.log('Incomplete data entries:', cargoData.length - completeData.length);
           
           if (completeData.length > 0) {
             const processedData = processSupplierCargoData(completeData);
             setSupplierCargoData(processedData);
           } else {
             console.log('No complete data found, trying to enrich basic GQR data with supplier info...');
             // Try to get supplier info for basic GQR data
             try {
               const supplierInfo = await getSupplierNamesForGQRs(basicGqrData.map(g => g.id));
               const enrichedData = basicGqrData.map(gqr => {
                 const info = supplierInfo[gqr.id];
                 return {
                   ...gqr,
                   supplierName: info ? info.name : 'Unknown Supplier',
                   committedCargo: info ? info.cargo : 85
                 };
               });
               const processedData = processSupplierCargoData(enrichedData);
               setSupplierCargoData(processedData);
             } catch (enrichErr) {
               console.error('Failed to enrich basic GQR data:', enrichErr);
               const processedData = processSupplierCargoData(basicGqrData || []);
               setSupplierCargoData(processedData);
             }
           }
         }
      } catch (err) {
        console.error('Reports page error:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError('Failed to fetch report data: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);

  const VarianceCell = ({ value }) => {
    const isNegative = value < 0;
    const isPositive = value > 0;
    const colorClass = isNegative ? 'text-red-500' : isPositive ? 'text-green-500' : 'text-gray-500';
    return (
      <td className={`px-6 py-4 font-semibold ${colorClass}`}>
        {value?.toFixed(2)}%
      </td>
    );
  };

  if (loading) return <div className="text-center p-8">Loading report...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
             <div className='flex justify-between items-center'>
         <h1 className="text-3xl font-bold">Reports & Analysis</h1>
         <div className="flex gap-3">
           <Button 
             variant="outline" 
             onClick={() => setShowDebugInfo(!showDebugInfo)}
             className="text-sm"
           >
             {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
           </Button>
           <Button variant="primary" onClick={() => router.push('/')}>
             Back to Home
           </Button>
         </div>
       </div>

             {/* 1. Supplier Cargo Performance Analysis */}
       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
         <h2 className="text-xl font-semibold mb-4">Supplier Cargo Performance Analysis</h2>
         <p className="text-gray-600 mb-6">Comparison of committed cargo percentage vs actual cargo percentage for each supplier</p>
         
                   {/* Debug Section - Show raw data (conditional) */}
          {showDebugInfo && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium mb-2">Debug Info:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                basicGqrData length: {basicGqrData.length} | 
                supplierCargoData length: {supplierCargoData.length} | 
                rawCargoData length: {rawCargoData.length}
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400">
                  Click to see basic GQR data (all fields)
                </summary>
                <pre className="mt-2 text-xs bg-gray-200 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(basicGqrData, null, 2)}
                </pre>
              </details>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400">
                  Click to see processed supplier data
                </summary>
                <pre className="mt-2 text-xs bg-gray-200 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(supplierCargoData, null, 2)}
                </pre>
              </details>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400">
                  Click to see raw cargo data from database
                </summary>
                <pre className="mt-2 text-xs bg-gray-200 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(rawCargoData, null, 2)}
                </pre>
              </details>
            </div>
          )}
         
         {supplierCargoData.length === 0 ? (
           <div className="text-center py-8 text-gray-500">
             <p>No supplier cargo data available.</p>
             <p className="text-sm mt-2">This could be because:</p>
             <ul className="text-sm mt-2 space-y-1">
               <li>• No GQR entries have been created yet</li>
               <li>• GQR entries don't have complete weight data</li>
               <li>• Purchase order relationships are missing</li>
             </ul>
           </div>
         ) : (
           <>
             {/* Bar Chart - Committed vs Actual Cargo */}
             <div className="mb-8">
               <h3 className="text-lg font-medium mb-4">Committed vs Actual Cargo Percentage</h3>
               <ResponsiveContainer width="100%" height={400}>
                 <BarChart data={supplierCargoData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="supplierName" />
                   <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                   <Tooltip />
                   <Legend />
                   <Bar dataKey="committedCargo" fill="#8884d8" name="Committed Cargo %" />
                   <Bar dataKey="actualCargo" fill="#82ca9d" name="Actual Cargo %" />
                 </BarChart>
               </ResponsiveContainer>
             </div>

             {/* Line Chart - Cargo Variance Trend */}
             <div className="mb-8">
               <h3 className="text-lg font-medium mb-4">Cargo Variance Analysis</h3>
               <ResponsiveContainer width="100%" height={400}>
                 <LineChart data={supplierCargoData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="supplierName" />
                   <YAxis label={{ value: 'Variance (%)', angle: -90, position: 'insideLeft' }} />
                   <Tooltip />
                   <Legend />
                   <Line type="monotone" dataKey="variance" stroke="#ff7300" strokeWidth={3} name="Cargo Variance %" />
                 </LineChart>
               </ResponsiveContainer>
             </div>

             {/* Pie Chart - Overall Yield Distribution */}
             <div>
               <h3 className="text-lg font-medium mb-4">Overall Yield Distribution by Supplier</h3>
               <ResponsiveContainer width="100%" height={400}>
                 <PieChart>
                   <Pie
                     data={supplierCargoData}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     label={({ supplierName, overallYield }) => `${supplierName}: ${overallYield.toFixed(1)}%`}
                     outerRadius={120}
                     fill="#8884d8"
                     dataKey="overallYield"
                   >
                     {supplierCargoData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5]} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           </>
         )}
       </div>

      {/* 2. Supplier Performance Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-xl font-semibold p-6">Supplier Cargo Performance Summary</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Supplier</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Committed Cargo %</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actual Cargo %</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Variance %</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Overall Yield %</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Total Entries</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Total Weight (kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {supplierCargoData.map((supplier) => (
              <tr key={supplier.supplierName}>
                <td className="px-6 py-4 font-medium">{supplier.supplierName}</td>
                <td className="px-6 py-4 text-right">{supplier.committedCargo.toFixed(2)}%</td>
                <td className="px-6 py-4 text-right font-bold">{supplier.actualCargo.toFixed(2)}%</td>
                <td className={`px-6 py-4 text-right font-semibold ${supplier.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {supplier.variance >= 0 ? '+' : ''}{supplier.variance.toFixed(2)}%
                </td>
                <td className="px-6 py-4 text-right">{supplier.overallYield.toFixed(2)}%</td>
                <td className="px-6 py-4 text-right">{supplier.totalEntries}</td>
                <td className="px-6 py-4 text-right">{(supplier.totalNetWeight / 1000).toFixed(2)} MT</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Original Vendor Performance Report */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Individual Consignment Performance</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="pre_gr_gr_no" />
            <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="assured_cargo_percentage" fill="#8884d8" name="Assured Cargo %" />
            <Bar dataKey="actual_yield_percentage" fill="#82ca9d" name="Actual Yield %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Detailed Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-xl font-semibold p-6">Consignment Details</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Pre-GR No.</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Assured Yield %</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actual Yield %</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Yield Variance</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Wastage Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reportData.map((row) => (
              <tr key={row.gqr_id}>
                <td className="px-6 py-4">{row.supplier_name}</td>
                                 <td className="px-6 py-4">{row.pre_gr_gr_no}</td>
                <td className="px-6 py-4 text-right">{row.assured_cargo_percentage?.toFixed(2)}%</td>
                <td className="px-6 py-4 text-right font-bold">{row.actual_yield_percentage?.toFixed(2)}%</td>
                <VarianceCell value={row.yield_variance} />
                <VarianceCell value={row.wastage_variance} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}