'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { formatDateDDMMYYYY, numberToWords } from '@/utils/dateUtils';
import { Printer } from 'lucide-react';
import { PreGrPrintLayout } from '@/utils/pre_gr_print'; // Import the new print component
import DeleteButton from '@/components/DeleteButton';
import { useAuth } from '@/hooks/use-auth';

// Helper to convert DD/MM/YYYY to YYYY-MM-DD
const toISODate = (ddmmyyyy) => {
    if (!ddmmyyyy || typeof ddmmyyyy !== 'string') return null;
    const parts = ddmmyyyy.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    if (!day || !month || !year) return null;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export default function PreGRPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;
    const { isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);

    // Data for dropdowns
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState([]);
    const [gapItems, setGapItems] = useState([]);

    // Form data state
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
    const [grDate, setGrDate] = useState(formatDateDDMMYYYY(new Date()));
    const [weightBridgeName, setWeightBridgeName] = useState('');
    const [grNo, setGrNo] = useState('');
    const [grDt, setGrDt] = useState(formatDateDDMMYYYY(new Date()));
    const [poQuantity, setPoQuantity] = useState('');
    const [poRate, setPoRate] = useState('');
    const [poDamageAllowed, setPoDamageAllowed] = useState('');
    const [poCargo, setPoCargo] = useState('');
    const [ladenWtKgs, setLadenWtKgs] = useState('');
    const [emptyWtKgs, setEmptyWtKgs] = useState('');
    const [goodsWtKgs, setGoodsWtKgs] = useState('');
    const [podiBags, setPodiBags] = useState('');
    const [gapItem1Id, setGapItem1Id] = useState(null);
    const [gapItem1Bags, setGapItem1Bags] = useState('');
    const [gapItem2Id, setGapItem2Id] = useState(null);
    const [gapItem2Bags, setGapItem2Bags] = useState('');
    const [isAdminApproved, setIsAdminApproved] = useState(false);
    const [adminRemark, setAdminRemark] = useState('');
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [sieveNo, setSieveNo] = useState('');
    const [preparedBy, setPreparedBy] = useState('');
    const [weightShortage, setWeightShortage] = useState('');
    const [remarks, setRemarks] = useState('');

    const isApprovalSectionDisabledForNonAdmin = isAdminApproved && !isAdmin;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                console.log('Pre-GR Page: Starting to fetch data...');

                const [poRes, supRes, itemRes, gapRes] = await Promise.all([
                    supabase.from('purchase_orders').select('id, vouchernumber, date, supplier_id, item_id, quantity, rate, cargo, damage_allowed_kgs_ton, suppliers(name)'),
                    supabase.from('suppliers').select('id, name, address'),
                    supabase.from('item_master').select('id, item_name'),
                    supabase.from('gap_items').select('id, name')
                ]);

                if (poRes.error) {
                    console.error('Pre-GR Page: Error fetching POs:', poRes.error);
                    throw poRes.error;
                }
                if (supRes.error) {
                    console.error('Pre-GR Page: Error fetching suppliers:', supRes.error);
                    throw supRes.error;
                }
                if (itemRes.error) {
                    console.error('Pre-GR Page: Error fetching items:', itemRes.error);
                    throw itemRes.error;
                }
                if (gapRes.error) {
                    console.error('Pre-GR Page: Error fetching gap items:', gapRes.error);
                    throw gapRes.error;
                }

                const poData = poRes.data || [];
                const suppliersData = supRes.data || [];
                const itemsData = itemRes.data || [];
                const gapItemsData = gapRes.data || [];
                
                console.log('Pre-GR Page: Fetched data - POs:', poData.length, 'Suppliers:', suppliersData.length, 'Items:', itemsData.length, 'Gap Items:', gapItemsData.length);
                
                // Debug: Log the first PO to see its structure
                if (poData.length > 0) {
                    console.log('Pre-GR Page: First PO data structure:', poData[0]);
                    console.log('Pre-GR Page: Available columns in PO:', Object.keys(poData[0]));
                    console.log('Pre-GR Page: damage_allowed_kgs_ton value:', poData[0].damage_allowed_kgs_ton);
                    console.log('Pre-GR Page: damage_allowed_kgs_ton type:', typeof poData[0].damage_allowed_kgs_ton);
                    
                    // Check all POs for damage_allowed_kgs_ton
                    poData.forEach((po, index) => {
                        console.log(`Pre-GR Page: PO ${index + 1} (${po.vouchernumber}): damage_allowed_kgs_ton =`, po.damage_allowed_kgs_ton);
                    });
                }
                
                setPurchaseOrders(poData);
                setSuppliers(suppliersData);
                setItems(itemsData);
                setGapItems(gapItemsData);

                if (id && id !== 'new') {
                    console.log('Pre-GR Page: Editing existing entry with ID:', id);
                    const { data: entryData, error: entryError } = await supabase.from('pre_gr_entry').select('*').eq('id', parseInt(id)).single();
                    if (entryError) {
                        console.error('Pre-GR Page: Error fetching entry:', entryError);
                        throw entryError;
                    }
                    if (entryData) {
                        console.log('Pre-GR Page: Found entry data:', entryData);
                        setPreGREntryId(entryData.id);
                        setSelectedPoId(entryData.po_id);
                        const po = poData.find(p => p.id === entryData.po_id);
                        if (po) {
                            console.log('Pre-GR Page: Found PO for entry:', po);
                            setSelectedPo(po);
                            setPoVoucherNumber(po.vouchernumber);
                            const supplier = suppliersData.find(s => s.id === po.supplier_id);
                            if (supplier) {
                                setSupplierName(supplier.name);
                                setSupplierAddress(supplier.address || '');
                            }
                            const poItem = itemsData.find(item => item.id === po.item_id);
                            setItemQuality(poItem ? poItem.item_name : '');
                            setPoQuantity(po.quantity?.toString() || '');
                            setPoRate(po.rate?.toString() || '');
                            setPoDamageAllowed(po.damage_allowed_kgs_ton?.toString() || '');
                            setPoCargo(po.cargo?.toString() || '');
                        }
                        setGrDate(formatDateDDMMYYYY(entryData.date));
                        setLoadedFrom(entryData.loaded_from || '');
                        setVehicleNo(entryData.vehicle_no || '');
                        setBags(entryData.bags?.toString() || '');
                        setWeightBridgeName(entryData.weight_bridge_name || '');
                        setGrNo(entryData.gr_no || '');
                        setGrDt(entryData.gr_dt ? formatDateDDMMYYYY(entryData.gr_dt) : formatDateDDMMYYYY(new Date()));
                        setLadenWtKgs(entryData.ladden_wt?.toString() || '');
                        setEmptyWtKgs(entryData.empty_wt?.toString() || '');
                        setPodiBags(entryData.podi_bags?.toString() || '');
                        setGapItem1Id(entryData.gap_item1_id);
                        setGapItem1Bags(entryData.gap_item1_qty?.toString() || '');
                        setGapItem2Id(entryData.gap_item2_id);
                        setGapItem2Bags(entryData.gap_item2_qty?.toString() || '');
                        setSieveNo(entryData.sieve_no || '');
                        setPreparedBy(entryData.prepared_by || '');
                        setWeightShortage(entryData.weight_shortage?.toString() || '');
                        setRemarks(entryData.remarks || '');
                        setIsAdminApproved(entryData.is_admin_approved || false);
                        setAdminRemark(entryData.admin_remark || '');
                        setAdvanceAmount(entryData.admin_approved_advance && entryData.admin_approved_advance > 0 ? entryData.admin_approved_advance.toString() : '');
                    }
                } else {
                    console.log('Pre-GR Page: Creating new entry');
                }
            } catch (err) {
                console.error('Pre-GR Page: Error in fetchData:', err);
                toast.error(`Failed to fetch data: ${err.message}`);
            } finally {
                console.log('Pre-GR Page: Setting loading to false');
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);
    
    useEffect(() => {
        if (selectedPoId) {
            const po = purchaseOrders.find(p => p.id === selectedPoId);
            if (po) {
                console.log('Selected PO data:', po);
                console.log('PO damage_allowed_kgs_ton:', po.damage_allowed_kgs_ton);
                console.log('PO damage_allowed_kgs_ton type:', typeof po.damage_allowed_kgs_ton);
                console.log('All PO fields:', Object.keys(po));
                console.log('All PO values:', Object.values(po));
                
                // Check if damage_allowed_kgs_ton exists in the PO object
                if ('damage_allowed_kgs_ton' in po) {
                    console.log('damage_allowed_kgs_ton field exists in PO object');
                } else {
                    console.log('damage_allowed_kgs_ton field does NOT exist in PO object');
                }
                
                setSelectedPo(po);
                setPoVoucherNumber(po.vouchernumber || '');
                const supplier = suppliers.find(s => s.id === po.supplier_id);
                setSupplierName(supplier?.name || '');
                setSupplierAddress(supplier?.address || '');
                const item = items.find(i => i.id === po.item_id);
                setItemQuality(item?.item_name || '');
                setPoQuantity(po.quantity?.toString() || '');
                setPoRate(po.rate?.toString() || '');
                const damageValue = po.damage_allowed_kgs_ton?.toString() || '';
                console.log('Setting poDamageAllowed to:', damageValue);
                setPoDamageAllowed(damageValue);
                setPoCargo(po.cargo?.toString() || '');
            } else {
                console.log('PO not found for ID:', selectedPoId);
                console.log('Available POs:', purchaseOrders.map(p => ({ id: p.id, vouchernumber: p.vouchernumber })));
            }
        }
    }, [selectedPoId, purchaseOrders, suppliers, items]);

    useEffect(() => {
        const ladenKgs = parseFloat(ladenWtKgs) || 0;
        const emptyKgs = parseFloat(emptyWtKgs) || 0;
        const goodsWtTotal = ladenKgs - emptyKgs;
        setGoodsWtKgs(goodsWtTotal >= 0 ? Math.round(goodsWtTotal).toString() : '');
    }, [ladenWtKgs, emptyWtKgs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Check if admin approval is required (when podi_bags > 0)
        const podiBagsValue = parseFloat(podiBags) || 0;
        if (podiBagsValue > 0 && !isAdminApproved && !isAdmin) {
            toast.error('Admin approval is required when PODI bags > 0.');
            return;
        }
        
        if (isAdminApproved && !isAdmin) {
            toast.error('This entry is approved and cannot be altered.');
            return;
        }
        setLoading(true);
        if (!selectedPoId) {
            toast.error('Please select a Purchase Order.');
            setLoading(false);
            return;
        }
        
        // Calculate net weight (laden weight - empty weight)
        const netWt = (parseFloat(ladenWtKgs) || 0) - (parseFloat(emptyWtKgs) || 0);
        
        const preGrData = {
            po_id: selectedPoId,
            vouchernumber: selectedPo.vouchernumber,
            date: toISODate(grDate),
            supplier_id: selectedPo.supplier_id,
            item_id: selectedPo.item_id,
            quantity: parseFloat(selectedPo.quantity) || 0,
            rate: parseFloat(selectedPo.rate) || 0,
            damage_allowed: parseFloat(selectedPo.damage_allowed_kgs_ton) || 0,
            cargo: parseFloat(selectedPo.cargo) || 0,
            ladden_wt: parseFloat(ladenWtKgs) || 0,
            empty_wt: parseFloat(emptyWtKgs) || 0,
            net_wt: netWt, // Calculate and store net weight
            podi_bags: parseFloat(podiBags) || 0,
            gap_item1_id: gapItem1Id || null,
            gap_item1_qty: parseInt(gapItem1Bags) || 0,
            gap_item2_id: gapItem2Id || null,
            gap_item2_qty: parseInt(gapItem2Bags) || 0,
            gr_no: grNo,
            gr_dt: toISODate(grDt),
            weight_bridge_name: weightBridgeName,
            loaded_from: loadedFrom,
            vehicle_no: vehicleNo,
            bags: parseFloat(bags) || 0,
            sieve_no: sieveNo,
            prepared_by: preparedBy,
            is_admin_approved: isAdminApproved,
            admin_remark: adminRemark,
            admin_approved_advance: parseFloat(advanceAmount) || 0,
            weight_shortage: parseFloat(weightShortage) || 0,
            remarks: remarks,
            is_gqr_created: preGREntryId ? (await supabase.from('pre_gr_entry').select('is_gqr_created').eq('id', preGREntryId).single()).data.is_gqr_created : false,
        };

        try {
            const { error } = preGREntryId
                ? await supabase.from('pre_gr_entry').update(preGrData).eq('id', preGREntryId)
                : await supabase.from('pre_gr_entry').insert([preGrData]);
            if (error) throw error;
            toast.success('Pre-GR entry saved successfully!');
            router.push('/pre-gr-list');
        } catch (err) {
            toast.error(`Failed to save Pre-GR entry: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => router.push('/pre-gr-list');

    const handleDelete = async (preGrId) => {
        try {
            const { error } = await supabase
                .from('pre_gr_entry')
                .delete()
                .eq('id', preGrId);

            if (error) {
                throw new Error(error.message);
            }

            toast.success('Pre-GR entry deleted successfully');
            router.push('/pre-gr-list');
        } catch (error) {
            console.error('Delete error:', error);
            throw error;
        }
    };
    
    // Convert kgs to tons for print layout
    const ladenWtTons = ladenWtKgs ? Math.floor(parseFloat(ladenWtKgs) / 1000).toString() : '';
    const ladenWtKgsRemainder = ladenWtKgs ? (parseFloat(ladenWtKgs) % 1000).toString() : '';
    const emptyWtTons = emptyWtKgs ? Math.floor(parseFloat(emptyWtKgs) / 1000).toString() : '';
    const emptyWtKgsRemainder = emptyWtKgs ? (parseFloat(emptyWtKgs) % 1000).toString() : '';
    const goodsWtTons = goodsWtKgs ? Math.floor(parseFloat(goodsWtKgs) / 1000).toString() : '';
    const goodsWtKgsRemainder = goodsWtKgs ? (parseFloat(goodsWtKgs) % 1000).toString() : '';

    const printData = {
        grNo, grDate, poVoucherNumber, selectedPo, supplierName, itemQuality, loadedFrom, vehicleNo, weightBridgeName, bags,
        poDamageAllowed, poCargo, 
        ladenWtTons, ladenWtKgs: ladenWtKgsRemainder, 
        emptyWtTons, emptyWtKgs: emptyWtKgsRemainder, 
        goodsWtTons, goodsWtKgs: goodsWtKgsRemainder, 
        podiBags,
        gapItem1Id, gapItem1Bags, gapItem2Id, gapItem2Bags, gapItems, isAdminApproved, advanceAmount, adminRemark, preparedBy,
        weightShortage, remarks
    };

    if (loading) return <div className="text-center p-4">Loading...</div>;

    return (
        <>
            {/* Print styles */}
            <style>{`
                @media print {
                    .print-hide {
                        display: none !important;
                    }
                    #pre-gr-print-container {
                        display: block !important;
                        visibility: visible !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                }
            `}</style>
            <div className="container mx-auto p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg mt-20" style={{ position: 'relative' }}>
            <div className="print-hide print:hidden" style={{ display: 'block' }}>
                <h2 className="text-3xl font-semibold text-green-800 dark:text-green-200 mb-2 text-center">
                    Pre-GR Entry {preGREntryId ? 'Alteration' : 'Creation'}
                </h2>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
                    {/* PO Selection and Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label htmlFor="poSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Purchase Order</label>
                            <select id="poSelect" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-gray-200" value={selectedPoId || ''} onChange={(e) => setSelectedPoId(parseInt(e.target.value))} disabled={!!preGREntryId}>
                                <option value="">-- Select PO --</option>
                                {purchaseOrders.map((po) => {
                                    const supplier = suppliers.find(s => s.id === po.supplier_id);
                                    return (
                                        <option key={po.id} value={po.id}>
                                            {po.vouchernumber} - {formatDateDDMMYYYY(po.date)} - {supplier?.name || 'Unknown Supplier'}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="poVoucherNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PO Voucher Number</label>
                            <input type="text" id="poVoucherNumber" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed" value={poVoucherNumber} readOnly/>
                        </div>
                        <div>
                            <label htmlFor="grDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">GR Date</label>
                            <input type="text" id="grDate" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 px-2" value={grDate} disabled={isApprovalSectionDisabledForNonAdmin} onChange={e => setGrDate(e.target.value)} placeholder="DD/MM/YYYY"/>
                        </div>
                        <div>
                            <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier Name</label>
                            <input type="text" id="supplierName" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed" value={supplierName} readOnly/>
                        </div>
                        <div>
                            <label htmlFor="supplierAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier Address</label>
                            <input type="text" id="supplierAddress" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed" value={supplierAddress} readOnly/>
                        </div>
                        <div>
                            <label htmlFor="itemQuality" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item / Quality</label>
                            <input type="text" id="itemQuality" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed" value={itemQuality} readOnly/>
                        </div>
                    </div>

                    {/* Third Row - All Input Fields with Top Border */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 pt-4 border-t border-gray-300 dark:border-gray-600">
                        <div>
                            <label htmlFor="loadedFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loaded From</label>
                            <input type="text" id="loadedFrom" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700" value={loadedFrom} onChange={(e) => setLoadedFrom(e.target.value)} disabled={isApprovalSectionDisabledForNonAdmin}/>
                        </div>
                        <div>
                            <label htmlFor="vehicleNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle No.</label>
                            <input type="text" id="vehicleNo" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} disabled={isApprovalSectionDisabledForNonAdmin}/>
                        </div>
                        <div>
                            <label htmlFor="bags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bags</label>
                            <input type="number" id="bags" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-right pr-2" value={bags} onChange={(e) => setBags(e.target.value)} disabled={isApprovalSectionDisabledForNonAdmin}/>
                        </div>
                    </div>

                    {/* PO Details Readonly Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border border-blue-200 dark:border-blue-700 rounded-md bg-blue-50 dark:bg-gray-900">
                        <h3 className="col-span-full text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Purchase Order Details</h3>
                        <div>
                            <label htmlFor="poQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PO Quantity</label>
                            <input type="text" id="poQuantity" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-right pr-2" value={poQuantity} readOnly/>
                        </div>
                        <div>
                            <label htmlFor="poRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PO Rate</label>
                            <input type="text" id="poRate" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-right pr-2" value={poRate} readOnly/>
                        </div>
                        <div>
                            <label htmlFor="poDamageAllowed" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Damage per ton kg</label>
                            <input type="text" id="poDamageAllowed" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-right pr-2" value={poDamageAllowed} readOnly/>
                        </div>
                        <div>
                            <label htmlFor="poCargo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cargo</label>
                            <input type="text" id="poCargo" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-right pr-2" value={poCargo} readOnly/>
                        </div>
                    </div>

                    {/* Weight Details */}
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                         <div>
                            <label htmlFor="weightBridgeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight Bridge Name</label>
                            <input type="text" id="weightBridgeName" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 px-2" value={weightBridgeName} onChange={(e) => setWeightBridgeName(e.target.value)} disabled={isApprovalSectionDisabledForNonAdmin}/>
                        </div>
                        <div>
                            <label htmlFor="grNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">GR No.</label>
                            <input type="text" id="grNo" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 px-2" value={grNo} onChange={(e) => setGrNo(e.target.value)}/>
                        </div>
                        <div>
                            <label htmlFor="grDt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">GR Dt.</label>
                            <input type="text" id="grDt" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 px-2" value={grDt} onChange={e => setGrDt(e.target.value)} placeholder="DD/MM/YYYY"/>
                        </div>
                    </div>
                    
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Weight Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="ladenWtKgs" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Laden Wt. (Kgs)</label>
                                <input type="number" id="ladenWtKgs" placeholder="Kgs" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-right pr-2" value={ladenWtKgs} onChange={(e) => setLadenWtKgs(e.target.value)} disabled={isApprovalSectionDisabledForNonAdmin}/>
                            </div>
                            <div>
                                <label htmlFor="emptyWtKgs" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empty Wt. (Kgs)</label>
                                <input type="number" id="emptyWtKgs" placeholder="Kgs" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-right pr-2" value={emptyWtKgs} onChange={(e) => setEmptyWtKgs(e.target.value)} disabled={isApprovalSectionDisabledForNonAdmin}/>
                            </div>
                            <div>
                                <label htmlFor="goodsWtKgs" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Goods Wt. (Kgs)</label>
                                <input type="text" id="goodsWtKgs" placeholder="Kgs" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-right pr-2" value={goodsWtKgs} readOnly/>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                        <div className="col-span-full text-lg font-semibold text-gray-800 dark:text-gray-200">Additional Details</div>
                        <div className="flex items-center space-x-2">
                            <label htmlFor="podiBags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Podi (Bags)</label>
                            <input type="number" id="podiBags" placeholder="Bags" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-right pr-2" value={podiBags} onChange={(e) => setPodiBags(e.target.value)} disabled={isApprovalSectionDisabledForNonAdmin}/>
                        </div>
                        <div>
                            <label htmlFor="gapItem1Id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gap Item 1</label>
                            <select id="gapItem1Id" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-gray-200" value={gapItem1Id || ''} onChange={(e) => setGapItem1Id(e.target.value || null)} disabled={isApprovalSectionDisabledForNonAdmin}>
                                <option value="">-- Select Item --</option>
                                {gapItems.map((item) => (<option key={item.id} value={item.id}>{item.name}</option>))}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <label htmlFor="gapItem1Bags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Qty (Gap 1) Bags</label>
                            <input type="number" id="gapItem1Bags" placeholder="Bags" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-right pr-2" value={gapItem1Bags} onChange={(e) => setGapItem1Bags(e.target.value)} disabled={isApprovalSectionDisabledForNonAdmin}/>
                        </div>
                        <div>
                            <label htmlFor="gapItem2Id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gap Item 2</label>
                            <select id="gapItem2Id" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-gray-200" value={gapItem2Id || ''} onChange={(e) => setGapItem2Id(e.target.value || null)} disabled={isApprovalSectionDisabledForNonAdmin}>
                                <option value="">-- Select Item --</option>
                                {gapItems.map((item) => (<option key={item.id} value={item.id}>{item.name}</option>))}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <label htmlFor="gapItem2Bags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Qty (Gap 2) Bags</label>
                            <input type="number" id="gapItem2Bags" placeholder="Bags" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-right pr-2" value={gapItem2Bags} onChange={(e) => setGapItem2Bags(e.target.value)} disabled={isApprovalSectionDisabledForNonAdmin}/>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="sieveNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sieve No.</label>
                            <input type="text" id="sieveNo" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700" value={sieveNo} onChange={(e) => setSieveNo(e.target.value)} disabled={isApprovalSectionDisabledForNonAdmin}/>
                        </div>
                        <div>
                            <label htmlFor="preparedBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prepared By</label>
                            <input type="text" id="preparedBy" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} disabled={isApprovalSectionDisabledForNonAdmin}/>
                        </div>
                    </div>

                    {/* Weight Shortage and Remarks Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="weightShortage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight Shortage (Kgs)</label>
                            <input type="number" id="weightShortage" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-right pr-2" value={weightShortage} onChange={(e) => setWeightShortage(e.target.value)} disabled={!isAdmin} placeholder="Admin only"/>
                        </div>
                        <div>
                            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Remarks</label>
                            <textarea id="remarks" rows="3" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700" value={remarks} onChange={(e) => setRemarks(e.target.value)} disabled={isApprovalSectionDisabledForNonAdmin} placeholder="Enter any remarks or notes"/>
                        </div>
                    </div>

                    {(isAdmin && preGREntryId) || (isAdmin && parseFloat(podiBags) > 0) ? (
                        <div className="border border-green-200 dark:border-green-700 rounded-md p-6 mb-6 bg-green-50 dark:bg-gray-900">
                            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
                                {preGREntryId ? 'Admin Approval' : 'Admin Approval Required'}
                            </h3>
                            {!preGREntryId && parseFloat(podiBags) > 0 && (
                                <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-md">
                                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                                        <strong>Note:</strong> Admin approval is required because PODI bags &gt; 0.
                                    </p>
                                </div>
                            )}
                            <div className="flex items-center mb-6">
                                <input type="checkbox" id="adminApproval" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" checked={isAdminApproved} onChange={(e) => setIsAdminApproved(e.target.checked)} />
                                <label htmlFor="adminApproval" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Approved</label>
                            </div>
                            {isAdminApproved && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="advanceAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Advance to be paid</label>
                                        <input type="number" id="advanceAmount" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 px-3 py-2" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="Enter amount" />
                                        {advanceAmount && parseFloat(advanceAmount) > 0 && (
                                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                                {numberToWords(parseFloat(advanceAmount))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="adminRemark" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Admin Remark</label>
                                        <textarea id="adminRemark" rows="3" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 px-3 py-2" value={adminRemark} onChange={(e) => setAdminRemark(e.target.value)} placeholder="Enter admin remarks"></textarea>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                    
                    <div className="flex justify-between items-center">
                        <div>
                            {preGREntryId && (
                                <DeleteButton
                                    itemId={preGREntryId}
                                    itemName={`Pre-GR Entry ${preGREntryId}`}
                                    onDelete={handleDelete}
                                    isAdmin={isAdmin}
                                    variant="destructive"
                                    size="sm"
                                />
                            )}
                        </div>
                        <div className="flex space-x-4">
                            {isAdminApproved && <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center py-2 px-4 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 dark:bg-blue-800 dark:text-blue-200"><Printer className="w-4 h-4 mr-2" />Print</button>}
                            <button type="button" onClick={handleCancel} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200" disabled={loading}>Cancel</button>
                            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50" disabled={loading || isApprovalSectionDisabledForNonAdmin}>{loading ? 'Saving...' : 'Save Pre-GR Entry'}</button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Render the separate print layout component, which is only visible on print */}
            <div id="pre-gr-print-container" className="hidden print:block print:visible">
                <PreGrPrintLayout data={printData} />
            </div>
        </div>
        </>
    );
}