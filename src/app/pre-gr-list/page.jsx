//app/pre-gr-list/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import {supabase} from '@/lib/supabaseClient';
import Link from 'next/link';
import { formatDateDDMMYYYY } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';


export default function PreGRListPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [preGREntries, setPreGREntries] = useState([]);

    useEffect(() => {
        const fetchPreGREntries = async () => {
            setLoading(true);
            setError(null);

            if (!supabase) {
                setError('Supabase client not initialized.');
                setLoading(false);
                return;
            }

            try {
                console.log('Pre-GR List: Starting to fetch entries...');
                
                // First, fetch the pre_gr_entry records with purchase order data
                const { data: preGRData, error: preGRError } = await supabase
                    .from('pre_gr_entry')
                    .select(`
                        id,
                        vouchernumber,
                        date,
                        supplier_id,
                        item_id,
                        net_wt,
                        vehicle_no,
                        bags,
                        is_admin_approved,
                        gr_no,
                        gr_dt,
                        admin_approved_advance,
                        po_id,
                        purchase_orders!inner(
                            rate
                        )
                    `)
                    .order('created_at', { ascending: false });

                if (preGRError) {
                    console.error('Error fetching Pre-GR entries:', preGRError);
                    throw preGRError;
                }

                console.log('Pre-GR List: Fetched', preGRData?.length || 0, 'entries');

                if (!preGRData || preGRData.length === 0) {
                    setPreGREntries([]);
                    setLoading(false);
                    return;
                }

                // Get unique supplier IDs and item IDs
                const supplierIds = [...new Set(preGRData.map(entry => entry.supplier_id))];
                const itemIds = [...new Set(preGRData.map(entry => entry.item_id))];

                console.log('Pre-GR List: Fetching suppliers and items...');

                // Fetch suppliers data
                const { data: suppliersData, error: suppliersError } = await supabase
                    .from('suppliers')
                    .select('id, name')
                    .in('id', supplierIds);

                if (suppliersError) {
                    console.warn('Error fetching suppliers:', suppliersError);
                }

                // Fetch items data
                const { data: itemsData, error: itemsError } = await supabase
                    .from('item_master')
                    .select('id, item_name')
                    .in('id', itemIds);

                if (itemsError) {
                    console.warn('Error fetching items:', itemsError);
                }

                // Create lookup maps
                const supplierMap = new Map(suppliersData?.map(s => [s.id, s.name]) || []);
                const itemMap = new Map(itemsData?.map(i => [i.id, i.item_name]) || []);

                // Combine data
                const formattedData = preGRData.map((entry) => {
                    return {
                        id: entry.id,
                        gr_no: entry.gr_no,
                        gr_dt: entry.gr_dt,
                        vouchernumber: entry.vouchernumber,
                        date: entry.date,
                        supplier_id: entry.supplier_id,
                        item_id: entry.item_id,
                        net_wt: entry.net_wt,
                        lorry_no: entry.vehicle_no, // Map vehicle_no from DB to lorry_no for display
                        bags: entry.bags,
                        supplier_name: supplierMap.get(entry.supplier_id) || 'Unknown Supplier',
                        item_name: itemMap.get(entry.item_id) || 'Unknown Item',
                        is_admin_approved: entry.is_admin_approved || false, // Include approval status
                        po_rate: entry.purchase_orders?.rate || 0, // Get PO rate from joined table
                        admin_approved_advance: entry.admin_approved_advance || 0, // Get admin approved advance
                    };
                });

                setPreGREntries(formattedData);
                console.log('Pre-GR List: Successfully formatted', formattedData.length, 'entries');

            } catch (err) {
                console.error('Pre-GR List: Fetch error:', err);
                setError(`Failed to fetch Pre-GR entries: ${err.message}`);
            } finally {
                console.log('Pre-GR List: Setting loading to false');
                setLoading(false);
            }
        };

        fetchPreGREntries();
    }, []);

    const formatWeight = (weight) => {
        if (weight === null || isNaN(weight)) return 'N/A';
        const tons = Math.floor(weight / 1000);
        const kgs = weight % 1000;
        return `${tons} T ${kgs} Kgs`;
    };

   return (
        <div className="container mx-auto p-4 flex-grow bg-gray-50 dark:bg-gray-900 min-h-screen mt-20 ">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-semibold text-whte dark:text-white-800 ml-5 ">Existing Pre Gr Entries</h2>
                <div className="flex justify-center items-center mb-2 gap-5 mr-10">
                    <Link href="/pre-gr/new" passHref>
                        <Button variant="primary" className="bg-green-600 hover:bg-green-700">
                            + Create New Pre-GR Entry
                        </Button>
                    </Link>
                    <Link href="/" passHref>
                        <Button variant="primary">
                            Home
                        </Button>
                    </Link>
                </div>
            </div>

            {loading && (
                <div className="text-center p-8">
                    <div className="text-gray-700 dark:text-gray-300 mb-4">Loading Pre-GR entries...</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        If this takes too long, you can still create a new entry:
                    </div>
                    <Link href="/pre-gr/new" passHref>
                        <Button variant="primary" className="mt-2 bg-green-600 hover:bg-green-700">
                            Create New Pre-GR Entry
                        </Button>
                    </Link>
                </div>
            )}
            {error && <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4">{error}</div>}
            {!loading && preGREntries.length === 0 && (
                <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-200 px-4 py-3 rounded relative text-center">
                    No Pre-GR entries found. Click "Create New Pre-GR Entry" to add one.
                </div>
            )}

            {!loading && preGREntries.length > 0 && (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">GR No.</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">GR Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Supplier</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lorry No.</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PO Rate</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Advance</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Net Wt.</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bags</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {preGREntries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{entry.gr_no}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDateDDMMYYYY(entry.gr_dt)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{entry.supplier_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{entry.item_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{entry.lorry_no}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">₹{entry.po_rate?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                                        {entry.is_admin_approved && entry.admin_approved_advance > 0 ? 
                                            `₹${entry.admin_approved_advance.toLocaleString('en-IN')}` : 
                                            'N/A'
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">{formatWeight(entry.net_wt)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">{entry.bags}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.is_admin_approved ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                            {entry.is_admin_approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/pre-gr/${entry.id}`} passHref>
                                            <span className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200 cursor-pointer">Edit</span>
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
