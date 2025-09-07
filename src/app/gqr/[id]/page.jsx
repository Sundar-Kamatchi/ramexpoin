'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { fetchGQRWithRelationships } from '@/lib/gqrDataFetcher';
import { Button } from '@/components/ui/button';
import { formatDateDDMMYYYY } from '@/utils/dateUtils';
import DeleteButton from '@/components/DeleteButton';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export default function GQREditPage() {
  const router = useRouter();
  const params = useParams();
  const gqrId = params.id;
  const { isAdmin } = useAuth();
  // --- State Management ---
  const [gqrData, setGqrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editable form fields
  const [weights, setWeights] = useState({
    exportQuality: { kgs: '' }, rot: { kgs: '' }, doubles: { kgs: '' },
    sand: { kgs: '' }, weightShortage: { kgs: '' }, gapItems: { kgs: '' }, podi: { kgs: '' },
  });
  const [finalBagCounts, setFinalBagCounts] = useState({
    podi_bags: '', gap_item1_bags: '', gap_item2_bags: '',
  });
  // Submission status
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Reverse status confirmation
  const [showReverseConfirm, setShowReverseConfirm] = useState(false);
  const [reverseConfirmStep, setReverseConfirmStep] = useState(1);
  const [reverseSubmitting, setReverseSubmitting] = useState(false);
  
  // --- Data Fetching ---
  useEffect(() => {
    if (!gqrId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {

        // Always use the production-safe utility function to avoid relationship issues
        console.log('GQR Detail: Using production-safe utility function...');
        const directData = await fetchGQRWithRelationships(gqrId);
          
          // Transform the direct query result to match expected structure
          const fetchedData = {
            id: directData.id,
            created_at: directData.created_at,
            total_value_received: directData.total_value_received,
            export_quality_weight: directData.export_quality_weight || 0,
            podi_weight: directData.podi_weight || 0,
            rot_weight: directData.rot_weight || 0,
            doubles_weight: directData.doubles_weight || 0,
            sand_weight: directData.sand_weight || 0,
            gap_items_weight: directData.gap_items_weight || 0,
            gqr_status: directData.gqr_status || 'Open',

            weight_shortage: directData.weight_shortage_weight || 0,
            po_rate: directData.pre_gr_entry?.purchase_orders?.rate || 0,
            podi_rate: directData.pre_gr_entry?.purchase_orders?.podi_rate || 0,
            net_wt: (directData.pre_gr_entry?.ladden_wt || 0) - (directData.pre_gr_entry?.empty_wt || 0),
            gqr_id: directData.id,
            pre_gr_id: directData.pre_gr_entry?.id,
            
            // PO Details
            po_gr_no: directData.pre_gr_entry?.purchase_orders?.vouchernumber || '',
            po_date: directData.pre_gr_entry?.purchase_orders?.date || '',
            supplier_name: directData.pre_gr_entry?.purchase_orders?.suppliers?.name || '',
            item_name: directData.pre_gr_entry?.purchase_orders?.item_master?.item_name || '',
            cargo: directData.pre_gr_entry?.purchase_orders?.cargo || 0,
            damage_allowed_kgs_ton: directData.pre_gr_entry?.purchase_orders?.damage_allowed_kgs_ton || 0,
            
            // Pre-GR Details
            pre_gr_gr_no: directData.pre_gr_entry?.gr_no || '',
            gr_no: directData.pre_gr_entry?.gr_no || '',
            gr_dt: directData.pre_gr_entry?.gr_dt || ''
          };
          
          setGqrData(fetchedData);
          setWeights(prev => ({
            ...prev,
            exportQuality: { kgs: fetchedData.export_quality_weight || '' },
            rot: { kgs: fetchedData.rot_weight || '' },
            doubles: { kgs: fetchedData.doubles_weight || '' },
            sand: { kgs: fetchedData.sand_weight || '' },
            weightShortage: { kgs: fetchedData.weight_shortage || '' },
            gapItems: { kgs: fetchedData.gap_items_weight || '' },
            podi: { kgs: fetchedData.podi_weight || '' },
          }));
          setFinalBagCounts({
            podi_bags: '',
            gap_item1_bags: '',
            gap_item2_bags: '',
          });
          
      } catch (err) {
        setError(`Failed to fetch data: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gqrId]);

  // --- Memoized Calculations ---
  const calculatedValues = useMemo(() => {
    if (!gqrData || !weights) return { totalValueReceived: 0, totalWastage: 0, actualYield: 0, totalWastagePercentage: 0 };
    
    const parse = (val) => parseFloat(val) || 0;
    const exportKgs = parse(weights.exportQuality?.kgs);
    const gapKgs = parse(weights.gapItems?.kgs);
    const podiKgs = parse(weights.podi?.kgs);
    const rotKgs = parse(weights.rot?.kgs);
    const doublesKgs = parse(weights.doubles?.kgs);
    const sandKgs = parse(weights.sand?.kgs);
    const weightShortageKgs = parse(weights.weightShortage?.kgs);

    const poRate = gqrData.po_rate || 0;
    const podiRate = gqrData.podi_rate || 0;

    const totalWastage = rotKgs + doublesKgs + sandKgs + weightShortageKgs;
    const totalValueReceived = (exportKgs * poRate) + (gapKgs * poRate) + (podiKgs * podiRate);
    const actualYield = gqrData.net_wt > 0 ? (exportKgs / gqrData.net_wt) * 100 : 0;
    const totalWastagePercentage = gqrData.net_wt > 0 ? (totalWastage / gqrData.net_wt) * 100 : 0;

    return { totalValueReceived, totalWastage, actualYield, totalWastagePercentage };
  }, [weights, gqrData]);

  // Calculate total wastage
  const totalWastage = useMemo(() => {
    if (!weights) return 0;
    
    const rotKgs = parseFloat(weights.rot?.kgs) || 0;
    const sandKgs = parseFloat(weights.sand?.kgs) || 0;
    const doublesKgs = parseFloat(weights.doubles?.kgs) || 0;
    const weightShortageKgs = parseFloat(weights.weightShortage?.kgs) || 0;
    const gapItemsKgs = parseFloat(weights.gapItems?.kgs) || 0;
    const podiKgs = parseFloat(weights.podi?.kgs) || 0;
    
    return rotKgs + sandKgs + doublesKgs + weightShortageKgs + gapItemsKgs + podiKgs;
  }, [weights]);

  // Calculate damage allowed percentage per ton
  const damageAllowedPercentPerTon = useMemo(() => {
    if (!gqrData?.damage_allowed_kgs_ton || gqrData.damage_allowed_kgs_ton === 0) return 0;
    return (1000 / gqrData.damage_allowed_kgs_ton);
  }, [gqrData?.damage_allowed_kgs_ton]);

  // Calculate actual wastage per ton
  const actualWastagePerTon = useMemo(() => {
    if (!gqrData?.net_wt || gqrData.net_wt === 0) return 0;
    return (totalWastage / parseFloat(gqrData.net_wt)) * 100;
  }, [totalWastage, gqrData?.net_wt]);

  // Calculate export quality automatically
  const calculatedExportQuality = useMemo(() => {
    if (!gqrData?.net_wt) return 0;
    
    const netWt = parseFloat(gqrData.net_wt) || 0;
    
    // Export Quality = Net Weight - Total Wastage
    return Math.max(0, netWt - totalWastage);
  }, [gqrData?.net_wt, totalWastage]);




  
  // --- Handlers ---
  const handleWeightChange = (field, unit, value) => {
    // Allow empty string or valid numbers (including decimals)
    if (value === '' || !isNaN(value)) {
      setWeights(prev => ({ ...prev, [field]: { ...prev[field], [unit]: value } }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.rpc('update_gqr_and_pre_gr', {
        p_gqr_id: gqrData.gqr_id,
        p_pre_gr_id: gqrData.pre_gr_id,
        p_export_quality_weight: parseFloat(weights.exportQuality.kgs) || 0,
        p_rot_weight: parseFloat(weights.rot.kgs) || 0,
        p_doubles_weight: parseFloat(weights.doubles.kgs) || 0,
        p_sand_weight: parseFloat(weights.sand.kgs) || 0,
        p_gap_items_weight: parseFloat(weights.gapItems.kgs) || 0,
        p_podi_weight: parseFloat(weights.podi.kgs) || 0,
        p_total_wastage_weight: calculatedValues.totalWastage,
        p_total_value_received: calculatedValues.totalValueReceived,
        p_final_podi_bags: parseInt(finalBagCounts.podi_bags) || 0,
        p_final_gap_item1_bags: parseInt(finalBagCounts.gap_item1_bags) || 0,
        p_final_gap_item2_bags: parseInt(finalBagCounts.gap_item2_bags) || 0,
      });
      if (error) throw error;
      setSuccessMessage('GQR updated successfully!');
      setTimeout(() => {
        router.push('/gqr-list');
      }, 2000);
 
    } catch (err) {
      setError(`Update failed: ${err.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle reverse status confirmation
  const handleReverseStatus = () => {
    if (reverseConfirmStep === 1) {
      setReverseConfirmStep(2);
      toast.warning('⚠️ Second confirmation required!', {
        description: 'Click "CONFIRM REVERSE" again to proceed with reversing the GQR status.',
        duration: 5000,
      });
    } else {
      executeReverseStatus();
    }
  };

  // Execute the actual status reversal
  const executeReverseStatus = async () => {
    setReverseSubmitting(true);
    try {
      const { error } = await supabase
        .from('gqr_entry')
        .update({ gqr_status: 'Open' })
        .eq('id', gqrId);

      if (error) throw error;

      toast.success('✅ GQR Status Reversed Successfully!', {
        description: 'GQR status has been changed from "Closed" to "Open". You can now edit the GQR.',
        duration: 5000,
      });

      // Refresh the page data
      window.location.reload();
      
    } catch (err) {
      toast.error('❌ Failed to Reverse GQR Status', {
        description: `Error: ${err.message}`,
        duration: 5000,
      });
    } finally {
      setReverseSubmitting(false);
      setShowReverseConfirm(false);
      setReverseConfirmStep(1);
    }
  };

  // Cancel reverse confirmation
  const cancelReverseConfirm = () => {
    setShowReverseConfirm(false);
    setReverseConfirmStep(1);
    toast.info('ℹ️ Status reversal cancelled', {
      description: 'GQR status remains unchanged.',
      duration: 3000,
    });
  };


  
  // --- Render Logic ---
  if (loading) return <div className="text-center p-8">Loading GQR Data...</div>;
  if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
  if (!gqrData) return <div className="text-center p-8">GQR not found.</div>;
  


  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 mt-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Edit GQR (GR NO: {gqrData?.gqr_no || gqrData?.gr_no || 'N/A'})</h1>
          {gqrData.gqr_status === 'Closed' && (
            <div className="mt-2 flex items-center gap-3">
              <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium inline-block">
                🔒 GQR Finalized - Read Only
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowReverseConfirm(true)}
                  className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors"
                >
                  🔄 Reverse Status (Admin Only)
                </button>
              )}
            </div>
          )}
        </div>
        <Button onClick={() => router.push('/gqr-list')} variant="secondary">Back to List</Button>
      </div>

      {successMessage && <div className="bg-green-100 text-green-700 p-4 rounded-md">{successMessage}</div>}
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2 border-b pb-2">Purchase Order Details (PO No: {gqrData.po_gr_no})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><strong>Supplier:</strong> {gqrData.supplier_name}</div>
            <div><strong>Item:</strong> {gqrData.item_name}</div>
            <div><strong>PO Date:</strong> {formatDateDDMMYYYY(gqrData.po_date)}</div>
            <div><strong>PO Rate:</strong> ₹{gqrData.po_rate}/kg</div>
          </div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2 border-b pb-2">Pre-GR Details (Ref: {gqrData.pre_gr_gr_no})</h2>
        <div className="grid grid-cols-1 gap-4 items-center text-sm text-center">
            <div><p className="font-medium text-gray-500">Net Weight</p><p className="font-bold text-lg text-blue-600 dark:text-blue-400">{gqrData.net_wt} kg</p></div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Update GQR Segregation Details</h2>
        
        {/* Pre-GR Net Weight Display */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Pre-GR Net Weight: {gqrData.net_wt} kg</h3>
        </div>
        
        {/* Input Fields */}
        <div className="space-y-6">
          {/* First Row: Rot, Sand, Doubles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Rot (kg)</label>
              <input 
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                name="rot" 
                value={weights.rot.kgs} 
                onChange={(e) => handleWeightChange('rot', 'kgs', e.target.value)} 
                className="w-full mt-1 p-2 border rounded"
                placeholder="Enter rot weight"
                disabled={gqrData.gqr_status === 'Closed'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sand/Debris (kg)</label>
              <input 
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                name="sand" 
                value={weights.sand.kgs} 
                onChange={(e) => handleWeightChange('sand', 'kgs', e.target.value)} 
                className="w-full mt-1 p-2 border rounded"
                placeholder="Enter sand/debris weight"
                disabled={gqrData.gqr_status === 'Closed'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Doubles (kg)</label>
              <input 
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                name="doubles" 
                value={weights.doubles.kgs} 
                onChange={(e) => handleWeightChange('doubles', 'kgs', e.target.value)} 
                className="w-full mt-1 p-2 border rounded"
                placeholder="Enter doubles weight"
                disabled={gqrData.gqr_status === 'Closed'}
              />
            </div>
          </div>
          
          {/* Second Row: Gap Items, Podi, Weight Shortage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Gap Items (kg)</label>
              <input 
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                name="gapItems" 
                value={weights.gapItems.kgs} 
                onChange={(e) => handleWeightChange('gapItems', 'kgs', e.target.value)} 
                className="w-full mt-1 p-2 border rounded"
                placeholder="Enter gap items weight"
                disabled={gqrData.gqr_status === 'Closed'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Podi (kg)</label>
              <input 
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                name="podi" 
                value={weights.podi.kgs} 
                onChange={(e) => handleWeightChange('podi', 'kgs', e.target.value)} 
                className="w-full mt-1 p-2 border rounded"
                placeholder="Enter podi weight"
                disabled={gqrData.gqr_status === 'Closed'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Weight Shortage (kg)</label>
              <input 
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                name="weightShortage" 
                value={weights.weightShortage.kgs} 
                onChange={(e) => handleWeightChange('weightShortage', 'kgs', e.target.value)} 
                className="w-full mt-1 p-2 border rounded"
                placeholder="Enter weight shortage"
                disabled={gqrData.gqr_status === 'Closed'}
              />
            </div>
          </div>
          
          {/* Third Row: Damage Allowed, Actual Wastage, Total Wastage, Export Quality */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Damage Allowed %/Ton</label>
              <input 
                type="number" 
                step="any"
                value={damageAllowedPercentPerTon.toFixed(2)} 
                className="w-full mt-1 p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 cursor-not-allowed"
                readOnly
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium">Actual Wastage %/Ton</label>
              <input 
                type="number" 
                step="any"
                value={actualWastagePerTon.toFixed(2)} 
                className="w-full mt-1 p-2 border rounded bg-yellow-50 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 font-semibold cursor-not-allowed border-yellow-200 dark:border-yellow-700"
                readOnly
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium">Total Wastage (kg)</label>
              <input 
                type="number" 
                step="any"
                value={totalWastage} 
                className="w-full mt-1 p-2 border rounded bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100 font-semibold cursor-not-allowed border-red-200 dark:border-red-700"
                readOnly
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                Export Quality (kg)
                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">Auto-calculated</span>
              </label>
              <input 
                type="number" 
                step="any"
                value={calculatedExportQuality} 
                className="w-full mt-1 p-2 border rounded bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-semibold cursor-not-allowed border-blue-200 dark:border-blue-700"
                readOnly
                disabled
              />
            </div>
          </div>
                 </div>
         
         <div className="flex justify-between items-center mt-6">
           <div>
             <DeleteButton
               itemId={gqrId}
               itemName={`GQR ${gqrId}`}
               disabled={gqrData.gqr_status === 'Closed'}
               onDelete={async (gqrId) => {
                 try {
                   // First, get the pre_gr_id from the GQR entry before deleting
                   const { data: gqrData, error: fetchError } = await supabase
                     .from('gqr_entry')
                     .select('pre_gr_id')
                     .eq('id', gqrId)
                     .single();
                   
                   if (fetchError) throw fetchError;
                   
                   // Delete the GQR entry
                   const { error: deleteError } = await supabase
                     .from('gqr_entry')
                     .delete()
                     .eq('id', gqrId);
                   
                   if (deleteError) throw deleteError;
                   
                   // Update the pre_gr_entry to set is_gqr_created = false
                   if (gqrData.pre_gr_id) {
                     const { error: updateError } = await supabase
                       .from('pre_gr_entry')
                       .update({ is_gqr_created: false })
                       .eq('id', gqrData.pre_gr_id);
                     
                     if (updateError) {
                       console.warn('Warning: Failed to update pre_gr_entry is_gqr_created flag:', updateError);
                       // Don't throw error here as the main deletion was successful
                     }
                   }
                   
                   router.push('/gqr-list');
                 } catch (error) {
                   console.error('Error deleting GQR:', error);
                   throw error;
                 }
               }}
               isAdmin={isAdmin}
               variant="destructive"
               size="sm"
             />
           </div>
           <div className="flex gap-4">
             {/* Cancel Button */}
             <Button 
               type="button" 
               variant="secondary" 
               onClick={() => router.push('/gqr-list')}
               disabled={formSubmitting}
             >
               Cancel
             </Button>
             
             {/* Update Button */}
              <Button 
                type="submit" 
                variant="primary" 
                disabled={formSubmitting || gqrData.gqr_status === 'Closed'}
              >
                {formSubmitting ? 'Saving...' : 'Update GQR'}
              </Button>
           </div>
         </div>
       </form>

       {/* Reverse Status Confirmation Dialog */}
       {showReverseConfirm && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
             <div className="text-center">
               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                 <span className="text-2xl">⚠️</span>
               </div>
               
               {reverseConfirmStep === 1 ? (
                 <>
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                     Reverse GQR Status?
                   </h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                     This will change the GQR status from <strong>"Closed"</strong> to <strong>"Open"</strong>, 
                     allowing it to be edited again. This action requires double confirmation.
                   </p>
                 </>
               ) : (
                 <>
                   <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                     Final Confirmation Required!
                   </h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                     <strong>Are you absolutely sure?</strong> This will reverse the finalized GQR status 
                     and make it editable again. This action cannot be undone easily.
                   </p>
                 </>
               )}
               
               <div className="flex gap-3 justify-center">
                 <button
                   onClick={cancelReverseConfirm}
                   className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                   disabled={reverseSubmitting}
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleReverseStatus}
                   disabled={reverseSubmitting}
                   className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                     reverseConfirmStep === 1 
                       ? 'bg-orange-600 hover:bg-orange-700' 
                       : 'bg-red-600 hover:bg-red-700'
                   } ${reverseSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   {reverseSubmitting ? (
                     'Processing...'
                   ) : reverseConfirmStep === 1 ? (
                     'Continue to Final Confirmation'
                   ) : (
                     'CONFIRM REVERSE'
                   )}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}