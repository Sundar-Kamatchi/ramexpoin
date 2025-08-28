// nextjs-app/app/pre-gr/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import {supabase} from '../../lib/supabaseClient'; // Adjust path as needed
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { toast } from 'sonner'; // Import toast from sonner

export default function PreGRPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);

    // Data for dropdowns
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState([]);
    const [gapItems, setGapItems] = useState([]);

    // Form data state (matching pre_gr_entry table columns)
    const [preGREntryId, setPreGREntryId] = useState(null);
    const [selectedPoId, setSelectedPoId] = useState(null);
    const [selectedPo, setSelectedPo] = useState(null);
    const [poVoucherNumber, setPoVoucherNumber] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [supplierAddress, setSupplierAddress] = useState('');
    const [loadedFrom, setLoadedFrom] = useState('');
    const [itemQuality, setItemQuality] = useState('');
    const [vehicleNo, setVehicleNo] = useState('');
    const [bags, setBags] = useState('');
    // CORRECTED: Ensure grDate is initialized with useState
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

    // Podi field now in bags (moved from rejected to additional, and only bags)
    const [podiBags, setPodiBags] = useState('');
    const [podiBagWeight, setPodiBagWeight] = useState('45');

    // New fields from the provided table schema
    const [gapItem1Id, setGapItem1Id] = useState(null);
    const [gapItem1Bags, setGapItem1Bags] = useState('');
    const [gapItem2Id, setGapItem2Id] = useState(null);
    const [gapItem2Bags, setGapItem2Bags] = useState('');
    const [weightShortageTons, setWeightShortageTons] = useState('');
    const [weightShortageKgs, setWeightShortageKgs] = useState('');

    // Admin Approval fields
    const [isAdminApproved, setIsAdminApproved] = useState(false);
    const [adminRemark, setAdminRemark] = useState('');
    const [isAdmin, setIsAdmin] = useState(false); // Initialize isAdmin as false by default

    // Calculated fields (read-only in UI, derived from inputs)
    const [goodsWtTons, setGoodsWtTons] = useState('');
    const [goodsWtKgs, setGoodsWtKgs] = useState('');
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
        setPreGREntryId(null);
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
    };

    // Main data fetching effect
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            if (!supabase) {
                toast.error('Supabase client is not initialized. Please check your configuration.');
                setLoading(false);
                console.error('Supabase client is undefined in PreGRPage.');
                return;
            }

            try {
                // Determine admin status based on user email
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

                // Fetch all master data
                const { data: poData, error: poError } = await supabase
                    .from('purchase_orders')
                    .select('id, vouchernumber, date, supplier_id, item_id, quantity, rate, damage_allowed, cargo, damage_allowed_kgs_ton');
                if (poError) throw poError;
                setPurchaseOrders(poData || []);

                const { data: suppliersData, error: suppliersError } = await supabase
                    .from('suppliers')
                    .select('id, name, address');
                if (suppliersError) throw suppliersError;
                setSuppliers(suppliersData || []);

                const { data: itemsData, error: itemsError } = await supabase
                    .from('item_master')
                    .select('id, item_name');
                if (itemsError) throw itemsError;
                setItems(itemsData || []);

                const { data: gapItemsData, error: gapItemsError } = await supabase
                    .from('gap_items')
                    .select('id, name');
                if (gapItemsError) throw gapItemsError;
                setGapItems(gapItemsData || []);
                console.log('Fetched gapItems:', gapItemsData);

                // Get ID from URL and fetch specific Pre-GR entry if in edit mode
                const id = searchParams.get('id');
                if (id) {
                    const entryId = parseInt(id);
                    setPreGREntryId(entryId);

                    const { data: entryData, error: entryError } = await supabase
                        .from('pre_gr_entry')
                        .select('*')
                        .eq('id', entryId)
                        .single();

                    if (entryError) throw entryError;

                    if (entryData) {
                        setSelectedPoId(entryData.po_id);
                        const po = poData.find(p => p.id === entryData.po_id);
                        setSelectedPo(po);
                        if (po) {
                            setPoVoucherNumber(po.vouchernumber);
                            setGrDate(entryData.date);
                            const supplier = suppliersData.find(s => s.id === po.supplier_id);
                            if (supplier) {
                                setSupplierName(supplier.name);
                                setSupplierAddress(supplier.address || '');
                            }
                            const poItem = itemsData.find(item => item.id === po.item_id);
                            setItemQuality(poItem ? poItem.item_name : '');
                            setPoQuantity(po.quantity ? po.quantity.toString() : '');
                            setPoRate(po.rate ? po.rate.toString() : '');
                            setPoDamageAllowed(po.damage_allowed_kgs_ton ? po.damage_allowed_kgs_ton.toString() : '');
                            setPoCargo(po.cargo ? po.cargo.toString() : '');
                        }

                        setLoadedFrom(entryData.loaded_from || '');
                        setVehicleNo(entryData.vehicle_no || '');
                        setBags(entryData.bags ? entryData.bags.toString() : '');
                        setWeightBridgeName(entryData.weight_bridge_name || '');
                        setGrNo(entryData.gr_no || '');
                        setGrDt(entryData.date || new Date().toISOString().slice(0, 10));

                        setLadenWtTons(fromTotalKgs(entryData.ladden_wt).tons);
                        setLadenWtKgs(fromTotalKgs(entryData.ladden_wt).kgs);
                        setEmptyWtTons(fromTotalKgs(entryData.empty_wt).tons);
                        setEmptyWtKgs(fromTotalKgs(entryData.empty_wt).kgs);
                        setNettWtTons(fromTotalKgs(entryData.net_wt).tons);
                        setNettWtKgs(fromTotalKgs(entryData.net_wt).kgs);

                        setPodiBags(entryData.podi_bags ? entryData.podi_bags.toString() : '');

                        const validGapItem1Id = gapItemsData.some(item => item.id === entryData.gap_item1_id) ? entryData.gap_item1_id : null;
                        setGapItem1Id(validGapItem1Id);
                        setGapItem1Bags(entryData.gap_item1_qty ? entryData.gap_item1_qty.toString() : '');

                        const validGapItem2Id = gapItemsData.some(item => item.id === entryData.gap_item2_id) ? entryData.gap_item2_id : null;
                        setGapItem2Id(validGapItem2Id);
                        setGapItem2Bags(entryData.gap_item2_qty ? entryData.gap_item2_qty.toString() : '');

                        setWeightShortageTons(fromTotalKgs(entryData.weight_shortage).tons);
                        setWeightShortageKgs(fromTotalKgs(entryData.weight_shortage).kgs);

                        setSieveNo(entryData.sieve_no || '');
                        setPreparedBy(entryData.prepared_by || '');
                        setIsAdminApproved(entryData.is_admin_approved || false);
                        setAdminRemark(entryData.admin_remark || '');
                    }
                } else {
                    resetForm();
                }

            } catch (err) {
                toast.error(`Failed to fetch data: ${err.message}`);
                console.error('Overall Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Listen for auth state changes to update admin status in real-time
        const { data: { subscription: authListenerSubscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const userEmail = session?.user?.email;
            const userIsAdmin = userEmail && userEmail.startsWith('admin');
            setIsAdmin(userIsAdmin);
            console.log('Auth State Changed: User Email:', userEmail, 'Is Admin:', userIsAdmin);
        });

        // Cleanup listener on component unmount
        return () => {
            if (authListenerSubscription) {
                authListenerSubscription.unsubscribe();
            }
        };
    }, [searchParams]);

    // New useEffect to populate PO-related fields when selectedPoId changes
    useEffect(() => {
        if (selectedPoId && purchaseOrders.length > 0 && suppliers.length > 0 && items.length > 0) {
            const po = purchaseOrders.find(p => p.id === selectedPoId);
            setSelectedPo(po); // Set the selected PO object

            if (po) {
                setPoVoucherNumber(po.vouchernumber || '');
                // No need to set grDate here, it's a form input
                const supplier = suppliers.find(s => s.id === po.supplier_id);
                if (supplier) {
                    setSupplierName(supplier.name || '');
                    setSupplierAddress(supplier.address || '');
                } else {
                    setSupplierName('');
                    setSupplierAddress('');
                }
                const poItem = items.find(item => item.id === po.item_id);
                setItemQuality(poItem ? poItem.item_name : '');
                setPoQuantity(po.quantity ? po.quantity.toString() : '');
                setPoRate(po.rate ? po.rate.toString() : '');
                setPoDamageAllowed(po.damage_allowed_kgs_ton ? po.damage_allowed_kgs_ton.toString() : '');
                setPoCargo(po.cargo ? po.cargo.toString() : '');
            } else {
                // Clear PO-related fields if no PO is selected or found
                setPoVoucherNumber('');
                setSupplierName('');
                setSupplierAddress('');
                setItemQuality('');
                setPoQuantity('');
                setPoRate('');
                setPoDamageAllowed('');
                setPoCargo('');
            }
        } else if (!selectedPoId) {
            // Clear fields if selectedPoId becomes null (e.g., on form reset)
            setPoVoucherNumber('');
            setSupplierName('');
            setSupplierAddress('');
            setItemQuality('');
            setPoQuantity('');
            setPoRate('');
            setPoDamageAllowed('');
            setPoCargo('');
        }
    }, [selectedPoId, purchaseOrders, suppliers, items]); // Dependencies for this effect


    // Effect to calculate Goods Wt, Nett Wt (remains separate for reactivity to input changes)
    useEffect(() => {
        const ladenKgs = toTotalKgs(ladenWtTons, ladenWtKgs);
        const emptyKgs = toTotalKgs(emptyWtTons, emptyWtKgs);
        const podiKgsVal = (parseFloat(podiBags) || 0) * (parseFloat(podiBagWeight) || 0);

        const calculatedGoodsKgs = ladenKgs - emptyKgs;
        setGoodsWtTons(fromTotalKgs(calculatedGoodsKgs).tons);
        setGoodsWtKgs(fromTotalKgs(calculatedGoodsKgs).kgs);

        const calculatedNettKgs = calculatedGoodsKgs - podiKgsVal;
        setNettWtTons(fromTotalKgs(calculatedNettKgs).tons);
        setNettWtKgs(fromTotalKgs(calculatedNettKgs).kgs);

    }, [ladenWtTons, ladenWtKgs, emptyWtTons, emptyWtKgs, podiBags, podiBagWeight]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('handleSubmit triggered'); // Log at the very beginning
        setLoading(true);

        if (!supabase) {
            toast.error('Supabase client not initialized.');
            setLoading(false);
            console.log('Supabase client not initialized.'); // Log for debugging
            return;
        }
        console.log('Supabase client initialized.'); // Log for debugging


        // --- Validation Checks ---
        const errors = [];

        if (!selectedPoId) {
            errors.push('Please select a Purchase Order.');
        }
        if (!grDate) {
            errors.push('GR Date is required.');
        }
        if (!loadedFrom.trim()) {
            errors.push('Loaded From is required.');
        }
        if (!vehicleNo.trim()) {
            errors.push('Vehicle No. is required.');
        }
        // Assuming bags is a required numeric input
        if (bags === '' || isNaN(parseFloat(bags))) {
            errors.push('Bags quantity is required and must be a number.');
        }
        if (!weightBridgeName.trim()) {
            errors.push('Weight Bridge Name is required.');
        }
        if (!grNo.trim()) {
            errors.push('GR No. is required.');
        }
        if (!grDt) {
            errors.push('GR Dt. is required.');
        }
        // Check for weight inputs. If both tons and kgs are empty, consider it empty.
        if (ladenWtTons === '' && ladenWtKgs === '') {
            errors.push('Laden Weight (Tons or Kgs) is required.');
        }
        if (emptyWtTons === '' && emptyWtKgs === '') {
            errors.push('Empty Weight (Tons or Kgs) is required.');
        }
        if (!sieveNo.trim()) {
            errors.push('Sieve No. is required.');
        }
        if (!preparedBy.trim()) {
            errors.push('Prepared By is required.');
        }

        if (errors.length > 0) {
            errors.forEach(msg => toast.error(msg)); // Display each error as a toast
            setLoading(false);
            console.log('Validation failed. Errors:', errors); // Log for debugging
            return;
        }
        console.log('Validation passed. Proceeding to save.'); // Log for debugging


        // Combine Tons and Kgs into single numeric values for database storage
        const laden_wt = toTotalKgs(ladenWtTons, ladenWtKgs);
        const empty_wt = toTotalKgs(emptyWtTons, emptyWtKgs);
        const net_wt = toTotalKgs(nettWtTons, nettWtKgs);
        const podi = parseFloat(podiBags) || 0;
        const gap_item1_qty = parseInt(gapItem1Bags) || 0;
        const gap_item2_qty = parseInt(gapItem2Bags) || 0;
        const weight_shortage = toTotalKgs(weightShortageTons, weightShortageKgs);

        // Prepare data for saving (matching pre_gr_entry table columns)
        const preGrData = {
            po_id: selectedPoId,
            vouchernumber: selectedPo.vouchernumber,
            date: grDate,
            supplier_id: selectedPo.supplier_id,
            item_id: selectedPo.item_id,

            // Ensure these PO-related numeric fields are parsed to numbers
            quantity: parseFloat(selectedPo.quantity) || 0,
            rate: parseFloat(selectedPo.rate) || 0,
            damage_allowed: parseFloat(selectedPo.damage_allowed_kgs_ton) || 0,
            cargo: parseFloat(selectedPo.cargo) || 0,

            ladden_wt: laden_wt,
            empty_wt: empty_wt,
            net_wt: net_wt,
            podi_bags: podi,
            gap_item1_id: gapItem1Id,
            gap_item1_qty: gap_item1_qty,
            gap_item2_id: gapItem2Id,
            gap_item2_qty: gap_item2_qty,
            weight_shortage: weight_shortage,

            gr_no: grNo,
            weight_bridge_name: weightBridgeName,
            loaded_from: loadedFrom,
            vehicle_no: vehicleNo,
            bags: parseFloat(bags) || 0, // Ensure bags is a number
            sieve_no: sieveNo,
            prepared_by: preparedBy,
            is_admin_approved: isAdminApproved,
            admin_remark: adminRemark,
        };

        console.log('Pre-GR Data Payload:', preGrData);
        console.log('Value of gapItem1Id being sent:', gapItem1Id);
        console.log('Value of gapItem2Id being sent:', gapItem2Id);


        try {
            let result;
            if (preGREntryId) {
                // Update existing entry
                console.log('Attempting to update Pre-GR entry with ID:', preGREntryId);
                result = await supabase
                    .from('pre_gr_entry')
                    .update(preGrData)
                    .eq('id', preGREntryId)
                    .select();
            } else {
                // Insert new entry
                console.log('Attempting to insert new Pre-GR entry.');
                result = await supabase
                    .from('pre_gr_entry')
                    .insert([preGrData])
                    .select();
            }

            if (result.error) throw result.error;

            toast.success('Pre-GR entry saved successfully!'); // Display success toast
            console.log('Pre-GR saved:', result.data);

            // Redirect to list page
            router.push('/pre-gr-list');

        } catch (err) {
            toast.error(`Failed to save Pre-GR entry: ${err.message}`); // Display error toast
            console.error('Save error:', err); // Log the full error object
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push('/pre-gr-list');
    };

    // Determine if admin approval section fields should be disabled for non-admin users after approval
    const isApprovalSectionDisabledForNonAdmin = isAdminApproved && !isAdmin;

    if (loading) return <div className="text-center p-4 text-gray-700">Loading Pre-GR form...</div>;

    return (
        <div className="container mx-auto p-4 flex-grow bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h2 className="text-3xl font-semibold text-green-800 dark:text-white-800 mb-6 text-center">Pre-GR Entry {preGREntryId ? '(Edit Mode)' : '(New Entry)'}</h2>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
                {/* PO Selection and Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label htmlFor="poSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Purchase Order</label>
                        <select
                            id="poSelect"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={selectedPoId || ''}
                            onChange={(e) => setSelectedPoId(parseInt(e.target.value))}
                            // Only disable PO selection in edit mode
                            disabled={preGREntryId !== null}
                        >
                            <option value="">-- Select PO --</option>
                            {purchaseOrders.map((po) => (
                                <option key={po.id} value={po.id}>
                                    {po.vouchernumber} - {po.date}
                                </option>
                            ))}
                        </select>
                    </div>

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
                        <label htmlFor="grDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">GR Date</label>
                        <input
                            type="date"
                            id="grDate"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={grDate}
                            onChange={(e) => setGrDate(e.target.value)}
                            // Not disabled by approval status
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
                        <label htmlFor="supplierAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier Address</label>
                        <input
                            type="text"
                            id="supplierAddress"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={supplierAddress}
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
                            // Not disabled by approval status
                        />
                    </div>

                    <div>
                        <label htmlFor="itemQuality" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item / Quality</label>
                        <input
                            type="text"
                            id="itemQuality"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={itemQuality}
                            readOnly
                        />
                    </div>

                    <div>
                        <label htmlFor="vehicleNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle No.</label>
                        <input
                            type="text"
                            id="vehicleNo"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={vehicleNo}
                            onChange={(e) => setVehicleNo(e.target.value)}
                            // Not disabled by approval status
                        />
                    </div>

                    <div>
                        <label htmlFor="bags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bags</label>
                        <input
                            type="number"
                            id="bags"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 text-right pr-2"
                            value={bags}
                            onChange={(e) => setBags(e.target.value)}
                            // Not disabled by approval status
                        />
                    </div>
                </div>

                {/* PO Details (Read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border border-blue-200 dark:border-blue-700 rounded-md bg-blue-50 dark:bg-blue-950">
                    <h3 className="col-span-full text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Purchase Order Details</h3>
                    <div>
                        <label htmlFor="poQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PO Quantity</label>
                        <input
                            type="text"
                            id="poQuantity"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={poQuantity}
                            readOnly
                        />
                    </div>
                    <div>
                        <label htmlFor="poRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PO Rate</label>
                        <input
                            type="text"
                            id="poRate"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={poRate}
                            readOnly
                        />
                    </div>
                    <div>
                                                    <label htmlFor="poDamageAllowed" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Damage per ton kg</label>
                        <input
                            type="text"
                            id="poDamageAllowed"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={poDamageAllowed}
                            readOnly
                        />
                    </div>
                    <div>
                        <label htmlFor="poCargo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cargo</label>
                        <input
                            type="text"
                            id="poCargo"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={poCargo}
                            readOnly
                        />
                    </div>
                </div>

                {/* Weight Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label htmlFor="weightBridgeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight Bridge Name</label>
                        <input
                            type="text"
                            id="weightBridgeName"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={weightBridgeName}
                            onChange={(e) => setWeightBridgeName(e.target.value)}
                            // Not disabled by approval status
                        />
                    </div>
                    <div>
                        <label htmlFor="grNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">GR No.</label>
                        <input
                            type="text"
                            id="grNo"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={grNo}
                            onChange={(e) => setGrNo(e.target.value)}
                            // Not disabled by approval status
                        />
                    </div>
                    <div>
                        <label htmlFor="grDt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">GR Dt.</label>
                        <input
                            type="date"
                            id="grDt"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={grDt}
                            onChange={(e) => setGrDt(e.target.value)}
                            // Not disabled by approval status
                        />
                    </div>
                </div>

                {/* Weight Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div className="col-span-full text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Weight Details</div>
                    {/* Laden Weight */}
                    <div className="flex items-center space-x-2">
                        <label htmlFor="ladenWtTons" className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Laden Wt.</label>
                        <input
                            type="number"
                            id="ladenWtTons"
                            placeholder="Tons"
                            className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 text-right pr-2"
                            value={ladenWtTons}
                            onChange={(e) => setLadenWtTons(e.target.value)}
                            // Not disabled by approval status
                        />
                        <input
                            type="number"
                            id="ladenWtKgs"
                            placeholder="Kgs"
                            className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 text-right pr-2"
                            value={ladenWtKgs}
                            onChange={(e) => setLadenWtKgs(e.target.value)}
                            // Not disabled by approval status
                        />
                    </div>

                    {/* Empty Weight */}
                    <div className="flex items-center space-x-2">
                        <label htmlFor="emptyWtTons" className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Empty Wt.</label>
                        <input
                            type="number"
                            id="emptyWtTons"
                            placeholder="Tons"
                            className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 text-right pr-2"
                            value={emptyWtTons}
                            onChange={(e) => setEmptyWtTons(e.target.value)}
                            // Not disabled by approval status
                        />
                        <input
                            type="number"
                            id="emptyWtKgs"
                            placeholder="Kgs"
                            className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 text-right pr-2"
                            value={emptyWtKgs}
                            onChange={(e) => setEmptyWtKgs(e.target.value)}
                            // Not disabled by approval status
                        />
                    </div>

                    {/* Goods Weight (Calculated) */}
                    <div className="flex items-center space-x-2">
                        <label htmlFor="goodsWtTons" className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Goods Wt.</label>
                        <input
                            type="text"
                            id="goodsWtTons"
                            placeholder="Tons"
                            className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={goodsWtTons}
                            readOnly
                        />
                        <input
                            type="text"
                            id="goodsWtKgs"
                            placeholder="Kgs"
                            className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 dark:text-gray-200 shadow-sm sm:text-sm bg-gray-100 cursor-not-allowed"
                            value={goodsWtKgs}
                            readOnly
                        />
                    </div>

                    {/* Nett Weight (Calculated) */}
                    <div className="flex items-center space-x-2">
                        <label htmlFor="nettWtTons" className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Nett Wt.</label>
                        <input
                            type="text"
                            id="nettWtTons"
                            placeholder="Tons"
                            className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={nettWtTons}
                            readOnly
                        />
                        <input
                            type="text"
                            id="nettWtKgs"
                            placeholder="Kgs"
                            className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 cursor-not-allowed"
                            value={nettWtKgs}
                            readOnly
                        />
                    </div>
                </div>

                {/* Gap Items and Weight Shortage and Podi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div className="col-span-full text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Additional Details</div>

                    {/* Podi (Bags) - Moved here and only bags input */}
                    <div className="flex items-center space-x-2">
                        <label htmlFor="podiBags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Podi (Bags)</label>
                        <input
                            type="number"
                            id="podiBags"
                            placeholder="Bags"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 text-right pr-2"
                            value={podiBags}
                            onChange={(e) => setPodiBags(e.target.value)}
                            // Not disabled by approval status
                        />
                    </div>

                    {/* Gap Item 1 */}
                    <div>
                        <label htmlFor="gapItem1Id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gap Item 1</label>
                        <select
                            id="gapItem1Id"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={gapItem1Id || ''}
                            onChange={(e) => setGapItem1Id(e.target.value || null)}
                            // Not disabled by approval status
                        >
                            <option value="">-- Select Item --</option>
                            {gapItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="gapItem1Bags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Qty (Gap 1) Bags</label>
                        <input
                            type="number"
                            id="gapItem1Bags"
                            placeholder="Bags"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 text-right pr-2"
                            value={gapItem1Bags}
                            onChange={(e) => setGapItem1Bags(e.target.value)}
                            // Not disabled by approval status
                        />
                    </div>

                    {/* Gap Item 2 */}
                    <div>
                        <label htmlFor="gapItem2Id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gap Item 2</label>
                        <select
                            id="gapItem2Id"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={gapItem2Id || ''}
                            onChange={(e) => setGapItem2Id(e.target.value || null)}
                            // Not disabled by approval status
                        >
                            <option value="">-- Select Item --</option>
                            {gapItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="gapItem2Bags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Qty (Gap 2) Bags</label>
                        <input
                            type="number"
                            id="gapItem2Bags"
                            placeholder="Bags"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 text-right pr-2"
                            value={gapItem2Bags}
                            onChange={(e) => setGapItem2Bags(e.target.value)}
                            // Not disabled by approval status
                        />
                    </div>

                    {/* Weight Shortage */}
                    <div className="flex items-center space-x-2">
                        <label htmlFor="weightShortageTons" className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Weight Shortage</label>
                        <input
                            type="number"
                            id="weightShortageTons"
                            placeholder="Tons"
                            className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 text-right pr-2"
                            value={weightShortageTons}
                            onChange={(e) => setWeightShortageTons(e.target.value)}
                            // Not disabled by approval status
                        />
                        <input
                            type="number"
                            id="weightShortageKgs"
                            placeholder="Kgs"
                            className="mt-1 block w-1/2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 text-right pr-2"
                            value={weightShortageKgs}
                            onChange={(e) => setWeightShortageKgs(e.target.value)}
                            // Not disabled by approval status
                        />
                    </div>
                </div>

                {/* Sieve No. and Prepared By */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="sieveNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sieve No.</label>
                        <input
                            type="text"
                            id="sieveNo"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            value={sieveNo}
                            onChange={(e) => setSieveNo(e.target.value)}
                            // Not disabled by approval status
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
                            // Not disabled by approval status
                        />
                    </div>
                </div>

                {/* Admin Approval Section - Only visible if isAdmin is true */}
                {isAdmin && (
                    <div className="border border-green-200 dark:border-green-700 rounded-md p-4 mb-6 bg-green-50 dark:bg-green-950">
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Admin Approval</h3>
                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                id="adminApproval"
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                checked={isAdminApproved}
                                onChange={(e) => setIsAdminApproved(e.target.checked)}
                                disabled={isApprovalSectionDisabledForNonAdmin} // Disabled if not admin and already approved
                            />
                            <label htmlFor="adminApproval" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Admin Approved
                            </label>
                        </div>
                        {isAdminApproved && (
                            <div>
                                <label htmlFor="adminRemark" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Remark</label>
                                <textarea
                                    id="adminRemark"
                                    rows="3"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                    value={adminRemark}
                                    onChange={(e) => setAdminRemark(e.target.value)}
                                    disabled={isApprovalSectionDisabledForNonAdmin} // Disabled if not admin and already approved
                                ></textarea>
                            </div>
                        )}
                    </div>
                )}

                {/* Submit and Cancel Buttons */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                        disabled={loading} // Only disabled by loading state, not by approval status
                    >
                        {loading ? 'Saving...' : 'Save Pre-GR Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
}
