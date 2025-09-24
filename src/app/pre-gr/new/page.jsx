'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatDateDDMMYYYY } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/use-auth';
// Temporarily removed database utilities import for debugging
// import { 
//   fetchMasterData, 
//   createPreGREntry
// } from '@/lib/database';

export default function CreatePreGRPage() {
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const [loading, setLoading] = useState(true);

    // Data for dropdowns
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState([]);
    const [gapItems, setGapItems] = useState([]);

    // Form data state (matching pre_gr_entry table columns)
    const [selectedPoId, setSelectedPoId] = useState(null);
    const [selectedPo, setSelectedPo] = useState(null);
    const [poVoucherNumber, setPoVoucherNumber] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [supplierAddress, setSupplierAddress] = useState('');
    const [loadedFrom, setLoadedFrom] = useState('');
    const [itemQuality, setItemQuality] = useState('');
    const [vehicleNo, setVehicleNo] = useState('');
    const [bags, setBags] = useState('');
    const [grDate, setGrDate] = useState(new Date().toISOString().slice(0, 10));
    const [weightBridgeName, setWeightBridgeName] = useState('');
    const [grNo, setGrNo] = useState('');
    const [grDt, setGrDt] = useState(new Date().toISOString().slice(0, 10));

    // PO related fields that will be read-only from selected PO
    const [poQuantity, setPoQuantity] = useState('');
    const [poRate, setPoRate] = useState('');
    const [poDamageAllowed, setPoDamageAllowed] = useState('');
    const [poCargo, setPoCargo] = useState('');

    // Weight details (Tons, Kgs inputs - will be combined for DB storage)
    const [ladenWtTons, setLadenWtTons] = useState('');
    const [ladenWtKgs, setLadenWtKgs] = useState('');
    const [emptyWtTons, setEmptyWtTons] = useState('');
    const [emptyWtKgs, setEmptyWtKgs] = useState('');
    const [podiBags, setPodiBags] = useState('');
    const [podiBagWeight, setPodiBagWeight] = useState('45');

    // Gap items
    const [gapItem1Id, setGapItem1Id] = useState(null);
    const [gapItem1Bags, setGapItem1Bags] = useState('');
    const [gapItem2Id, setGapItem2Id] = useState(null);
    const [gapItem2Bags, setGapItem2Bags] = useState('');

    // Weight shortage
    const [weightShortageTons, setWeightShortageTons] = useState('');
    const [weightShortageKgs, setWeightShortageKgs] = useState('');

    // Admin Approval fields
    const [isAdminApproved, setIsAdminApproved] = useState(false);
    const [adminRemark, setAdminRemark] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    // Calculated fields (read-only in UI, derived from inputs)
    const [nettWtTons, setNettWtTons] = useState('');
    const [nettWtKgs, setNettWtKgs] = useState('');

    const [sieveNo, setSieveNo] = useState('');
    const [preparedBy, setPreparedBy] = useState('');

    // Helper to convert Tons & Kgs to total Kgs
    const toTotalKgs = (tons, kgs) => {
        const t = parseFloat(tons) || 0;
        const k = parseFloat(kgs) || 0;
        return (t * 1000) + k;
    };

    // Helper to convert total Kgs to Tons and Kgs for display
    const fromTotalKgs = (totalKgs) => {
        if (isNaN(totalKgs) || totalKgs < 0) return { tons: '', kgs: '' };
        const t = Math.floor(totalKgs / 1000);
        const k = Math.round(totalKgs % 1000);
        return { tons: t.toString(), kgs: k.toString() };
    };

    // Reset form function
    const resetForm = () => {
        setSelectedPoId(null);
        setSelectedPo(null);
        setPoVoucherNumber('');
        setSupplierName('');
        setSupplierAddress('');
        setLoadedFrom('');
        setItemQuality('');
        setVehicleNo('');
        setBags('');
        setGrDate(new Date().toISOString().slice(0, 10));
        setWeightBridgeName('');
        setGrNo('');
        setGrDt(new Date().toISOString().slice(0, 10));
        setPoQuantity('');
        setPoRate('');
        setPoDamageAllowed('');
        setPoCargo('');
        setLadenWtTons('');
        setLadenWtKgs('');
        setEmptyWtTons('');
        setEmptyWtKgs('');
        setPodiBags('');
        setPodiBagWeight('45');
        setGapItem1Id(null);
        setGapItem1Bags('');
        setGapItem2Id(null);
        setGapItem2Bags('');
        setWeightShortageTons('');
        setWeightShortageKgs('');
        setSieveNo('');
        setPreparedBy('');
        setIsAdminApproved(false);
        setAdminRemark('');
        setNettWtTons('');
        setNettWtKgs('');
    };

    // Main data fetching effect
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            if (!supabase) {
                toast.error('Supabase client is not initialized. Please check your configuration.');
                setLoading(false);
                console.error('Supabase client is undefined in CreatePreGRPage.');
                return;
            }

            try {
                console.log('Starting data fetch...');
                
                // Determine admin status based on user email
                console.log('Checking admin status...');
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) {
                    console.error('Error fetching session for admin check:', sessionError);
                    setIsAdmin(false);
                } else {
                    const userEmail = session?.user?.email;
                    // Check if the user's email starts with 'admin'
                    const userIsAdmin = userEmail && userEmail.startsWith('admin');
                    setIsAdmin(userIsAdmin);
                    console.log('Auth Check: User Email:', userEmail, 'Is Admin:', userIsAdmin);
                }

                // Fetch master data directly with Supabase (bypassing utilities for debugging)
                console.log('Fetching master data directly...');
                
                // Fetch suppliers directly
                console.log('Fetching suppliers directly...');
                const { data: suppliersData, error: suppliersError } = await supabase
                    .from('suppliers')
                    .select('*')
                    .order('name', { ascending: true });
                
                if (suppliersError) {
                    console.error('Direct suppliers fetch error:', suppliersError);
                    throw new Error(`Suppliers fetch failed: ${suppliersError.message}`);
                }
                console.log('Direct suppliers fetch successful:', suppliersData?.length || 0);
                console.log('Suppliers data structure:', suppliersData);
                
                // Verify suppliers data
                if (!suppliersData || suppliersData.length === 0) {
                    console.warn('⚠️ No suppliers data found! This will cause "Unknown Supplier" to appear.');
                } else {
                    console.log('✅ Suppliers data verified:', suppliersData.map(s => ({ id: s.id, name: s.name })));
                }
                
                setSuppliers(suppliersData || []);
                
                // Fetch items directly
                console.log('Fetching items directly...');
                const { data: itemsData, error: itemsError } = await supabase
                    .from('item_master')
                    .select('*')
                    .order('item_name', { ascending: true });
                
                if (itemsError) {
                    console.error('Direct items fetch error:', itemsError);
                    throw new Error(`Items fetch failed: ${itemsError.message}`);
                }
                console.log('Direct items fetch successful:', itemsData?.length || 0);
                setItems(itemsData || []);
                
                // Fetch gap items directly
                console.log('Fetching gap items directly...');
                const { data: gapItemsData, error: gapItemsError } = await supabase
                    .from('gap_items')
                    .select('*')
                    .order('name', { ascending: true });
                
                if (gapItemsError) {
                    console.error('Direct gap items fetch error:', gapItemsError);
                    throw new Error(`Gap items fetch failed: ${gapItemsError.message}`);
                }
                console.log('Direct gap items fetch successful:', gapItemsData?.length || 0);
                setGapItems(gapItemsData || []);

                // Fetch purchase orders with relationships
                console.log('Fetching purchase orders with relationships...');
                const { data: poData, error: poError } = await supabase
                    .from('purchase_orders')
                    .select('*')
                    .order('vouchernumber', { ascending: false });

                if (poError) {
                    console.error('Error fetching purchase orders:', poError);
                    throw new Error(`Purchase orders fetch failed: ${poError.message}`);
                }

                console.log('Fetched purchase orders:', poData?.length || 0);
                console.log('Sample PO data:', poData?.[0]);
                console.log('PO supplier_id field:', poData?.[0]?.supplier_id);
                console.log('Fetched suppliers:', suppliers?.length || 0);
                console.log('Sample supplier data:', suppliers?.[0]);
                console.log('Supplier ID field:', suppliers?.[0]?.id);

                // Combine the data by adding supplier information to each PO
                // Use suppliersData directly instead of the state variable
                const purchaseOrdersWithSuppliers = (poData || []).map(po => {
                    // Try both exact match and type conversion
                    let supplier = suppliersData.find(s => s.id === po.supplier_id);
                    
                    // If no exact match, try with type conversion
                    if (!supplier) {
                        supplier = suppliersData.find(s => 
                            s.id === Number(po.supplier_id) || 
                            Number(s.id) === po.supplier_id ||
                            s.id === String(po.supplier_id) ||
                            String(s.id) === po.supplier_id
                        );
                    }
                    
                    console.log(`PO ${po.vouchernumber}: supplier_id=${po.supplier_id} (${typeof po.supplier_id}), found supplier:`, supplier);
                    
                    if (!supplier) {
                        console.log(`  Available supplier IDs:`, suppliersData.map(s => `${s.id} (${typeof s.id})`));
                    }
                    
                    return {
                        ...po,
                        suppliers: supplier || { id: po.supplier_id, name: 'Unknown Supplier' }
                    };
                });

                console.log('Combined purchase orders with suppliers:', purchaseOrdersWithSuppliers.length);
                console.log('Sample combined PO:', purchaseOrdersWithSuppliers[0]);
                setPurchaseOrders(purchaseOrdersWithSuppliers);

                // Auto-select the first available PO for new entries
                if (purchaseOrdersWithSuppliers.length > 0) {
                    const firstPo = purchaseOrdersWithSuppliers[0];
                    console.log('AUTO-SELECTING FIRST PO:', firstPo);
                    setSelectedPoId(firstPo.id);
                    setSelectedPo(firstPo);
                    setPoVoucherNumber(firstPo.vouchernumber);
                    setSupplierName(firstPo.suppliers?.name || '');
                    setSupplierAddress('');
                    const item = itemsData.find(i => i.id === firstPo.item_id);
                    setItemQuality(item?.item_name || '');
                    setPoQuantity(firstPo.quantity?.toString() || '');
                    setPoRate(firstPo.rate?.toString() || '');
                    setPoDamageAllowed(firstPo.damage_allowed_kgs_ton?.toString() || '');
                    setPoCargo(firstPo.cargo?.toString() || '');
                    // Auto-fill prepared by with current user (if available)
                    setPreparedBy(userProfile?.full_name || '');
                    console.log('PO AUTO-SELECTION COMPLETE');
                } else {
                    console.error('NO PURCHASE ORDERS FOUND! This will cause the form to fail.');
                }

                console.log('All data fetched successfully');

            } catch (error) {
                console.error('Error fetching data:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                toast.error('Failed to load form data: ' + (error.message || 'Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Effect to handle PO selection and populate related fields
    useEffect(() => {
        if (selectedPoId && purchaseOrders.length > 0) {
            const selectedPO = purchaseOrders.find(po => po.id === selectedPoId);
            if (selectedPO) {
                setSelectedPo(selectedPO);
                setPoVoucherNumber(selectedPO.vouchernumber);
                
                // Set supplier information
                if (selectedPO.suppliers) {
                    setSupplierName(selectedPO.suppliers.name);
                    // Find supplier address from suppliers array
                    const supplier = suppliers.find(s => s.id === selectedPO.supplier_id);
                    if (supplier) {
                        setSupplierAddress(supplier.address || '');
                    }
                }
                
                // Set item information
                const item = items.find(i => i.id === selectedPO.item_id);
                if (item) {
                    setItemQuality(item.item_name);
                }
                
                setPoQuantity(selectedPO.quantity || '');
                setPoRate(selectedPO.rate || '');
                setPoDamageAllowed(selectedPO.damage_allowed_kgs_ton || '');
                setPoCargo(selectedPO.cargo || '');
                
                console.log('PO selected:', selectedPO);
            }
        } else {
            // Reset PO-related fields when no PO is selected
            setSelectedPo(null);
            setPoVoucherNumber('');
            setSupplierName('');
            setSupplierAddress('');
            setItemQuality('');
            setPoQuantity('');
            setPoRate('');
            setPoDamageAllowed('');
            setPoCargo('');
        }
    }, [selectedPoId, purchaseOrders, suppliers, items]);

    // Effect to calculate weights
    useEffect(() => {
        const ladenTotal = toTotalKgs(ladenWtTons, ladenWtKgs);
        const emptyTotal = toTotalKgs(emptyWtTons, emptyWtKgs);
        const goodsTotal = ladenTotal - emptyTotal;
        const shortageTotal = toTotalKgs(weightShortageTons, weightShortageKgs);
        const netTotal = goodsTotal - shortageTotal;

        const nettWt = fromTotalKgs(netTotal);

        setNettWtTons(nettWt.tons);
        setNettWtKgs(nettWt.kgs);
    }, [ladenWtTons, ladenWtKgs, emptyWtTons, emptyWtKgs, weightShortageTons, weightShortageKgs]);

    // Form submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        console.log('=== FORM SUBMISSION START ===');
        console.log('Selected PO ID:', selectedPoId);
        console.log('Selected PO:', selectedPo);
        console.log('GR Number:', grNo);
        console.log('Vehicle Number:', vehicleNo);
        
        if (!selectedPoId) {
            console.error('Validation failed: No PO selected');
            toast.error('Please select a Purchase Order');
            return;
        }

        if (!grNo.trim()) {
            console.error('Validation failed: No GR Number');
            toast.error('Please enter GR Number');
            return;
        }

        if (!vehicleNo.trim()) {
            console.error('Validation failed: No Vehicle Number');
            toast.error('Please enter Vehicle Number');
            return;
        }

        console.log('Form validation passed, starting submission...');
        setLoading(true);

        try {
            const ladenTotal = toTotalKgs(ladenWtTons, ladenWtKgs);
            const emptyTotal = toTotalKgs(emptyWtTons, emptyWtKgs);
            const shortageTotal = toTotalKgs(weightShortageTons, weightShortageKgs);
            const netTotal = ladenTotal - emptyTotal - shortageTotal;

            const preGREntry = {
                po_id: selectedPoId,
                vouchernumber: poVoucherNumber,
                date: grDate,
                supplier_id: selectedPo.supplier_id,
                item_id: selectedPo.item_id,
                quantity: parseFloat(poQuantity) || 0,
                rate: parseFloat(poRate) || 0,
                damage_allowed: parseFloat(poDamageAllowed) || 0,
                cargo: parseFloat(poCargo) || 0,
                ladden_wt: ladenTotal,
                empty_wt: emptyTotal,
                net_wt: netTotal,
                vehicle_no: vehicleNo,
                bags: parseInt(bags) || 0,
                loaded_from: loadedFrom,
                weight_bridge_name: weightBridgeName,
                gr_no: grNo,
                gr_dt: grDt,
                podi_bags: parseInt(podiBags) || 0,
                gap_item1_id: gapItem1Id,
                gap_item1_qty: parseInt(gapItem1Bags) || 0,
                gap_item2_id: gapItem2Id,
                gap_item2_qty: parseInt(gapItem2Bags) || 0,
                weight_shortage: shortageTotal,
                sieve_no: sieveNo,
                prepared_by: preparedBy,
                is_admin_approved: isAdminApproved,
                admin_remark: adminRemark
            };

            console.log('Submitting Pre-GR entry:', preGREntry);
            console.log('Supabase client:', supabase);
            console.log('About to call supabase.insert...');

            const { data, error } = await supabase
                .from('pre_gr_entry')
                .insert([preGREntry])
                .select();

            console.log('Supabase response - data:', data);
            console.log('Supabase response - error:', error);

            if (error) {
                console.error('Error creating Pre-GR entry:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            }

            console.log('Pre-GR entry created successfully:', data);
            toast.success('Pre-GR entry created successfully!');
            
            // Reset form
            resetForm();
            
            // Redirect to pre-gr list
            router.push('/pre-gr-list');

        } catch (error) {
            console.error('CATCH BLOCK: Error creating Pre-GR entry:', error);
            console.error('CATCH BLOCK: Error type:', typeof error);
            console.error('CATCH BLOCK: Error message:', error.message);
            console.error('CATCH BLOCK: Error stack:', error.stack);
            console.error('CATCH BLOCK: Full error object:', error);
            toast.error('Failed to create Pre-GR entry: ' + (error.message || 'Unknown error'));
        } finally {
            console.log('FINALLY BLOCK: Setting loading to false');
            setLoading(false);
        }
    };

    if (loading) {
        console.log('DEBUG: Form is loading...');
        return <div className="text-center p-4 text-gray-700">Loading Pre-GR form...</div>;
    }

    console.log('DEBUG: Form should be rendering now...');
    console.log('DEBUG: Purchase Orders:', purchaseOrders.length);
    console.log('DEBUG: Selected PO:', selectedPo);

    return (
        <div className="container mx-auto p-4 flex-grow bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h2 className="text-3xl font-semibold text-green-800 dark:text-white-800 mb-6 text-center">Create New Pre-GR Entry</h2>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
                {/* PO Selection */}
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Select Purchase Order</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="poSelection" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purchase Order</label>
                            <select
                                id="poSelection"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-gray-200"
                                value={selectedPoId || ''}
                                onChange={(e) => {
                                    const poId = parseInt(e.target.value);
                                    setSelectedPoId(poId);
                                    console.log('MANUAL PO SELECTION:', poId);
                                }}
                            >
                                <option value="">-- Select Purchase Order --</option>
                                {purchaseOrders.map((po) => (
                                    <option key={po.id} value={po.id}>
                                        {po.vouchernumber} - {po.suppliers?.name || 'Unknown Supplier'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {purchaseOrders.length > 0 ? 
                                    `Found ${purchaseOrders.length} purchase orders` : 
                                    'No purchase orders available'
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* PO Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

                    <div>
                        <label htmlFor="poVoucherNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PO Voucher Number</label>
                        <input
                            type="text"
                            id="poVoucherNumber"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={poVoucherNumber}
                            readOnly
                        />
                    </div>

                    <div>
                        <label htmlFor="grDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PO Date</label>
                        <input
                            type="text"
                            id="grDate"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed dark:text-gray-200"
                            value={selectedPo ? formatDateDDMMYYYY(selectedPo.date) : ''}
                            readOnly
                        />
                    </div>

                    <div>
                        <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier Name</label>
                        <input
                            type="text"
                            id="supplierName"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={supplierName}
                            readOnly
                        />
                    </div>


                    <div>
                        <label htmlFor="itemQuality" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item Quality</label>
                        <input
                            type="text"
                            id="itemQuality"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={itemQuality}
                            readOnly
                        />
                    </div>

                    <div>
                        <label htmlFor="loadedFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loaded From</label>
                        <input
                            type="text"
                            id="loadedFrom"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={loadedFrom}
                            onChange={(e) => setLoadedFrom(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="vehicleNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle Number</label>
                        <input
                            type="text"
                            id="vehicleNo"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={vehicleNo}
                            onChange={(e) => setVehicleNo(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="bags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bags</label>
                        <input
                            type="number"
                            id="bags"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={bags}
                            onChange={(e) => setBags(e.target.value)}
                            min="0"
                        />
                    </div>

                    <div>
                        <label htmlFor="weightBridgeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight Bridge Name</label>
                        <input
                            type="text"
                            id="weightBridgeName"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={weightBridgeName}
                            onChange={(e) => setWeightBridgeName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="grNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">GR Number</label>
                        <input
                            type="text"
                            id="grNo"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={grNo}
                            onChange={(e) => setGrNo(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="grDt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">GR Date</label>
                        <input
                            type="date"
                            id="grDt"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={grDt}
                            onChange={(e) => setGrDt(e.target.value)}
                        />
                    </div>
                </div>

                {/* PO Details (Read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label htmlFor="poQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PO Quantity</label>
                        <input
                            type="text"
                            id="poQuantity"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={poQuantity}
                            readOnly
                        />
                    </div>

                    <div>
                        <label htmlFor="poRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PO Rate</label>
                        <input
                            type="text"
                            id="poRate"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={poRate}
                            readOnly
                        />
                    </div>

                    <div>
                        <label htmlFor="poDamageAllowed" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Damage Allowed</label>
                        <input
                            type="text"
                            id="poDamageAllowed"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={poDamageAllowed}
                            readOnly
                        />
                    </div>

                    <div>
                        <label htmlFor="poCargo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cargo</label>
                        <input
                            type="text"
                            id="poCargo"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={poCargo}
                            readOnly
                        />
                    </div>
                </div>

                {/* Weight Details */}
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Weight Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Laden Weight</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                    placeholder="Tons"
                                    value={ladenWtTons}
                                    onChange={(e) => setLadenWtTons(e.target.value)}
                                    min="0"
                                />
                                <input
                                    type="number"
                                    className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                    placeholder="Kgs"
                                    value={ladenWtKgs}
                                    onChange={(e) => setLadenWtKgs(e.target.value)}
                                    min="0"
                                    max="999"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empty Weight</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                    placeholder="Tons"
                                    value={emptyWtTons}
                                    onChange={(e) => setEmptyWtTons(e.target.value)}
                                    min="0"
                                />
                                <input
                                    type="number"
                                    className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                    placeholder="Kgs"
                                    value={emptyWtKgs}
                                    onChange={(e) => setEmptyWtKgs(e.target.value)}
                                    min="0"
                                    max="999"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Net Weight</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                                    placeholder="Tons"
                                    value={nettWtTons}
                                    readOnly
                                />
                                <input
                                    type="text"
                                    className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                                    placeholder="Kgs"
                                    value={nettWtKgs}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weight Shortage */}
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Weight Shortage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight Shortage</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                    placeholder="Tons"
                                    value={weightShortageTons}
                                    onChange={(e) => setWeightShortageTons(e.target.value)}
                                    min="0"
                                />
                                <input
                                    type="number"
                                    className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                    placeholder="Kgs"
                                    value={weightShortageKgs}
                                    onChange={(e) => setWeightShortageKgs(e.target.value)}
                                    min="0"
                                    max="999"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Podi Details */}
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Podi Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="podiBags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Podi Bags</label>
                            <input
                                type="number"
                                id="podiBags"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                value={podiBags}
                                onChange={(e) => setPodiBags(e.target.value)}
                                min="0"
                            />
                        </div>

                        <div>
                            <label htmlFor="podiBagWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Podi Bag Weight (Kgs)</label>
                            <input
                                type="number"
                                id="podiBagWeight"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                value={podiBagWeight}
                                onChange={(e) => setPodiBagWeight(e.target.value)}
                                min="0"
                                step="0.1"
                            />
                        </div>
                    </div>
                </div>

                {/* Gap Items */}
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Gap Items</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="gapItem1" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gap Item 1</label>
                            <select
                                id="gapItem1"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-gray-200"
                                value={gapItem1Id || ''}
                                onChange={(e) => setGapItem1Id(parseInt(e.target.value) || null)}
                            >
                                <option value="">-- Select Gap Item --</option>
                                {gapItems.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.item_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="gapItem1Bags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gap Item 1 Bags</label>
                            <input
                                type="number"
                                id="gapItem1Bags"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                value={gapItem1Bags}
                                onChange={(e) => setGapItem1Bags(e.target.value)}
                                min="0"
                            />
                        </div>

                        <div>
                            <label htmlFor="gapItem2" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gap Item 2</label>
                            <select
                                id="gapItem2"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-gray-200"
                                value={gapItem2Id || ''}
                                onChange={(e) => setGapItem2Id(parseInt(e.target.value) || null)}
                            >
                                <option value="">-- Select Gap Item --</option>
                                {gapItems.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.item_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="gapItem2Bags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gap Item 2 Bags</label>
                            <input
                                type="number"
                                id="gapItem2Bags"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                value={gapItem2Bags}
                                onChange={(e) => setGapItem2Bags(e.target.value)}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Details */}
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Additional Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="sieveNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sieve Number</label>
                            <input
                                type="text"
                                id="sieveNo"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                value={sieveNo}
                                onChange={(e) => setSieveNo(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="preparedBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prepared By</label>
                            <input
                                type="text"
                                id="preparedBy"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                value={preparedBy}
                                onChange={(e) => setPreparedBy(e.target.value)}
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>
                </div>

                {/* Admin Approval Section (only for admin users) */}
                {isAdmin && (
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Admin Approval</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isAdminApproved"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={isAdminApproved}
                                    onChange={(e) => setIsAdminApproved(e.target.checked)}
                                />
                                <label htmlFor="isAdminApproved" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                                    Admin Approved
                                </label>
                            </div>

                            <div>
                                <label htmlFor="adminRemark" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Remark</label>
                                <textarea
                                    id="adminRemark"
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                    value={adminRemark}
                                    onChange={(e) => setAdminRemark(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end space-x-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/pre-gr-list')}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={loading}
                    >
                        Reset
                    </Button>
                    <Button
                        type="submit"
                        variant="default"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {loading ? 'Creating...' : 'Create Pre-GR Entry'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
