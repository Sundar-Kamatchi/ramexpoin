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

  // NEW - State for user-entered weights only (kgs only)
  const [deductionWeights, setDeductionWeights] = useState({
    rot: { kgs: '' },
    doubles: { kgs: '' },
    sand: { kgs: '' },
    weightShortage: { kgs: '' },
    gapItems: { kgs: '' },
    podi: { kgs: '' },
  });

  // NEW - Automatically calculates the final export weight and yield
  const calculatedExportData = useMemo(() => {
    if (!selectedPreGR) return { exportKgs: 0, actualYield: 0 };

    const parseKgs = (value) => parseFloat(value) || 0;
    const rotKgs = parseKgs(deductionWeights.rot.kgs);
    const doublesKgs = parseKgs(deductionWeights.doubles.kgs);
    const sandKgs = parseKgs(deductionWeights.sand.kgs);
    const weightShortageKgs = parseKgs(deductionWeights.weightShortage.kgs);
    const gapKgs = parseKgs(deductionWeights.gapItems.kgs);
    const podiKgs = parseKgs(deductionWeights.podi.kgs);

    const totalDeductions = rotKgs + doublesKgs + sandKgs + weightShortageKgs + gapKgs + podiKgs;
    // Use fallback calculation if net_wt is missing
    const netWt = selectedPreGR.net_wt || (selectedPreGR.laden_wt && selectedPreGR.empty_wt ? selectedPreGR.laden_wt - selectedPreGR.empty_wt : 0);
    const exportKgs = netWt - totalDeductions;
    const actualYield = netWt > 0 ? (exportKgs / netWt) * 100 : 0;

    return { exportKgs, actualYield };
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {

        // Fetch Pre-GR entries
        const { data, error } = await supabase.rpc('get_pre_gr_for_gqr');
        if (error) {
          console.warn('GQR Create: RPC function failed, trying direct query:', error);
          
                     // Fallback: Direct query approach
           const { data: directData, error: directError } = await supabase
             .from('pre_gr_entry')
             .select(`
               id,
               vouchernumber,
               date,
               net_wt,
               ladden_wt,
               empty_wt,
               is_admin_approved,
               is_gqr_created,
               po_id,
               remarks,
               gr_no,
               gr_dt,
                                purchase_orders (
                   id,
                   vouchernumber,
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
          
          // Transform the direct query result to match expected structure
          const transformedData = directData.map(entry => ({
            pre_gr_id: entry.id,
            pre_gr_vouchernumber: entry.vouchernumber,
            date: entry.date,
            supplier_name: entry.purchase_orders?.suppliers?.name || 'N/A',
            net_wt: entry.net_wt,
            laden_wt: entry.ladden_wt,
            empty_wt: entry.empty_wt,
            po_vouchernumber: entry.purchase_orders?.vouchernumber || 'N/A',
                         item_name: entry.purchase_orders?.item_master?.item_name || 'N/A',
            po_date: entry.purchase_orders?.created_at ? new Date(entry.purchase_orders.created_at).toISOString().split('T')[0] : null,
            po_rate: entry.purchase_orders?.rate || 0,
            po_quantity: entry.purchase_orders?.quantity || 0,
            podi_rate: entry.purchase_orders?.podi_rate || 0,
                         damage_allowed: entry.purchase_orders?.damage_allowed_kgs_ton || 0,
            cargo: entry.purchase_orders?.cargo || 0,
            remarks: entry.remarks || '',
            gr_no: entry.gr_no || '',
            gr_dt: entry.gr_dt || ''
          }));
          
          console.log('Pre-GR entries data (direct query):', transformedData);
          setPreGREntries(transformedData || []);
        } else {
          console.log('Pre-GR entries data:', data);
          setPreGREntries(data || []);
        }
      } catch (err) {
        setError('Failed to fetch data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);



  // Calculate financial summary in real-time when weights change
  // UPDATED - Financial calculation useEffect
useEffect(() => {
  if (!selectedPreGR) return;
  const parseKgs = (value) => parseFloat(value) || 0;

  // Use deductionWeights here
  const gapKgs = parseKgs(deductionWeights.gapItems.kgs);
  const podiKgs = parseKgs(deductionWeights.podi.kgs);

  const poRate = selectedPreGR.po_rate || 0;
  const podiRate = selectedPreGR.podi_rate || 0;
  const gapRate = selectedPreGR.gap_items_rate || poRate;

  const valueOfExportQuality = calculatedExportData.exportKgs * poRate; 
  const valueOfGapItems = gapKgs * gapRate;
  const valueOfPodi = podiKgs * podiRate;

  // Use deductionWeights here as well
  const totalWastage = (parseKgs(deductionWeights.rot.kgs) + parseKgs(deductionWeights.doubles.kgs) + parseKgs(deductionWeights.sand.kgs) + parseKgs(deductionWeights.weightShortage.kgs));
  const totalValueReceived = valueOfExportQuality + valueOfGapItems + valueOfPodi;
  const totalWeightAccounted = calculatedExportData.exportKgs + gapKgs + podiKgs + totalWastage;

  // Use fallback calculation if net_wt is missing
  const netWt = selectedPreGR.net_wt || (selectedPreGR.laden_wt && selectedPreGR.empty_wt ? selectedPreGR.laden_wt - selectedPreGR.empty_wt : 0);

  setCalculatedValues({
    totalValueReceived, totalWastage, totalWeightAccounted,
    weightDifference: netWt - totalWeightAccounted,
  });
}, [deductionWeights, selectedPreGR, calculatedExportData]); // Dependency is correct
// Add new dependency  
  // Handlers
const handleSelectPreGR = (entry) => {
  setSelectedPreGR(entry);
  
  // Use setDeductionWeights instead of setWeights
  setDeductionWeights({
    rot: { kgs: '' },
    doubles: { kgs: '' },
    sand: { kgs: '' },
    weightShortage: { kgs: '' },
    gapItems: { kgs: '' },
    podi: { kgs: '' },
  });

  setFormSuccess(null);
  setError(null);
};
  
  const handleWeightChange = (field, unit, value) => {
    // Simple direct assignment like the working PO page input
    setDeductionWeights(prev => ({ ...prev, [field]: { ...prev[field], [unit]: value } }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== GQR SUBMIT START ===');
    console.log('Form validation check...');
    
    if (!calculatedValues || calculatedValues.weightDifference < -0.01) {
      setError("Validation Error: Total accounted weight cannot exceed the Pre-GR Net Weight.");
      console.log('Validation failed:', { calculatedValues, weightDifference: calculatedValues?.weightDifference });
      return;
    }
    
    console.log('Validation passed, starting submission...');
    setFormSubmitting(true);
    setError(null);
    setFormSuccess(null);
    
    try {
      // Calculate the updated net_wt (original net_wt minus total deductions)
      const totalDeductions = parseFloat(deductionWeights.rot.kgs) || 0 + 
                             parseFloat(deductionWeights.doubles.kgs) || 0 + 
                             parseFloat(deductionWeights.sand.kgs) || 0 + 
                             parseFloat(deductionWeights.weightShortage.kgs) || 0;
      const updatedNetWt = selectedPreGR.net_wt - totalDeductions;
      
      console.log('Calculated values:', {
        totalDeductions,
        updatedNetWt,
        selectedPreGR: selectedPreGR.pre_gr_id,
        calculatedExportData,
        calculatedValues,
        deductionWeights,
        finalBagCounts
      });

      console.log('Calling RPC function...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_gqr_and_update_pre_gr', {
          p_pre_gr_id: selectedPreGR.pre_gr_id,
          p_export_quality_weight: calculatedExportData.exportKgs,
          p_rot_weight: parseFloat(deductionWeights.rot.kgs) || 0,
          p_doubles_weight: parseFloat(deductionWeights.doubles.kgs) || 0,
          p_sand_weight: parseFloat(deductionWeights.sand.kgs) || 0,
          p_weight_shortage_weight: parseFloat(deductionWeights.weightShortage.kgs) || 0,
          p_gap_items_weight: parseFloat(deductionWeights.gapItems.kgs) || 0,
          p_podi_weight: parseFloat(deductionWeights.podi.kgs) || 0,
          p_total_wastage_weight: calculatedValues.totalWastage,
          p_total_value_received: calculatedValues.totalValueReceived,
          p_final_podi_bags: parseInt(finalBagCounts.podi_bags) || 0,
          p_final_gap_item1_bags: parseInt(finalBagCounts.gap_item1_bags) || 0,
          p_final_gap_item2_bags: parseInt(finalBagCounts.gap_item2_bags) || 0
        });

      console.log('RPC response:', { rpcData, rpcError });

      if (rpcError) {
        console.error('RPC Error details:', rpcError);
        throw rpcError;
      }

      console.log('GQR created successfully!');
      setFormSuccess('GQR created successfully! Returning to list...');
      setTimeout(() => {
        setPreGREntries(prev => prev.filter(entry => entry.pre_gr_id !== selectedPreGR.pre_gr_id));
        setSelectedPreGR(null);
        setFormSuccess(null);
      }, 2500);

    } catch (err) {
      console.error("=== SUBMIT ERROR ===");
      console.error("Error type:", typeof err);
      console.error("Error message:", err.message);
      console.error("Error details:", err);
      console.error("Error stack:", err.stack);
      
      setError('Failed to create GQR: ' + err.message);
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
                                 <thead className="bg-gray-50 dark:bg-gray-700"><tr>
                   <th className="px-6 py-3 text-left text-xs font-medium uppercase">Pre-GR No.</th>
                   <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
                   <th className="px-6 py-3 text-left text-xs font-medium uppercase">GR NO</th>
                   <th className="px-6 py-3 text-left text-xs font-medium uppercase">GR DT</th>
                   <th className="px-6 py-3 text-left text-xs font-medium uppercase">Supplier</th>
                   <th className="px-6 py-3 text-left text-xs font-medium uppercase">Net Wt (kg)</th>
                   <th className="px-6 py-3 text-left text-xs font-medium uppercase">Action</th>
                 </tr></thead>
                                 <tbody>{preGREntries.map((entry) => (
                   <tr key={entry.pre_gr_id}>
                     <td className="px-6 py-4">{entry.pre_gr_vouchernumber}</td>
                     <td className="px-6 py-4">{formatDateDDMMYYYY(entry.date)}</td>
                     <td className="px-6 py-4">{entry.gr_no || 'N/A'}</td>
                     <td className="px-6 py-4">{entry.gr_dt ? formatDateDDMMYYYY(entry.gr_dt) : 'N/A'}</td>
                     <td className="px-6 py-4">{entry.supplier_name}</td>
                     <td className="px-6 py-4 font-semibold">
                       {entry.net_wt || (entry.laden_wt && entry.empty_wt ? entry.laden_wt - entry.empty_wt : 'N/A')}
                     </td>
                     <td className="px-6 py-4"><Button variant="primary" onClick={() => handleSelectPreGR(entry)}>Create GQR</Button></td>
                   </tr>))}
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
           
           {/* Debug Information */}
           <div className="bg-yellow-100 p-4 rounded-md text-sm">
             <strong>Debug Info:</strong><br/>
             Form Submitting: {formSubmitting ? 'YES' : 'NO'}<br/>
             Calculated Values: {calculatedValues ? 'Available' : 'NULL'}<br/>
             Weight Difference: {calculatedValues?.weightDifference?.toFixed(2) || 'N/A'}<br/>
             Export Kgs: {calculatedExportData?.exportKgs?.toFixed(2) || 'N/A'}<br/>
             Selected Pre-GR ID: {selectedPreGR?.pre_gr_id || 'N/A'}
           </div>

          {/* 1. Purchase Order Details Section */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 border-b pb-2">Purchase Order Details (GR NO: {selectedPreGR.gr_no || selectedPreGR.po_vouchernumber})</h2>
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
          {/* CORRECTED: Pre-GR Details Section */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2 border-b pb-2">Pre-GR Details (GR NO: {selectedPreGR.gr_no || selectedPreGR.pre_gr_vouchernumber})</h2>
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
      {/* CORRECTED: Summary & Financials Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Section: GQR Weight Entry */}
            {/* UPDATED: GQR Segregation Details Form */}
<form onSubmit={handleSubmit} className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
     <h2 className="text-xl font-semibold mb-4">GQR Segregation Details</h2>
   
   
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* These are now the only user inputs - kgs only */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rot Weight (kg)</label>
      {/*<input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" step="0.001" />*/}
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

  <div className="flex justify-end mt-6">
    <Button type="button" variant="secondary" onClick={() => setSelectedPreGR(null)}>Back to List</Button>
    <Button type="submit" variant="primary" className="ml-2" disabled={formSubmitting}>{formSubmitting ? 'Saving...' : 'Save GQR'}</Button>
  </div>
</form>
            {/* UPDATED: Right Section: Summary & Financials */}
<div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg shadow-inner space-y-4">
  <h2 className="text-xl font-semibold mb-2">Summary & Financials</h2>
  
  {/* Cost Calculations */}
  {calculatedValues && (
    <div className="space-y-2">
      <h3 className="text-md font-semibold text-gray-600">Cost Calculation (Payable to Vendor)</h3>
      <div className="flex justify-between"><span>Total Value Received:</span> <span className="font-bold">₹{calculatedValues.totalValueReceived.toFixed(2)}</span></div>
      <div className="flex justify-between"><span>Total Wastage:</span> <span className="font-bold">{calculatedValues.totalWastage.toFixed(2)} kg</span></div>
      <div className="flex justify-between font-semibold border-t pt-2 mt-2"><span>Weight Accounted:</span> <span>{calculatedValues.totalWeightAccounted.toFixed(2)} kg</span></div>
    </div>
  )}
</div>
          </div>
        </div>
      )}
    </div>
  );
}