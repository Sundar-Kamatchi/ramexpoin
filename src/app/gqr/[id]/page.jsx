'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { formatDateDDMMYYYY } from '@/utils/dateUtils';

export default function GQREditPage() {
  const router = useRouter();
  const params = useParams();
  const gqrId = params.id;
  // --- State Management ---
  const [gqrData, setGqrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Editable form fields
  const [weights, setWeights] = useState({
    exportQuality: { kgs: '' }, rot: { kgs: '' }, doubles: { kgs: '' },
    sand: { kgs: '' }, gapItems: { kgs: '' }, podi: { kgs: '' },
  });
  const [finalBagCounts, setFinalBagCounts] = useState({
    podi_bags: '', gap_item1_bags: '', gap_item2_bags: '',
  });
  // Submission status
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // --- Data Fetching ---
  useEffect(() => {
    if (!gqrId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let session = null;
        let userIsAdmin = false;
        
        try {
            const { data: { session: sessionData } } = await supabase.auth.getSession();
            session = sessionData;
            userIsAdmin = session?.user?.email?.startsWith('admin');
        } catch (error) {
            console.log('GQR Edit: Auth session missing, treating as non-admin');
            userIsAdmin = false;
        }
        
        setIsAdmin(userIsAdmin);

        // Try the RPC function first
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_gqr_details_by_id', { p_gqr_id: gqrId });
        
        if (rpcError) {
          console.warn('GQR Detail: RPC function failed, trying direct query:', rpcError);
          
          // Fallback: Direct query approach
          const { data: directData, error: directError } = await supabase
            .from('gqr_entry')
            .select(`
              id,
              created_at,
              total_value_received,
              export_quality_weight,
              podi_weight,
              rot_weight,
              doubles_weight,
              sand_weight,
              gap_items_weight,
              weight_shortage,
              pre_gr_entry (
                id,
                vouchernumber,
                net_wt,
                ladden_wt,
                empty_wt,
                purchase_orders (
                  id,
                  vouchernumber,
                  date,
                  rate,
                  podi_rate,
                  damage_allowed_kgs_ton,
                  cargo,
                  suppliers ( name ),
                  item_master ( item_name )
                )
              )
            `)
            .eq('id', gqrId)
            .single();
          
          if (directError) {
            throw new Error(`Direct query failed: ${directError.message}`);
          }
          
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

            weight_shortage: directData.weight_shortage || 0,
            po_rate: directData.pre_gr_entry?.purchase_orders?.rate || 0,
            podi_rate: directData.pre_gr_entry?.purchase_orders?.podi_rate || 0,
            net_wt: (directData.pre_gr_entry?.ladden_wt || 0) - (directData.pre_gr_entry?.empty_wt || 0),
            gqr_id: directData.id,
            pre_gr_id: directData.pre_gr_entry?.id,
            
            // PO Details
            po_vouchernumber: directData.pre_gr_entry?.purchase_orders?.vouchernumber || '',
            po_date: directData.pre_gr_entry?.purchase_orders?.date || '',
            supplier_name: directData.pre_gr_entry?.purchase_orders?.suppliers?.name || '',
            item_name: directData.pre_gr_entry?.purchase_orders?.item_master?.item_name || '',
            cargo: directData.pre_gr_entry?.purchase_orders?.cargo || 0,
            damage_allowed_kgs_ton: directData.pre_gr_entry?.purchase_orders?.damage_allowed_kgs_ton || 0,
            
            // Pre-GR Details
            pre_gr_vouchernumber: directData.pre_gr_entry?.vouchernumber || ''
          };
          
          setGqrData(fetchedData);
          setWeights({
            exportQuality: { kgs: fetchedData.export_quality_weight || '' },
            rot: { kgs: fetchedData.rot_weight || '' },
            doubles: { kgs: fetchedData.doubles_weight || '' },
            sand: { kgs: fetchedData.sand_weight || '' },
            gapItems: { kgs: fetchedData.gap_items_weight || '' },
            podi: { kgs: fetchedData.podi_weight || '' },
          });
          setFinalBagCounts({
            podi_bags: '',
            gap_item1_bags: '',
            gap_item2_bags: '',
          });
          
          
        } else {
          // RPC function worked
          if (rpcData && rpcData.length > 0) {
            const fetchedData = rpcData[0];
            
            // Ensure all PO fields are available even if RPC doesn't return them
            const completeData = {
              ...fetchedData,
              po_vouchernumber: fetchedData.po_vouchernumber || fetchedData.pre_gr_entry?.purchase_orders?.vouchernumber || '',
              po_date: fetchedData.po_date || fetchedData.pre_gr_entry?.purchase_orders?.date || '',
              supplier_name: fetchedData.supplier_name || fetchedData.pre_gr_entry?.purchase_orders?.suppliers?.name || '',
              item_name: fetchedData.item_name || fetchedData.pre_gr_entry?.purchase_orders?.item_master?.item_name || '',
              cargo: fetchedData.cargo || fetchedData.pre_gr_entry?.purchase_orders?.cargo || 0,
              damage_allowed_kgs_ton: fetchedData.damage_allowed_kgs_ton || fetchedData.pre_gr_entry?.purchase_orders?.damage_allowed_kgs_ton || 0,
              pre_gr_vouchernumber: fetchedData.pre_gr_vouchernumber || fetchedData.pre_gr_entry?.vouchernumber || '',
              // Calculate net weight if not provided by RPC
              net_wt: fetchedData.net_wt || (fetchedData.pre_gr_entry?.ladden_wt || 0) - (fetchedData.pre_gr_entry?.empty_wt || 0)
            };
            
            setGqrData(completeData);
            setWeights({
              exportQuality: { kgs: fetchedData.export_quality_weight || '' },
              rot: { kgs: fetchedData.rot_weight || '' },
              doubles: { kgs: fetchedData.doubles_weight || '' },
              sand: { kgs: fetchedData.sand_weight || '' },
              gapItems: { kgs: fetchedData.gap_items_weight || '' },
              podi: { kgs: fetchedData.podi_weight || '' },
            });
            setFinalBagCounts({
              podi_bags: '',
              gap_item1_bags: '',
              gap_item2_bags: '',
            });

          } else {
            setError('GQR not found.');
          }
        }
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
    if (!gqrData) return { totalValueReceived: 0, totalWastage: 0, actualYield: 0, totalWastagePercentage: 0 };
    
    const parse = (val) => parseFloat(val) || 0;
    const exportKgs = parse(weights.exportQuality.kgs);
    const gapKgs = parse(weights.gapItems.kgs);
    const podiKgs = parse(weights.podi.kgs);
    const rotKgs = parse(weights.rot.kgs);
    const doublesKgs = parse(weights.doubles.kgs);
    const sandKgs = parse(weights.sand.kgs);

    const poRate = gqrData.po_rate || 0;
    const podiRate = gqrData.podi_rate || 0;

    const totalWastage = rotKgs + doublesKgs + sandKgs;
    const totalValueReceived = (exportKgs * poRate) + (gapKgs * poRate) + (podiKgs * podiRate);
    const actualYield = gqrData.net_wt > 0 ? (exportKgs / gqrData.net_wt) * 100 : 0;
    const totalWastagePercentage = gqrData.net_wt > 0 ? (totalWastage / gqrData.net_wt) * 100 : 0;

    return { totalValueReceived, totalWastage, actualYield, totalWastagePercentage };
  }, [weights, gqrData]);

  // Calculate total wastage
  const totalWastage = useMemo(() => {
    const rotKgs = parseFloat(weights.rot.kgs) || 0;
    const sandKgs = parseFloat(weights.sand.kgs) || 0;
    const doublesKgs = parseFloat(weights.doubles.kgs) || 0;
    const gapItemsKgs = parseFloat(weights.gapItems.kgs) || 0;
    const podiKgs = parseFloat(weights.podi.kgs) || 0;
    
    return rotKgs + sandKgs + doublesKgs + gapItemsKgs + podiKgs;
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
    setWeights(prev => ({ ...prev, [field]: { ...prev[field], kgs: value } }));
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


  
  // --- Render Logic ---
  if (loading) return <div className="text-center p-8">Loading GQR Data...</div>;
  if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
  if (!gqrData) return <div className="text-center p-8">GQR not found.</div>;
  


  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 mt-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit GQR (ID: {gqrId})</h1>
        <Button onClick={() => router.push('/gqr-list')} variant="secondary">Back to List</Button>
      </div>

      {successMessage && <div className="bg-green-100 text-green-700 p-4 rounded-md">{successMessage}</div>}
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2 border-b pb-2">Purchase Order Details (Ref: {gqrData.po_vouchernumber})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><strong>Supplier:</strong> {gqrData.supplier_name}</div>
            <div><strong>Item:</strong> {gqrData.item_name}</div>
            <div><strong>PO Date:</strong> {formatDateDDMMYYYY(gqrData.po_date)}</div>
            <div><strong>PO Rate:</strong> ₹{gqrData.po_rate}/kg</div>
          </div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2 border-b pb-2">Pre-GR Details (Ref: {gqrData.pre_gr_vouchernumber})</h2>
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
                type="number" 
                name="rot" 
                value={weights.rot.kgs} 
                onChange={(e) => handleWeightChange('rot', 'kgs', e.target.value)} 
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sand/Debris (kg)</label>
              <input 
                type="number" 
                name="sand" 
                value={weights.sand.kgs} 
                onChange={(e) => handleWeightChange('sand', 'kgs', e.target.value)} 
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Doubles (kg)</label>
              <input 
                type="number" 
                name="doubles" 
                value={weights.doubles.kgs} 
                onChange={(e) => handleWeightChange('doubles', 'kgs', e.target.value)} 
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
          </div>
          
          {/* Second Row: Gap Items, Podi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Gap Items (kg)</label>
              <input 
                type="number" 
                name="gapItems" 
                value={weights.gapItems.kgs} 
                onChange={(e) => handleWeightChange('gapItems', 'kgs', e.target.value)} 
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Podi (kg)</label>
              <input 
                type="number" 
                name="podi" 
                value={weights.podi.kgs} 
                onChange={(e) => handleWeightChange('podi', 'kgs', e.target.value)} 
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
          </div>
          
          {/* Third Row: Damage Allowed, Actual Wastage, Total Wastage, Export Quality */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Damage Allowed %/Ton</label>
              <input 
                type="number" 
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
                value={calculatedExportQuality} 
                className="w-full mt-1 p-2 border rounded bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-semibold cursor-not-allowed border-blue-200 dark:border-blue-700"
                readOnly
                disabled
              />
            </div>
          </div>
                 </div>
         
         <div className="flex justify-end gap-4 mt-6">
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
              disabled={formSubmitting || gqrData.gqr_status === 'Finalized'}
            >
              {formSubmitting ? 'Saving...' : 'Update GQR'}
            </Button>
         </div>
       </form>
    </div>
  );
}
