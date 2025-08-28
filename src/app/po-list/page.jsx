'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Use the shared client
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDateDDMMYYYY } from '@/utils/dateUtils';
import { toast } from 'sonner'; // Use the global toaster

// Main PO List Page Component
export default function POListPage() {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPurchaseOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('purchase_orders')
                .select(`
                    id,
                    vouchernumber,
                    date,
                    quantity,
                    rate,
                    cargo,
                    suppliers ( name ),
                    item_master ( item_name, item_unit )
                `)
                .order('date', { ascending: false });

            if (fetchError) throw fetchError;
            setPurchaseOrders(data || []);
        } catch (err) {
            console.error('Error fetching purchase orders:', err.message);
            setError('Failed to load purchase orders: ' + err.message);
            toast.error('Failed to load purchase orders.'); // Use global toast
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPurchaseOrders();
    }, [fetchPurchaseOrders]);

    if (loading) return <div className="text-center p-8">Loading Purchase Orders...</div>;
    if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>;

    return (
        // REMOVED the conflicting wrapper div. This is the main fix.
        <div className="container mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg mt-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Purchase Order - Register</h2>
                <div className="flex space-x-4">
                    {/* Corrected Link to the dynamic create page */}
                    <Link href="/po" passHref>
                        <Button variant="primary">+ Create New PO</Button>
                    </Link> 
                    <Link href="/" passHref>
                        <Button variant="outline">Home</Button>
                    </Link>
                </div>
            </div>

            {purchaseOrders.length === 0 ? (
                <p className="text-center text-gray-600 text-lg py-8">No Purchase Orders found.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Voucher No.</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Supplier</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Item</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase">Qty</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase">Rate</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {purchaseOrders.map((po) => (
                                <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">{po.vouchernumber}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">{formatDateDDMMYYYY(po.date)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">{po.suppliers?.name || 'N/A'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">{po.item_master?.item_name || 'N/A'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">{po.quantity} {po.item_master?.item_unit}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">{po.rate}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        <Link href={`/po/${po.id}`}>
                                            <Button variant="outline" size="sm">Edit</Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
