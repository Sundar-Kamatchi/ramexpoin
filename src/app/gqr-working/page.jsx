'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { GQRPrint } from '@/utils/gqr_print';
import { formatDateDDMMYYYY } from '@/utils/dateUtils';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

export default function GQRWorkingPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [gqrList, setGqrList] = useState([]);
  const [selectedGqr, setSelectedGqr] = useState(null);
  const [gqrData, setGqrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Working sheet state - Fixed base values as per requirements
  const [estimatedValues, setEstimatedValues] = useState({
    cargoWeight: 20000, // 20MT = 20000kg (fixed)
    assuredCargoPercent: 80, // Fixed at 80%
    damageAllowedKgsPerTon: 0, // Will be set from database
    ratePerKg: 0, // Will be set from PO rate
    podiRatePerKg: 0, // Will be set from PO podi rate
    wastagePaymentCondition: 10, // Fixed at 10%
  });

  const [actualValues, setActualValues] = useState({
    cargoWeight: 0,
    podiWeight: 0,
    wastageWeight: 0,
    gapWeight: 0,
    ratePerKg: 0,
    podiRatePerKg: 0,
    gapRatePerKg: 0,
    wastageKgs: 0, // New field for adjustable wastage
    rotWeight: 0,
    doublesWeight: 0,
    sandWeight: 0,
    weightShortage: 0,
  });

  // New state for adjustable damage allowed value
  const [adjustableDamageAllowed, setAdjustableDamageAllowed] = useState(0);
  const [finalizing, setFinalizing] = useState(false);
  const [debugCounter, setDebugCounter] = useState(0);

// Use AuthProvider's loading state
useEffect(() => {
  setSessionLoading(authLoading);
}, [authLoading]);
  // Fetch unfinalized GQRs
  const fetchUnfinalizedGQRs = async () => {
    setLoading(true);
    try {
              const { data, error } = await supabase
          .from('gqr_entry')
          .select(`
            id,
            created_at,
            total_value_received,
            gqr_status,
            pre_gr_entry (
              vouchernumber,
              net_wt,
              gr_dt,
              suppliers ( name )
            )
          `)
          .order('created_at', { ascending: false });

      if (error) throw error;
      setGqrList(data || []);
    } catch (err) {
      setError('Failed to load GQRs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionLoading) return; // Wait for session check to complete
    fetchUnfinalizedGQRs();
  }, [sessionLoading]);

  // Fetch detailed GQR data when selected
  useEffect(() => {
    if (!selectedGqr) return;
    fetchGQRDetails();
  }, [selectedGqr]);

  const fetchGQRDetails = async () => {
    if (!selectedGqr) return;
    
    try {
      console.log('GQR Working: Fetching details for GQR ID:', selectedGqr);
      setLoading(true);
      
      // Try the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_gqr_details_by_id', { 
        p_gqr_id: selectedGqr
      });
      
      if (rpcError) {
        console.warn('GQR Working: RPC function failed, trying direct query:', rpcError);
        
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
            volatile_po_rate,
            volatile_gap_item_rate,
            volatile_podi_rate,
            volatile_wastage_kgs_per_ton,
            gqr_status,
            pre_gr_entry (
              id,
              vouchernumber,
              date,
              net_wt,
              ladden_wt,
              empty_wt,
              purchase_orders (
                rate,
                podi_rate,
                quantity,
                damage_allowed_kgs_ton,
                cargo,
                created_at,
                suppliers ( name ),
                item_master ( item_name )
              )
            )
          `)
          .eq('id', selectedGqr)
          .single();
        
        if (directError) {
          throw new Error(`Direct query failed: ${directError.message}`);
        }
        
        console.log('GQR Working: Direct query result:', directData);
        console.log('GQR Working: Purchase order data:', directData.pre_gr_entry?.purchase_orders);
        
        // Transform the direct query result to match expected structure
        const gqr = {
          id: directData.id,
          created_at: directData.created_at,
          total_value_received: directData.total_value_received,
          export_quality_weight: directData.export_quality_weight || 0,
          podi_weight: directData.podi_weight || 0,
          rot_weight: directData.rot_weight || 0,
          doubles_weight: directData.doubles_weight || 0,
          sand_weight: directData.sand_weight || 0,
          gap_items_weight: directData.gap_items_weight || 0,
          volatile_po_rate: directData.volatile_po_rate,
          volatile_gap_item_rate: directData.volatile_gap_item_rate,
          volatile_podi_rate: directData.volatile_podi_rate,
          volatile_wastage_kgs_per_ton: directData.volatile_wastage_kgs_per_ton,
          gqr_status: directData.gqr_status || 'Open',
          rate: directData.pre_gr_entry?.purchase_orders?.rate || 0,
          podi_rate: directData.pre_gr_entry?.purchase_orders?.podi_rate || 0,
          po_quantity: directData.pre_gr_entry?.purchase_orders?.quantity || 0,
          po_date: directData.pre_gr_entry?.purchase_orders?.created_at,
          pre_gr_entry_id: directData.pre_gr_entry?.id,
          vouchernumber: directData.pre_gr_entry?.vouchernumber,
          pre_gr_date: directData.pre_gr_entry?.date,
          net_wt: directData.pre_gr_entry?.net_wt || ((directData.pre_gr_entry?.ladden_wt || 0) - (directData.pre_gr_entry?.empty_wt || 0)), // Use stored net_wt or calculate from laden_wt - empty_wt
          supplier_name: directData.pre_gr_entry?.purchase_orders?.suppliers?.name,
          item_name: directData.pre_gr_entry?.purchase_orders?.item_master?.item_name,
          assured_cargo_percent: directData.pre_gr_entry?.purchase_orders?.cargo,
          damage_allowed_kgs_ton: directData.pre_gr_entry?.purchase_orders?.damage_allowed_kgs_ton
        };
        
        console.log('GQR Working: Setting GQR data:', gqr);
        setGqrData(gqr);
        
        // Set actual values from GQR data
        setActualValues(prev => ({
          ...prev, // Preserve existing input values
          cargoWeight: gqr.net_wt || 0, // Use pre-GR net weight (laden wt - empty wt) instead of export_quality_weight
          podiWeight: gqr.podi_weight || 0,
          wastageWeight: (gqr.rot_weight || 0) + (gqr.doubles_weight || 0) + (gqr.sand_weight || 0),
          gapWeight: gqr.gap_items_weight || 0,
          ratePerKg: gqr.volatile_po_rate || gqr.rate || 0,
          podiRatePerKg: gqr.volatile_podi_rate || gqr.podi_rate || 0,
          gapRatePerKg: gqr.volatile_gap_item_rate || gqr.rate || 0,
          wastageKgs: (gqr.rot_weight || 0) + (gqr.doubles_weight || 0) + (gqr.sand_weight || 0), // Initialize with actual wastage
        }));
        
        // Set estimated values with PO rates and damage allowed kgs per ton from database
        setEstimatedValues(prev => ({
          ...prev,
          ratePerKg: gqr.rate || 0,
          podiRatePerKg: gqr.podi_rate || 0,
          assuredCargoPercent: 80, // Default to 80%
          damageAllowedKgsPerTon: directData.pre_gr_entry?.purchase_orders?.damage_allowed_kgs_ton || 100, // Default to 100 kgs per ton
        }));
        
        // Set adjustable damage allowed value from PO or volatile field
        const damageAllowed = gqr.volatile_wastage_kgs_per_ton || directData.pre_gr_entry?.purchase_orders?.damage_allowed_kgs_ton || 100;
        console.log('GQR Working: Setting adjustable damage allowed from direct query:', damageAllowed);
        setAdjustableDamageAllowed(damageAllowed);
        
        setLoading(false);
      } else {
        // RPC function worked
        console.log('GQR Working: RPC result:', rpcData);
        if (rpcData && rpcData.length > 0) {
          const gqr = {
            ...rpcData[0],
            gqr_status: rpcData[0].gqr_status || 'Open',
            pre_gr_date: rpcData[0].pre_gr_date || rpcData[0].date
          };
          console.log('GQR Working: Setting GQR data from RPC:', gqr);
          setGqrData(gqr);
          
          // Set actual values from GQR data
          setActualValues(prev => ({
            ...prev, // Preserve existing input values
            cargoWeight: gqr.net_wt || 0,
            podiWeight: gqr.podi_weight || 0,
            wastageWeight: (gqr.rot_weight || 0) + (gqr.doubles_weight || 0) + (gqr.sand_weight || 0),
            gapWeight: gqr.gap_items_weight || 0,
            ratePerKg: gqr.volatile_po_rate || gqr.rate || 0,
            podiRatePerKg: gqr.volatile_podi_rate || gqr.podi_rate || 0,
            gapRatePerKg: gqr.volatile_gap_item_rate || gqr.rate || 0,
            wastageKgs: (gqr.rot_weight || 0) + (gqr.doubles_weight || 0) + (gqr.sand_weight || 0),
          }));
          
          // Set estimated values with PO rates
          setEstimatedValues(prev => ({
            ...prev,
            ratePerKg: gqr.rate || 10,
            podiRatePerKg: gqr.podi_rate || 6,
            damageAllowedKgsPerTon: gqr.damage_allowed_kgs_ton || 100,
          }));
          
          // Set adjustable damage allowed value from PO or volatile field
          const damageAllowed = gqr.volatile_wastage_kgs_per_ton || gqr.damage_allowed_kgs_ton || 100;
          console.log('GQR Working: Setting adjustable damage allowed from RPC:', damageAllowed);
          setAdjustableDamageAllowed(damageAllowed);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('GQR Working: Error fetching GQR details:', error);
      setError(error.message);
      setLoading(false);
    }
  };



  // Calculate estimated values based on spreadsheet logic - HARDCODED VALUES
  const estimatedCalculations = useMemo(() => {
    const totalCargo = 20000; // HARDCODED: 20000 kg
    const assuredCargoPercent = 0.80; // HARDCODED: 80%
    const ratePerKg = estimatedValues.ratePerKg || gqrData?.rate || 10; // Use estimated rate (from PO) or default to 10
    const podiRatePerKg = estimatedValues.podiRatePerKg || gqrData?.podi_rate || 6; // Use estimated podi rate (from PO) or default to 6
    const wastageKgsPerTon = gqrData?.gqr_status === 'Closed' ? (gqrData?.volatile_wastage_kgs_per_ton || 100) : 100; // Use volatile value if finalized, otherwise default
    
    // Calculate total cargo value
    const totalCargoValue = totalCargo * ratePerKg; // 20000 * 12 = 240000
    
    // Calculate podi (20% of total cargo)
    const podiKgs = totalCargo * (1 - assuredCargoPercent); // 20000 * 0.20 = 4000 kg
    const podiValue = podiKgs * podiRatePerKg; // 4000 * 6 = 24000
    
    // Calculate wastage (kgs per ton * total cargo in tons)
    const wastageKgs = (wastageKgsPerTon * totalCargo) / 1000; // (100 * 20000) / 1000 = 2000 kg
    const wastagePmt = wastageKgsPerTon * 20; // Wastage PMT for 20 tons (2000 kg for 100 kg/ton)
    const wastageValue = wastageKgs * ratePerKg; // 2000 * 12 = 24000
    
    // TOTAL CARGO AFTER PODI: Total cargo value minus podi value
    const totalCargoAfterPodiValue = totalCargoValue - podiValue; // 240000 - 24000 = 216000
    const totalCargoAfterPodiKgs = totalCargo - podiKgs; // 20000 - 4000 = 16000
    const totalCargoAfterPodiRate = totalCargoAfterPodiKgs > 0 ? totalCargoAfterPodiValue / totalCargoAfterPodiKgs : 0; // 216000 / 16000 = 13.50
    
         return {
       totalCargo,
       totalCargoValue,
       podiKgs,
       podiValue,
       wastageKgs,
       wastagePmt, // Add the wastagePmt property
       wastageValue,
       totalCargoAfterPodiValue,
       totalCargoAfterPodiKgs,
       totalCargoAfterPodiRate,
       totalValue: totalCargoValue + podiValue + wastageValue,
       podiPercent: (podiKgs / totalCargo) * 100,
       wastagePercent: (wastageKgs / totalCargo) * 100,
     };
  }, [gqrData, estimatedValues]); // Depends on gqrData for PO rates and estimatedValues for rates

  // Calculate actual values based on GQR data
  const actualCalculations = useMemo(() => {
    const totalCargo = gqrData?.net_wt || 0;
    const podiKgs = actualValues.podiWeight || 0;
    const gapKgs = actualValues.gapWeight || 0;
    const wastageKgs = actualValues.wastageKgs || 0;
    const exportQuality = gqrData?.export_quality_weight || 0;

    const wastagePmt = totalCargo > 0 ? (wastageKgs / totalCargo) * 1000 : 0;
    const totalWeight = totalCargo + wastageKgs;

    const cargoValue = totalCargo * actualValues.ratePerKg;
    const podiValue = podiKgs * actualValues.podiRatePerKg;
    const gapValue = gapKgs * actualValues.podiRatePerKg; // Using podi rate for gap items as per formula in table
    const wastageValue = wastageKgs * actualValues.ratePerKg;

    const totalCargoAfterPodiAndGapKgs = totalCargo - podiKgs - gapKgs;
    const totalCargoAfterPodiAndGapValue = cargoValue - (podiValue + gapValue);
    const totalCargoAfterPodiAndGapRate = totalCargoAfterPodiAndGapKgs > 0 ? totalCargoAfterPodiAndGapValue / totalCargoAfterPodiAndGapKgs : 0;

    const netCargoValue = cargoValue - podiValue - gapValue;
    const totalRateAfterPodiDenominator = totalCargo - podiKgs;
    const totalRateAfterPodi = totalRateAfterPodiDenominator ? (cargoValue - podiValue) / totalRateAfterPodiDenominator : 0;

    return {
      totalCargo,
      podiKgs,
      gapKgs,
      wastageKgs,
      exportQuality,
      wastagePmt,
      totalWeight,
      cargoValue,
      podiValue,
      gapValue,
      wastageValue,
      netCargoValue,
      totalValue: cargoValue + podiValue + gapValue + wastageValue,
      totalRateAfterPodi,
      podiPercent: totalWeight > 0 ? (podiKgs / totalWeight) * 100 : 0,
      gapPercent: totalWeight > 0 ? (gapKgs / totalWeight) * 100 : 0,
      wastagePercent: totalCargo > 0 ? (wastageKgs / totalCargo) * 100 : 0,
      totalCargoAfterPodiAndGapKgs,
      totalCargoAfterPodiAndGapValue,
      totalCargoAfterPodiAndGapRate,
    };
  }, [gqrData, actualValues, adjustableDamageAllowed]);

  // Function to finalize GQR
  const handleFinalizeGQR = async () => {
    if (!selectedGqr || !isAdmin) {
      toast.error('Only admin can finalize GQR');
      return;
    }

    setFinalizing(true);
    try {
      // Save the current adjustable values to volatile fields
      const { error } = await supabase
        .from('gqr_entry')
        .update({ 
          gqr_status: 'Closed',
          volatile_po_rate: actualValues.ratePerKg,
          volatile_podi_rate: actualValues.podiRatePerKg,
          volatile_wastage_kgs_per_ton: adjustableDamageAllowed
        })
        .eq('id', selectedGqr);

      if (error) {
        throw error;
      }

      toast.success('GQR finalized successfully!');
      
      // Refresh the GQR data to reflect the closed status and volatile values
      await fetchGQRDetails();
      
      // Refresh the unfinalized GQRs list
      await fetchUnfinalizedGQRs();
      
    } catch (err) {
      console.error('Error finalizing GQR:', err);
      toast.error(`Failed to finalize GQR: ${err.message}`);
    } finally {
      setFinalizing(false);
    }
  };

  // Function to print GQR
  const handlePrintGQR = () => {
    if (gqrData?.gqr_status === 'Closed') {
      window.print();
    } else {
      toast.error('GQR must be finalized before printing');
    }
  };

  // Function to generate Tally URL
  const handleGenerateTallyURL = () => {
    if (gqrData?.gqr_status === 'Closed') {
      const baseUrl = window.location.origin;
      const tallyUrl = `${baseUrl}/api/gqr-data/${gqrData.id}`;
      
      // Copy URL to clipboard
      navigator.clipboard.writeText(tallyUrl).then(() => {
        toast.success('Tally URL copied to clipboard!');
        
        // Show the URL in an alert for easy copying
        alert(`Tally URL copied to clipboard:\n\n${tallyUrl}\n\nUse this URL in your Tally TDL file to fetch GQR data.`);
      }).catch(() => {
        // Fallback if clipboard API fails
        alert(`Tally URL:\n\n${tallyUrl}\n\nCopy this URL and use it in your Tally TDL file.`);
      });
    } else {
      toast.error('GQR must be finalized before generating Tally URL');
    }
  };

  // Calculate differences for report
  const differences = useMemo(() => {
    // Calculate assured cargo kgs for actual (total cargo - podi - gap)
    const actualAssuredCargoKgs = actualCalculations.totalCargo - actualCalculations.podiKgs - actualCalculations.gapKgs;
    
         return {
       totalRateAfterPodi: estimatedCalculations.totalRateAfterPodi - actualCalculations.totalRateAfterPodi, // 11.50 - 11.63 = -0.13
       totalRateAfterPodiPayment: null, // No total difference for first row
               podiPayment: (estimatedCalculations.totalRateAfterPodi - actualCalculations.totalRateAfterPodi) * 1000, // (11.50 - 11.63) * 1000 = -130 per MT
       podiPaymentPerMT: (estimatedCalculations.podiValue - actualCalculations.podiValue) / (estimatedCalculations.podiKgs / 1000), // -3720 / 4 = -930 per MT
       podiPaymentTotal: (estimatedCalculations.podiValue - actualCalculations.podiValue) * (actualAssuredCargoKgs / 1000), // -3720 * 18.2 = -67664
      podiPercent: actualCalculations.podiPercent - estimatedCalculations.podiPercent,
      wastagePayment: actualCalculations.wastageValue - estimatedCalculations.wastageValue,
      wastagePercent: actualCalculations.wastagePercent - estimatedCalculations.wastagePercent,
      totalDifference: actualCalculations.totalValue - estimatedCalculations.totalValue,
    };
  }, [estimatedCalculations, actualCalculations]);

  if (sessionLoading) {
    return <div className="container mx-auto p-4 mt-15 text-center">Loading session...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-4 mt-15">
        <div className="text-center text-red-600">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto p-4 mt-15 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 mt-15 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 mt-15 md:p-6">
      {/* This div will contain the content to be printed */}
      <div className="hidden print:block">
        <GQRPrint
          gqrData={gqrData}
          actualCalculations={actualCalculations}
          actualValues={actualValues}
          estimatedCalculations={estimatedCalculations}
          adjustableDamageAllowed={adjustableDamageAllowed}
        />
      </div>

      {/* This div will be hidden when printing */}
      <div className="print:hidden">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">GQR Working Sheet</h1>
          <button onClick={() => window.history.back()} className="bg-gray-200 text-gray-800 px-4 py-2 rounded">Back</button>
        </div>

        {/* GQR Selection */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Select GQR to Work On</h2>
            <select
              value={selectedGqr || ''}
              onChange={(e) => setSelectedGqr(parseInt(e.target.value, 10))}
              className="w-full p-3 border rounded-lg"
            >
            <option value="">Select a GQR...</option>
            {gqrList.map((gqr) => (
              <option key={gqr.id} value={gqr.id}>
                GQR #{gqr.id} - {gqr.pre_gr_entry?.vouchernumber} - {gqr.pre_gr_entry?.suppliers?.name}
              </option>
            ))}
          </select>
        </div>

        {selectedGqr && gqrData && (
          <>
              {/* PO Details Section */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Purchase Order Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><strong>PO Number:</strong> {gqrData.vouchernumber}</div>
                  <div><strong>Supplier:</strong> {gqrData.supplier_name}</div>
                  <div><strong>PO Quantity:</strong> {gqrData.po_quantity || 0} MT</div>
                  <div><strong>PO Date:</strong> {gqrData.po_date ? formatDateDDMMYYYY(gqrData.po_date) : 'N/A'}</div>
                  <div><strong>Original PO Rate:</strong> ₹{gqrData.rate}/kg</div>
                  <div><strong>Original Podi Rate:</strong> ₹{gqrData.podi_rate}/kg</div>
                  <div><strong>Assured Cargo Percent:</strong> {estimatedValues.assuredCargoPercent}%</div>
                  <div><strong>Damage per ton kg:</strong> {gqrData.damage_allowed_kgs_ton || 0} kg</div>
                </div>
              </div>
                       {/* GQR Details Section */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
               <h2 className="text-xl font-semibold mb-4 border-b pb-2">GQR Details</h2>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div><strong>GR No:</strong> {gqrData.vouchernumber}</div>
                 <div><strong>Pre-GR Number:</strong> {gqrData.vouchernumber}</div>
                 <div><strong>Export Quality:</strong> {gqrData.export_quality_weight || 0} kg</div>
                 <div><strong>Podi Weight:</strong> {gqrData.podi_weight || 0} kg</div>
                 <div><strong>Gap Items Weight:</strong> {gqrData.gap_items_weight || 0} kg</div>
                 <div><strong>Rot Weight:</strong> {gqrData.rot_weight || 0} kg</div>
                 <div><strong>Doubles Weight:</strong> {gqrData.doubles_weight || 0} kg</div>
                 <div><strong>Sand Weight:</strong> {gqrData.sand_weight || 0} kg</div>
                 <div><strong>Total Wastage:</strong> {(gqrData.rot_weight || 0) + (gqrData.doubles_weight || 0) + (gqrData.sand_weight || 0)} kg</div>
                 <div><strong>Cargo Received Date:</strong> {gqrData.pre_gr_date ? formatDateDDMMYYYY(gqrData.pre_gr_date) : 'N/A'}</div>
               </div>
             </div>

            {/* Weight Input Fields Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">Weight Input Fields</h2>
              <div className="mb-4 p-2 bg-yellow-100 text-sm">
                <strong>Debug Info:</strong> Current rotWeight value: "{actualValues.rotWeight}" (Type: {typeof actualValues.rotWeight})
                <br />
                <strong>Debug Counter:</strong> {debugCounter} 
                <button 
                  onClick={() => {
                    console.log('Test button clicked');
                    setActualValues(prev => {
                      const newState = {...prev, rotWeight: '360'};
                      console.log('Setting rotWeight to 360, new state:', newState);
                      return newState;
                    });
                  }}
                  className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
                >
                  Test: Set to 360
                </button>
                <button 
                  onClick={() => setDebugCounter(prev => prev + 1)}
                  className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded"
                >
                  Increment Counter
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rot Weight (kg)</label>
                    <input 
                      type="text" 
                      value={actualValues.rotWeight || ''} 
                      onChange={(e) => {
                        console.log('Input event triggered:', e.target.value);
                        const value = e.target.value;
                        console.log('Setting rotWeight to:', value);
                        setActualValues(prev => {
                          const newState = {...prev, rotWeight: value};
                          console.log('New state:', newState);
                          return newState;
                        });
                      }} 
                      onKeyDown={(e) => console.log('Key pressed:', e.key)}
                      onFocus={(e) => console.log('Input focused')}
                      onBlur={(e) => console.log('Input blurred')}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Enter rot weight"
                      style={{color: 'black', backgroundColor: 'white'}}
                      disabled={false}
                      readOnly={false}
                      autoComplete="off"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Doubles Weight (kg)</label>
                                      <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={actualValues.doublesWeight || ''} 
                      onChange={(e) => {
                        const value = e.target.value;
                        setActualValues(prev => ({...prev, doublesWeight: value === '' ? '' : parseFloat(value) || 0}));
                      }} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Enter doubles weight"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sand/Debris Weight (kg)</label>
                                      <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={actualValues.sandWeight || ''} 
                      onChange={(e) => {
                        const value = e.target.value;
                        setActualValues(prev => ({...prev, sandWeight: value === '' ? '' : parseFloat(value) || 0}));
                      }} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 border-transparent" 
                      placeholder="Enter sand/debris weight"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight Shortage (kg)</label>
                                      <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={actualValues.weightShortage || ''} 
                      onChange={(e) => {
                        const value = e.target.value;
                        setActualValues(prev => ({...prev, weightShortage: value === '' ? '' : parseFloat(value) || 0}));
                      }} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Enter weight shortage"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Podi Weight (kg)</label>
                      <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={actualValues.podiWeight || ''} 
                      onChange={(e) => {
                        const value = e.target.value;
                        setActualValues(prev => ({...prev, podiWeight: value === '' ? '' : parseFloat(value) || 0}));
                      }} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Enter podi weight"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gap Items Weight (kg)</label>
                                      <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={actualValues.gapWeight || ''} 
                      onChange={(e) => {
                        const value = e.target.value;
                        setActualValues(prev => ({...prev, gapWeight: value === '' ? '' : parseFloat(value) || 0}));
                      }} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Enter gap items weight"
                    />
                </div>
              </div>
              
              {/* Calculated Results Display */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Total Wastage</p>
                  <p className="font-bold text-lg text-red-600">
                    {((actualValues.rotWeight || 0) + (actualValues.doublesWeight || 0) + (actualValues.sandWeight || 0) + (actualValues.weightShortage || 0)).toFixed(2)} kg
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Calculated Export Quality Weight</p>
                  <p className="font-bold text-lg text-blue-600">
                    {(() => {
                      const netWt = gqrData?.net_wt || 0;
                      const totalWastage = (actualValues.rotWeight || 0) + (actualValues.doublesWeight || 0) + (actualValues.sandWeight || 0) + (actualValues.weightShortage || 0);
                      return Math.max(0, netWt - totalWastage).toFixed(2);
                    })()} kg
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Actual Yield % (Assured: 80%)</p>
                  <p className="font-bold text-lg text-green-600">
                    {(() => {
                      const netWt = gqrData?.net_wt || 0;
                      const totalWastage = (actualValues.rotWeight || 0) + (actualValues.doublesWeight || 0) + (actualValues.sandWeight || 0) + (actualValues.weightShortage || 0);
                      const exportQuality = Math.max(0, netWt - totalWastage);
                      return netWt > 0 ? ((exportQuality / netWt) * 100).toFixed(2) : 0;
                    })()}%
                  </p>
                </div>
              </div>
            </div>

            {/* Working Sheet - Estimated vs Actual */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
               <h2 className="text-xl font-semibold mb-4 border-b pb-2">Working Sheet</h2>
               
               
              
              {/* Estimated vs Actual Comparison Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-gray-300 bg-blue-900 shadow-lg">
                  <thead>
                    <tr className="bg-green-600 text-white">
                      <th className="border border-gray-300 p-2 text-center text-white font-bold" colSpan="1"></th>
                      <th className="border border-gray-300 p-2 text-center text-white font-bold bg-yellow-500 " colSpan="3">ESTIMATED</th>
                      <th className="border border-gray-300 p-2 text-center text-white font-bold bg-blue-500" colSpan="3">ACTUAL</th>
                    </tr>
                    <tr className="bg-green-600 text-white">
                      <th className="border border-gray-300 p-2 text-center text-white">Description</th>
                      <th className="border border-gray-300 p-2 text-center text-white bg-yellow-500">KGS</th>
                      <th className="border border-gray-300 p-2 text-center text-white bg-yellow-500">RATE/KG</th>
                      <th className="border border-gray-300 p-2 text-center text-white bg-yellow-500">Value</th>
                      <th className="border border-gray-300 p-2 text-center text-white bg-blue-500">KGS</th>
                      <th className="border border-gray-300 p-2 text-center text-white bg-blue-500">RATE/KG</th>
                      <th className="border border-gray-300 p-2 text-center text-white bg-blue-500">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-green-600 text-white">
                                       {/* TOTAL CARGO Row */}
                     <tr>
                       <td className="border border-gray-300 p-2 font-semibold text-white">TOTAL CARGO</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-yellow-500">{estimatedCalculations.totalCargo.toFixed(2)}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-yellow-500">{estimatedValues.ratePerKg}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-yellow-500">₹{(estimatedCalculations.totalCargo * estimatedValues.ratePerKg).toFixed(2)}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-blue-500">{actualCalculations.totalCargo.toFixed(2)}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-blue-500">{actualValues.ratePerKg}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-blue-500">₹{actualCalculations.cargoValue.toFixed(2)}</td>
                     </tr>
                    
                                       {/* PODI & GAP ITEM KGS Row */}
                     <tr>
                       <td className="border border-gray-300 p-2 font-semibold text-white">PODI & GAP ITEM KGS</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-yellow-500">{estimatedCalculations.podiKgs.toFixed(2)}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-yellow-500">{gqrData?.podi_rate || 4}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-yellow-500">₹{estimatedCalculations.podiValue.toFixed(2)}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-blue-500">{(actualCalculations.podiKgs + actualCalculations.gapKgs).toFixed(2)}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-blue-500">{actualValues.podiRatePerKg}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-blue-500">₹{((actualCalculations.podiKgs + actualCalculations.gapKgs) * actualValues.podiRatePerKg).toFixed(2)}</td>
                     </tr>
                     
                                         {/* TOTAL CARGO AFTER PODI Row */}
                      <tr>
                        <td className="border border-gray-300 p-2 font-semibold text-white">TOTAL CARGO AFTER PODI</td>
                        <td className="border border-gray-300 p-2 text-right text-white bg-yellow-500">{estimatedCalculations.totalCargoAfterPodiKgs.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 text-right text-white bg-yellow-500">{estimatedCalculations.totalCargoAfterPodiRate.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 text-right text-white bg-yellow-500">₹{estimatedCalculations.totalCargoAfterPodiValue.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 text-right text-white bg-blue-500">{actualCalculations.totalCargoAfterPodiAndGapKgs.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right text-white bg-blue-500">{actualCalculations.totalCargoAfterPodiAndGapRate.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right text-white bg-blue-500">₹{actualCalculations.totalCargoAfterPodiAndGapValue.toFixed(2)}</td>
                      </tr>           
                      {/* WASTAGE KGS Row */}
                     <tr>
                       <td className="border border-gray-300 p-2 font-semibold text-white">WASTAGE KGS PMT ({adjustableDamageAllowed || 100} kg)</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-yellow-500">{estimatedCalculations.wastagePmt.toFixed(2)}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-yellow-500">{estimatedValues.ratePerKg}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-yellow-500">₹{estimatedCalculations.wastageValue.toFixed(2)}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-blue-500">{actualCalculations.wastageKgs.toFixed(2)}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-blue-500">{actualValues.ratePerKg}</td>
                       <td className="border border-gray-300 p-2 text-right text-white bg-blue-500">₹{actualCalculations.wastageValue.toFixed(2)}</td>
                     </tr>
                  </tbody>
                </table>
              </div>
              {/* Adjustable Rates - Moved above Report for dynamic impact */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Adjustable Fields</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        PO Rate (₹/kg)
                        {gqrData?.volatile_po_rate && gqrData?.gqr_status === 'Closed' && (
                          <span className="text-xs text-blue-600 ml-1">(Finalized: {gqrData.volatile_po_rate})</span>
                        )}
                      </label>
                      <input 
                        type="number" 
                        value={actualValues.ratePerKg || ''}
                        onChange={(e) => setActualValues(prev => ({...prev, ratePerKg: parseFloat(e.target.value) || 0}))}
                        className="w-full p-3 border rounded mt-1"
                        placeholder={gqrData.rate || 0}
                        disabled={gqrData?.gqr_status === 'Closed' || !isAdmin}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Podi Rate (₹/kg)
                        {gqrData?.volatile_podi_rate && gqrData?.gqr_status === 'Closed' && (
                          <span className="text-xs text-blue-600 ml-1">(Final ized: {gqrData.volatile_podi_rate})</span>
                        )}
                      </label>
                      <input 
                        type="number" 
                        value={actualValues.podiRatePerKg || ''}
                        onChange={(e) => setActualValues(prev => ({...prev, podiRatePerKg: parseFloat(e.target.value) || 0}))}
                        className="w-full p-3 border rounded mt-1"
                        placeholder={gqrData.podi_rate || 0}
                        disabled={gqrData?.gqr_status === 'Closed' || !isAdmin}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Damage Allowed (kgs/ton)
                        {gqrData?.volatile_wastage_kgs_per_ton && gqrData?.gqr_status === 'Closed' && (
                          <span className="text-xs text-blue-600 ml-1">(Finalized: {gqrData.volatile_wastage_kgs_per_ton})</span>
                        )}
                      </label>
                      <input 
                        type="number" 
                        value={adjustableDamageAllowed || ''}
                        onChange={(e) => setAdjustableDamageAllowed(parseFloat(e.target.value) || 0)}
                        className="w-full p-3 border rounded"
                        placeholder="Enter damage allowed per ton"
                        disabled={gqrData?.gqr_status === 'Closed' || !isAdmin}
                      />
                      {/* Debug info - Hidden */}
                      {/* <div className="text-xs text-gray-500 mt-1">
                        GQR Status: {gqrData?.gqr_status || 'Unknown'} | 
                        Admin: {isAdmin ? 'Yes' : 'No'} | 
                        User: {user?.email || 'None'} | 
                        Adjustable Value: {adjustableDamageAllowed || 'Not set'} | 
                        Volatile Rate: {gqrData?.volatile_po_rate || 'Not set'} | 
                        Volatile Podi Rate: {gqrData?.volatile_podi_rate || 'Not set'} | 
                        Volatile Wastage: {gqrData?.volatile_wastage_kgs_per_ton || 'Not set'}
                      </div> */}
                    </div>
                  </div>
                </div>

               {/* Comparison Report */}
               <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-semibold">REPORT</h3>
                   <button
                     onClick={() => window.history.back()}
                     className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                   >
                     ← Back
                   </button>
                 </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 bg-blue-900 shadow-lg">
                    <thead>
                      <tr className="bg-green-600 text-white">
                        <th className="border border-gray-300 p-1 text-center">DESCRIPTION</th>
                        <th className="border border-gray-300 p-1 text-center">CALCULATED (20MT)</th>
                        <th className="border border-gray-300 p-1 text-center">ACTUAL</th>
                        <th className="border border-gray-300 p-1 text-center">DIFFERENCE</th>
                        <th className="border border-gray-300 p-1 text-center">TOTAL DIFFERENCE</th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                        <tr>
                         <td className="border border-gray-300 p-2 font-semibold text-white">TOTAL RATE AFTER PODI & GAP ITEMS PKG</td>
                         <td className="border border-gray-300 p-2 text-center text-white">₹{estimatedCalculations.totalCargoAfterPodiRate.toFixed(2)}</td>
                         <td className="border border-gray-300 p-2 text-center text-white">₹{(((actualCalculations.totalCargo * actualValues.ratePerKg) - ((actualCalculations.podiKgs + actualCalculations.gapKgs) * actualValues.podiRatePerKg)) / 16375).toFixed(2)}</td>
                         <td className="border border-gray-300 p-2 text-center text-white">₹{(estimatedCalculations.totalCargoAfterPodiRate - (((actualCalculations.totalCargo * actualValues.ratePerKg) - ((actualCalculations.podiKgs + actualCalculations.gapKgs) * actualValues.podiRatePerKg)) / 16375)).toFixed(2)}</td>
                         <td className="border border-gray-300 p-2 text-center text-white">-</td>
                       </tr>
                       
                       <tr>
                         <td className="border border-gray-300 p-2 font-semibold text-white">TOTAL RATE AFTER PODI & GAP ITEMS PMT</td>
                           <td className="border border-gray-300 p-2 text-center text-white">₹{(estimatedCalculations.totalCargoAfterPodiRate * 1000).toFixed(2)}</td>
                           <td className="border border-gray-300 p-2 text-center text-white">₹{((((actualCalculations.totalCargo * actualValues.ratePerKg) - ((actualCalculations.podiKgs + actualCalculations.gapKgs) * actualValues.podiRatePerKg)) / 16375) * 1000).toFixed(2)}</td>
                           <td className="border border-gray-300 p-2 text-center text-white">₹{Math.round((estimatedCalculations.totalCargoAfterPodiRate * 1000) - ((((actualCalculations.totalCargo * actualValues.ratePerKg) - ((actualCalculations.podiKgs + actualCalculations.gapKgs) * actualValues.podiRatePerKg)) / 16375) * 1000))}</td>
                           <td className="border border-gray-300 p-2 text-center text-white">₹{Math.round((16375 * ((estimatedCalculations.totalCargoAfterPodiRate * 1000) - ((((actualCalculations.totalCargo * actualValues.ratePerKg) - ((actualCalculations.podiKgs + actualCalculations.gapKgs) * actualValues.podiRatePerKg)) / 16375) * 1000))) / 1000).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2 font-semibold text-white">PODI & CARGO ITEMS %</td>
                          <td className="border border-gray-300 p-2 text-center text-white">{((estimatedCalculations.podiKgs / estimatedCalculations.totalCargo) * 100).toFixed(2)}%</td>
                          <td className="border border-gray-300 p-2 text-center text-white">{(((actualCalculations.podiKgs + actualCalculations.gapKgs) / actualCalculations.totalCargo) * 100).toFixed(2)}%</td>
                          <td className="border border-gray-300 p-2 text-center text-white">{(((estimatedCalculations.podiKgs / estimatedCalculations.totalCargo) * 100) - (((actualCalculations.podiKgs + actualCalculations.gapKgs) / actualCalculations.totalCargo) * 100)).toFixed(2)}%</td>
                          <td className="border border-gray-300 p-2 text-center text-white">-</td>
                        </tr>
                        <tr className="border-t-2 border-gray-400">
                         <td className="border border-gray-300 p-2 font-semibold text-white">WASTAGE KGS PMT</td>
                         <td className="border border-gray-300 p-2 text-center text-white">{adjustableDamageAllowed || 100}</td>
                         <td className="border border-gray-300 p-2 text-center text-white">{Math.round(actualCalculations.totalCargo > 0 ? ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 1000) : 0)}</td>
                         <td className="border border-gray-300 p-2 text-center text-white">-{Math.abs(Math.round((adjustableDamageAllowed || 100) - (actualCalculations.totalCargo > 0 ? ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 1000) : 0)))}</td>
                         <td className="border border-gray-300 p-2 text-center text-white">₹{(Math.round((adjustableDamageAllowed || 100) - (actualCalculations.totalCargo > 0 ? ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 1000) : 0)) * (actualCalculations.totalCargo / 1000) * (((actualCalculations.totalCargo * actualValues.ratePerKg) - ((actualCalculations.podiKgs + actualCalculations.gapKgs) * actualValues.podiRatePerKg)) / 16375)).toFixed(2)}</td>
                       </tr>
                       <tr>
                         <td className="border border-gray-300 p-2 font-semibold text-white">WASTAGE %</td>
                         <td className="border border-gray-300 p-2 text-center text-white">{((estimatedCalculations.wastageKgs / estimatedCalculations.totalCargo) * 100).toFixed(2)}%</td>
                         <td className="border border-gray-300 p-2 text-center text-white">{((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 100).toFixed(2)}%</td>
                         <td className="border border-gray-300 p-2 text-center text-white">{(((estimatedCalculations.wastageKgs / estimatedCalculations.totalCargo) * 100) - ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 100)).toFixed(2)}%</td>
                         <td className="border border-gray-300 p-2 text-center text-white">-</td>
                       </tr>
                       
                       {/* TOTAL Row */}
                       <tr className="border-t-4 border-gray-600">
                         <td className="border border-gray-300 p-2 font-bold text-center text-white">TOTAL</td>
                         <td className="border border-gray-300 p-2 text-center font-bold text-white">-</td>
                         <td className="border border-gray-300 p-2 text-center font-bold text-white">-</td>
                         <td className="border border-gray-300 p-2 text-center font-bold text-white">-</td>
                         <td className="border border-gray-300 p-2 text-center font-bold text-white">₹{(Math.round((16375 * ((estimatedCalculations.totalCargoAfterPodiRate * 1000) - ((((actualCalculations.totalCargo * actualValues.ratePerKg) - ((actualCalculations.podiKgs + actualCalculations.gapKgs) * actualValues.podiRatePerKg)) / 16375) * 1000))) / 1000) + (Math.round((adjustableDamageAllowed || 100) - (actualCalculations.totalCargo > 0 ? ((actualCalculations.wastageKgs / actualCalculations.totalCargo) * 1000) : 0)) * (actualCalculations.totalCargo / 1000) * (((actualCalculations.totalCargo * actualValues.ratePerKg) - ((actualCalculations.podiKgs + actualCalculations.gapKgs) * actualValues.podiRatePerKg)) / 16375))).toFixed(2)}</td>
                       </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-center space-x-4">
                {gqrData?.gqr_status !== 'Closed' ? (
                  <button
                    onClick={handleFinalizeGQR}
                    disabled={!isAdmin || finalizing || !selectedGqr}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
                  >
                    {finalizing ? 'Finalizing...' : 'Finalize GQR'}
                  </button>
                ) : (
                  <div className="text-center">
                    <div className="text-green-600 font-semibold mb-2">✓ GQR Finalized</div>
                    <button
                      onClick={handlePrintGQR}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                    >
                      Print GQR
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 