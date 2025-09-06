'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import WeightInput from '@/components/WeightInput';
import Link from 'next/link';
import { formatDateDDMMYYYY } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/use-auth';

export default function GQRCreatePage() {
  // State for data and UI control
  const { isAdmin } = useAuth();
  const [preGREntries, setPreGREntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPreGR, setSelectedPreGR] = useState(null);

  // State for user-entered weights only (kgs only)
  const [deductionWeights, setDeductionWeights] = useState({
    rot: { kgs: '' },
    doubles: { kgs: '' },
    sand: { kgs: '' },
    weightShortage: { kgs: '' },
    gapItems: { kgs: '' },
    podi: { kgs: '' },
  });

  // Automatically calculates the final export weight and yield
  const calculatedExportData = useMemo(() => {
    if (!selectedPreGR) return { exportKgs: 0, actualYield: 0 };

    const parseKgs = (value) => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : Math.max(0, parsed);
    };

    const rotKgs = parseKgs(deductionWeights.rot.kgs);
    const doublesKgs = parseKgs(deductionWeights.doubles.kgs);
    const sandKgs = parseKgs(deductionWeights.sand.kgs);
    const weightShortageKgs = parseKgs(deductionWeights.weightShortage.kgs);
    const gapKgs = parseKgs(deductionWeights.gapItems.kgs);
    const podiKgs = parseKgs(deductionWeights.podi.kgs);

    const totalDeductions = rotKgs + doublesKgs + sandKgs + weightShortageKgs + gapKgs + podiKgs;
    // Use fallback calculation if net_wt is missing
    const netWt = selectedPreGR.net_wt || (selectedPreGR.laden_wt && selectedPreGR.empty_wt ? selectedPreGR.laden_wt - selectedPreGR.empty_wt : 0);
    const exportKgs = Math.max(0, netWt - totalDeductions);
    const actualYield = netWt > 0 ? (exportKgs / netWt) * 100 : 0;

    return { 
      exportKgs: Math.round(exportKgs * 1000) / 1000, 
      actualYield: Math.round(actualYield * 100) / 100 
    };
  }, [deductionWeights, selectedPreGR]);
  
  const [finalBagCounts, setFinalBagCounts] = useState({
    podi_bags: '',
    gap_item1_bags: '',
    gap_item2_bags: '',
  });

  // State for calculated values and form submission
  const [calculatedValues, setCalculatedValues] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);

  // Form validation helper function
  const validateFormData = () => {
    const issues = [];
    
    if (!selectedPreGR?.pre_gr_id) {
      issues.push('No Pre-GR selected');
    }
    
    if (!calculatedValues) {
      issues.push('Calculated values are missing');
    }
    
    if (calculatedValues?.weightDifference < -0.01) {
      issues.push('Total weight exceeds available weight');
    }
    
    // Validate numeric inputs
    const weightsToCheck = ['rot', 'doubles', 'sand', 'weightShortage', 'gapItems', 'podi'];
    weightsToCheck.forEach(weight => {
      const value = deductionWeights[weight]?.kgs;
      if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
        issues.push(`Invalid ${weight} weight value`);
      }
    });
    
    return issues;
  };

  // Network debugging helper
  const debugNetworkIssues = () => {
    console.log('Network Debug Info:', {
      online: navigator.onLine,
      userAgent: navigator.userAgent,
      supabaseUrl: supabase?.supabaseUrl,
      timestamp: new Date().toISOString()
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Pre-GR entries using direct query (RPC function has column issues)
        console.log('GQR Create: Using direct query approach...');
        
        const { data: directData, error: directError } = await supabase
          .from('pre_gr_entry')
          .select(`
            id,
            gr_no,
            date,
            net_wt,
            ladden_wt,
            empty_wt,
            is_admin_approved,
            is_gqr_created,
            po_id,
            remarks,
            gr_dt,
                       purchase_orders!po_id (
             id,
             vouchernumber,
             date,
             rate,
             quantity,
             podi_rate,
             cargo,
             damage_allowed_kgs_ton,
             created_at,
             supplier_id,
             suppliers ( name ),
             item_master ( item_name )
           )
          `)
          .eq('is_admin_approved', true)
          .or('is_gqr_created.is.null,is_gqr_created.eq.false')
          .order('date', { ascending: false })
          .order('id', { ascending: false });
        
        if (directError) {
          throw new Error(`Direct query failed: ${directError.message}`);
        }
        
        console.log('Raw direct query data:', directData);
        console.log('Sample entry purchase_orders:', directData[0]?.purchase_orders);
        
        // Transform the direct query result to match expected structure
        const transformedData = directData.map(entry => ({
          pre_gr_id: entry.id,
          pre_gr_gr_no: entry.gr_no,
          date: entry.date,
          supplier_name: entry.purchase_orders?.suppliers?.name || 'N/A',
          net_wt: entry.net_wt,
          laden_wt: entry.ladden_wt,
          empty_wt: entry.empty_wt,
          po_gr_no: entry.purchase_orders?.gr_no || 'N/A',
          item_name: entry.purchase_orders?.item_master?.item_name || 'N/A',
          po_date: entry.purchase_orders?.date ? new Date(entry.purchase_orders.date).toISOString().split('T')[0] : null,
          po_rate: entry.purchase_orders?.rate || 0,
          po_quantity: entry.purchase_orders?.quantity || 0,
          podi_rate: entry.purchase_orders?.podi_rate || 0,
          damage_allowed: entry.purchase_orders?.damage_allowed_kgs_ton || 0,
          cargo: entry.purchase_orders?.cargo || 0,
          remarks: entry.remarks || '',
          gr_no: entry.gr_no || '',
          gr_dt: entry.gr_dt || '',
          // Add direct access to purchase_orders for table display
          purchase_orders: entry.purchase_orders
        }));
        
        console.log('Pre-GR entries data (direct query):', transformedData);
        setPreGREntries(transformedData || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch data: ' + err.message);
        //debugNetworkIssues();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Financial calculation useEffect with improved error handling
  useEffect(() => {
    if (!selectedPreGR) return;
    
    try {
      const parseKgs = (value) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
      };

      const gapKgs = parseKgs(deductionWeights.gapItems.kgs);
      const podiKgs = parseKgs(deductionWeights.podi.kgs);

      const poRate = parseFloat(selectedPreGR.po_rate) || 0;
      const podiRate = parseFloat(selectedPreGR.podi_rate) || 0;
      const gapRate = parseFloat(selectedPreGR.gap_items_rate) || poRate;

      const valueOfExportQuality = calculatedExportData.exportKgs * poRate; 
      const valueOfGapItems = gapKgs * gapRate;
      const valueOfPodi = podiKgs * podiRate;

      const totalWastage = parseKgs(deductionWeights.rot.kgs) + 
                          parseKgs(deductionWeights.doubles.kgs) + 
                          parseKgs(deductionWeights.sand.kgs) + 
                          parseKgs(deductionWeights.weightShortage.kgs);
      
      const totalValueReceived = valueOfExportQuality + valueOfGapItems + valueOfPodi;
      const totalWeightAccounted = calculatedExportData.exportKgs + gapKgs + podiKgs + totalWastage;

      const netWt = selectedPreGR.net_wt || (selectedPreGR.laden_wt && selectedPreGR.empty_wt ? selectedPreGR.laden_wt - selectedPreGR.empty_wt : 0);

      setCalculatedValues({
        totalValueReceived: Math.round(totalValueReceived * 100) / 100, // Round to 2 decimal places
        totalWastage: Math.round(totalWastage * 1000) / 1000, // Round to 3 decimal places
        totalWeightAccounted: Math.round(totalWeightAccounted * 1000) / 1000,
        weightDifference: Math.round((netWt - totalWeightAccounted) * 1000) / 1000,
      });
    } catch (err) {
      console.error('Error in financial calculation:', err);
      setError('Error calculating financial values: ' + err.message);
    }
  }, [deductionWeights, selectedPreGR, calculatedExportData]);

  // Handlers
  const handleSelectPreGR = (entry) => {
    setSelectedPreGR(entry);
    
    // Reset deduction weights
    setDeductionWeights({
      rot: { kgs: '' },
      doubles: { kgs: '' },
      sand: { kgs: '' },
      weightShortage: { kgs: '' },
      gapItems: { kgs: '' },
      podi: { kgs: '' },
    });

    // Reset bag counts
    setFinalBagCounts({
      podi_bags: '',
      gap_item1_bags: '',
      gap_item2_bags: '',
    });

    setFormSuccess(null);
    setError(null);
  };
  
  // Improved weight change handler with validation
  const handleWeightChange = (field, unit, value) => {
    // Allow empty string, numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDeductionWeights(prev => ({ 
        ...prev, 
        [field]: { ...prev[field], [unit]: value } 
      }));
    }
  };

  // Improved bag count handler
  const handleBagCountChange = (field, value) => {
    // Allow empty string and positive integers only
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
      setFinalBagCounts(prev => ({ ...prev, [field]: value }));
    }
  };

  // Fixed submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== GQR SUBMIT START ===');
    
    // Validate form data first
    const validationIssues = validateFormData();
    if (validationIssues.length > 0) {
      setError(`Validation errors: ${validationIssues.join(', ')}`);
      console.log('Validation failed:', validationIssues);
      return;
    }
    
    console.log('Form validation passed, starting submission...');
    setFormSubmitting(true);
    setError(null);
    setFormSuccess(null);
    
    try {
      // FIXED: Proper calculation with parentheses
      const totalDeductions = (parseFloat(deductionWeights.rot.kgs) || 0) + 
                             (parseFloat(deductionWeights.doubles.kgs) || 0) + 
                             (parseFloat(deductionWeights.sand.kgs) || 0) + 
                             (parseFloat(deductionWeights.weightShortage.kgs) || 0);
      
      const netWt = selectedPreGR.net_wt || (selectedPreGR.laden_wt && selectedPreGR.empty_wt ? selectedPreGR.laden_wt - selectedPreGR.empty_wt : 0);
      const updatedNetWt = netWt - totalDeductions;
      
      console.log('Calculated values:', {
        totalDeductions,
        updatedNetWt,
        selectedPreGR: selectedPreGR.pre_gr_id,
        calculatedExportData,
        calculatedValues,
        deductionWeights,
        finalBagCounts
      });

      // IMPROVED: Better parameter validation and type conversion
      const rpcParams = {
        p_pre_gr_id: Math.floor(Number(selectedPreGR.pre_gr_id)),
        p_export_quality_weight: Math.round((calculatedExportData.exportKgs || 0) * 1000) / 1000, // Round to 3 decimal places
        p_rot_weight: Math.round((parseFloat(deductionWeights.rot.kgs) || 0) * 1000) / 1000,
        p_doubles_weight: Math.round((parseFloat(deductionWeights.doubles.kgs) || 0) * 1000) / 1000,
        p_sand_weight: Math.round((parseFloat(deductionWeights.sand.kgs) || 0) * 1000) / 1000,
        p_weight_shortage_weight: Math.round((parseFloat(deductionWeights.weightShortage.kgs) || 0) * 1000) / 1000,
        p_gap_items_weight: Math.round((parseFloat(deductionWeights.gapItems.kgs) || 0) * 1000) / 1000,
        p_podi_weight: Math.round((parseFloat(deductionWeights.podi.kgs) || 0) * 1000) / 1000,
        p_total_wastage_weight: Math.round((calculatedValues?.totalWastage || 0) * 1000) / 1000,
        p_total_value_received: Math.round((calculatedValues?.totalValueReceived || 0) * 100) / 100, // Round to 2 decimal places for currency
        p_final_podi_bags: parseInt(finalBagCounts.podi_bags) || 0,
        p_final_gap_item1_bags: parseInt(finalBagCounts.gap_item1_bags) || 0,
        p_final_gap_item2_bags: parseInt(finalBagCounts.gap_item2_bags) || 0
      };

      console.log('RPC Parameters:', rpcParams);
      
      // Validate all numeric parameters are not NaN
      Object.entries(rpcParams).forEach(([key, value]) => {
        if (typeof value === 'number' && isNaN(value)) {
          throw new Error(`Invalid numeric value for parameter: ${key}`);
        }
      });

      console.log('Calling RPC function...');
      console.log('RPC Parameters being sent:', rpcParams);
      
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_gqr_and_update_pre_gr', rpcParams);

      console.log('RPC response:', { rpcData, rpcError });
      console.log('RPC Error details:', rpcError);
      console.log('RPC Data details:', rpcData);

      if (rpcError) {
        console.error('RPC Error details:', rpcError);
        
        // IMPROVED: Better error handling based on error types
        if (rpcError.code === '42883') {
          throw new Error('Database function not available. Please contact support.');
        } else if (rpcError.code === '23505') {
          throw new Error('This GQR already exists or conflicts with existing data.');
        } else if (rpcError.message?.includes('invalid input')) {
          throw new Error('Invalid data format detected. Please check your weight entries.');
        } else {
          throw new Error(rpcError.message || 'Database operation failed');
        }
      }

      // Handle table response format (array with one row)
      if (rpcData && rpcData.length > 0 && rpcData[0].success) {
        const gqrNo = rpcData[0].gqr_no || rpcData[0].gqr_id;
        console.log('GQR created successfully!', rpcData[0]);
        setFormSuccess(`GQR created successfully! GQR No: ${gqrNo}. Returning to list...`);
        
        setTimeout(() => {
          setPreGREntries(prev => prev.filter(entry => entry.pre_gr_id !== selectedPreGR.pre_gr_id));
          setSelectedPreGR(null);
          setFormSuccess(null);
        }, 2500);
      } else {
        const errorMessage = rpcData && rpcData.length > 0 ? rpcData[0].message : 'Unknown error occurred during GQR creation';
        throw new Error(errorMessage);
      }

    } catch (err) {
      console.error("=== SUBMIT ERROR ===");
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        code: err.code,
        details: err.details,
        stack: err.stack
      });
      
      setError('Failed to create GQR: ' + err.message);
      //debugNetworkIssues();
    } finally {
      console.log('Setting formSubmitting to false');
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading approved Pre-GR entries...</div>;
  }
  
  if (error && !selectedPreGR) { // Only show full-page error if we're on the list view
    return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 mt-20">
      {!selectedPreGR ? (
        // --- View 1: Selection List ---
        <div>
          <div className='flex justify-between items-center mb-6'>
            <h1 className="text-2xl font-bold">Select a Pre-GR to Create a GQR</h1>
            <Link href="/gqr-list">
              <Button variant="primary">Back to GQR List</Button>
            </Link>
          </div>
          {preGREntries.length === 0 ? (
            <div className="text-gray-500">No approved Pre-GR entries are available.</div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto mt-20">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                                         <th className="px-6 py-3 text-left text-xs font-medium uppercase">PO NO</th>
                     <th className="px-6 py-3 text-left text-xs font-medium uppercase">PO DATE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">GR NO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">GR DT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Net Wt (kg)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {preGREntries.map((entry) => (
                    <tr key={entry.pre_gr_id}>
                                             <td className="px-6 py-4">{entry.purchase_orders?.vouchernumber || 'N/A'}</td>
                       <td className="px-6 py-4">{entry.purchase_orders?.date ? formatDateDDMMYYYY(entry.purchase_orders.date) : 'N/A'}</td>
                      <td className="px-6 py-4">{entry.gr_no || 'N/A'}</td>
                      <td className="px-6 py-4">{entry.gr_dt ? formatDateDDMMYYYY(entry.gr_dt) : 'N/A'}</td>
                      <td className="px-6 py-4">{entry.supplier_name}</td>
                      <td className="px-6 py-4 font-semibold">
                        {entry.net_wt || (entry.laden_wt && entry.empty_wt ? entry.laden_wt - entry.empty_wt : 'N/A')}
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="primary" onClick={() => handleSelectPreGR(entry)}>
                          Create GQR
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // --- View 2: GQR Form ---
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">GQR Entry</h1>
          {formSuccess && <div className="bg-green-100 text-green-700 p-4 rounded-md">{formSuccess}</div>}
          {error && <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>}
           
          {/* Debug Information - Remove in production 
          <div className="bg-yellow-100 p-4 rounded-md text-sm">
            <strong>Debug Info:</strong><br/>
            Form Submitting: {formSubmitting ? 'YES' : 'NO'}<br/>
            Calculated Values: {calculatedValues ? 'Available' : 'NULL'}<br/>
            Weight Difference: {calculatedValues?.weightDifference?.toFixed(2) || 'N/A'}<br/>
            Export Kgs: {calculatedExportData?.exportKgs?.toFixed(2) || 'N/A'}<br/>
            Selected Pre-GR ID: {selectedPreGR?.pre_gr_id || 'N/A'}<br/>
            Network Status: {navigator.onLine ? 'Online' : 'Offline'}
          </div>*/}

          {/* 1. Purchase Order Details Section */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 border-b pb-2">Purchase Order Details (GR NO: {selectedPreGR.gr_no || selectedPreGR.po_gr_no})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><strong className='text-sm text-gray-400'>Supplier:</strong> {selectedPreGR.supplier_name}</div>
              <div><strong className='text-sm text-gray-400'>Item:</strong> {selectedPreGR.item_name}</div>
              <div ><strong className='text-sm text-gray-400'>PO Date:</strong> {formatDateDDMMYYYY(selectedPreGR.po_date)}</div>
              <div><strong className='text-sm text-gray-400'>PO Rate:</strong> ₹{selectedPreGR.po_rate}/kg</div>
              <div><strong className='text-sm text-gray-400'>PO Qty:</strong> {selectedPreGR.po_quantity} MT</div>
              <div><strong className='text-sm text-gray-400'>Podi Rate:</strong> ₹{selectedPreGR.podi_rate}/kg</div>
              <div><strong className='text-sm text-gray-400'>Damage per ton kg:</strong> {selectedPreGR.damage_allowed || 0} kg</div>
              <div><strong className='text-sm text-gray-400'>Assured Cargo:</strong> {selectedPreGR.cargo}%</div>
            </div>
          </div>

          {/* Pre-GR Details Section */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 border-b pb-2">Pre-GR Details (GR NO: {selectedPreGR.gr_no || selectedPreGR.pre_gr_gr_no})</h2>
            {/* Use a 3-column grid to ensure items fit */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Original Net Weight</p>
                <p className="font-bold text-lg">
                  {(selectedPreGR.net_wt || (selectedPreGR.laden_wt && selectedPreGR.empty_wt ? selectedPreGR.laden_wt - selectedPreGR.empty_wt : 0)).toFixed(2)} kg
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Updated Net Weight</p>
                <p className="font-bold text-lg text-blue-600">
                  {((selectedPreGR.net_wt || (selectedPreGR.laden_wt && selectedPreGR.empty_wt ? selectedPreGR.laden_wt - selectedPreGR.empty_wt : 0)) - ((parseFloat(deductionWeights.rot.kgs) || 0) + (parseFloat(deductionWeights.doubles.kgs) || 0) + (parseFloat(deductionWeights.sand.kgs) || 0) + (parseFloat(deductionWeights.weightShortage.kgs) || 0))).toFixed(2)} kg
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Total Deductions</p>
                <p className="font-bold text-lg text-red-600">
                  {((parseFloat(deductionWeights.rot.kgs) || 0) + (parseFloat(deductionWeights.doubles.kgs) || 0) + (parseFloat(deductionWeights.sand.kgs) || 0) + (parseFloat(deductionWeights.weightShortage.kgs) || 0)).toFixed(2)} kg
                </p>
              </div>
            </div>
            
            {/* Remarks Section */}
            {selectedPreGR.remarks && (
              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-500 mb-2">Pre-GR Remarks:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  {selectedPreGR.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Summary & Financials Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Section: GQR Weight Entry */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">GQR Segregation Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rot Weight (kg)</label>
                  <input 
                    type="text" 
                    value={deductionWeights.rot.kgs} 
                    onChange={(e) => handleWeightChange('rot', 'kgs', e.target.value)} 
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-gray-800 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" 
                    placeholder="Enter weight in kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Doubles Weight (kg)</label>
                  <input 
                    type="text" 
                    value={deductionWeights.doubles.kgs} 
                    onChange={(e) => handleWeightChange('doubles', 'kgs', e.target.value)} 
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-gray-800 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" 
                    placeholder="Enter weight in kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sand/Debris Weight (kg)</label>
                  <input 
                    type="text" 
                    value={deductionWeights.sand.kgs} 
                    onChange={(e) => handleWeightChange('sand', 'kgs', e.target.value)} 
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-gray-800 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" 
                    placeholder="Enter weight in kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight Shortage (kg)</label>
                  <input 
                    type="text" 
                    value={deductionWeights.weightShortage.kgs} 
                    onChange={(e) => handleWeightChange('weightShortage', 'kgs', e.target.value)} 
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-gray-800 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" 
                    placeholder="Enter weight in kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Podi Weight (kg)</label>
                  <input 
                    type="text" 
                    value={deductionWeights.podi.kgs} 
                    onChange={(e) => handleWeightChange('podi', 'kgs', e.target.value)} 
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-gray-800 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" 
                    placeholder="Enter weight in kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gap Items Weight (kg)</label>
                  <input 
                    type="text" 
                    value={deductionWeights.gapItems.kgs} 
                    onChange={(e) => handleWeightChange('gapItems', 'kgs', e.target.value)} 
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-gray-800 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" 
                    placeholder="Enter weight in kg"
                  />
                </div>
              </div>

              {/* Bag Count Inputs */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Bag Counts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Podi Bags</label>
                    <input 
                      type="text" 
                      value={finalBagCounts.podi_bags} 
                      onChange={(e) => handleBagCountChange('podi_bags', e.target.value)} 
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-gray-800 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" 
                      placeholder="Enter bag count"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gap Item 1 Bags</label>
                    <input 
                      type="text" 
                      value={finalBagCounts.gap_item1_bags} 
                      onChange={(e) => handleBagCountChange('gap_item1_bags', e.target.value)} 
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-gray-800 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" 
                      placeholder="Enter bag count"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gap Item 2 Bags</label>
                    <input 
                      type="text" 
                      value={finalBagCounts.gap_item2_bags} 
                      onChange={(e) => handleBagCountChange('gap_item2_bags', e.target.value)} 
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-gray-800 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" 
                      placeholder="Enter bag count"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Export Quality and Yield Section */}
              <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Calculated Export Quality Weight</label>
                  <p className="font-bold text-2xl mt-1">{calculatedExportData.exportKgs.toFixed(2)} kg</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Actual Yield % (Assured: {selectedPreGR.cargo}%)</label>
                  <p className={`font-bold text-2xl mt-1 ${calculatedExportData.actualYield < selectedPreGR.cargo ? 'text-red-500' : 'text-green-500'}`}>
                    {calculatedExportData.actualYield.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-2">
                <Button type="button" variant="secondary" onClick={() => setSelectedPreGR(null)}>
                  Back to List
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={formSubmitting || !calculatedValues || calculatedValues.weightDifference < -0.01}
                >
                  {formSubmitting ? 'Saving...' : 'Save GQR'}
                </Button>
              </div>
            </form>

            {/* Right Section: Summary & Financials */}
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg shadow-inner space-y-4">
              <h2 className="text-xl font-semibold mb-2">Summary & Financials</h2>
              
              {/* Weight Summary */}
              <div className="space-y-2">
                <h3 className="text-md font-semibold text-gray-600">Weight Summary</h3>
                <div className="flex justify-between text-sm">
                  <span>Export Quality:</span> 
                  <span className="font-bold text-green-600">{calculatedExportData.exportKgs.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Gap Items:</span> 
                  <span className="font-bold">{(parseFloat(deductionWeights.gapItems.kgs) || 0).toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Podi:</span> 
                  <span className="font-bold">{(parseFloat(deductionWeights.podi.kgs) || 0).toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Wastage:</span> 
                  <span className="font-bold text-red-600">{calculatedValues?.totalWastage?.toFixed(2) || '0.00'} kg</span>
                </div>
              </div>

              {/* Cost Calculations */}
              {calculatedValues && (
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="text-md font-semibold text-gray-600">Cost Calculation (Payable to Vendor)</h3>
                  <div className="flex justify-between text-sm">
                    <span>Export Value:</span> 
                    <span className="font-bold">₹{(calculatedExportData.exportKgs * (selectedPreGR.po_rate || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gap Items Value:</span> 
                    <span className="font-bold">₹{((parseFloat(deductionWeights.gapItems.kgs) || 0) * (selectedPreGR.po_rate || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Podi Value:</span> 
                    <span className="font-bold">₹{((parseFloat(deductionWeights.podi.kgs) || 0) * (selectedPreGR.podi_rate || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Total Value Received:</span> 
                    <span className="text-blue-600">₹{calculatedValues.totalValueReceived.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Weight Accounted:</span> 
                    <span>{calculatedValues.totalWeightAccounted.toFixed(2)} kg</span>
                  </div>
                  {calculatedValues.weightDifference !== 0 && (
                    <div className={`flex justify-between font-semibold ${calculatedValues.weightDifference < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      <span>Weight Difference:</span> 
                      <span>{calculatedValues.weightDifference > 0 ? '+' : ''}{calculatedValues.weightDifference.toFixed(2)} kg</span>
                    </div>
                  )}
                </div>
              )}

              {/* Validation Status */}
              <div className="pt-4 border-t">
                <h3 className="text-md font-semibold text-gray-600 mb-2">Validation Status</h3>
                {calculatedValues && calculatedValues.weightDifference >= -0.01 ? (
                  <div className="flex items-center text-green-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Weight accounting is balanced</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Weight exceeds available amount</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}