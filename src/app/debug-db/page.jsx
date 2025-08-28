'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DebugDBPage() {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Try to fetch all columns from purchase_orders
                const { data, error } = await supabase
                    .from('purchase_orders')
                    .select('*')
                    .limit(5);

                if (error) {
                    setError(error.message);
                    return;
                }

                setPurchaseOrders(data || []);
                
                if (data && data.length > 0) {
                    console.log('Purchase Orders structure:', data[0]);
                    console.log('Available columns:', Object.keys(data[0]));
                }
                
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Database Debug</h1>
            
            <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Purchase Orders Structure</h2>
                {purchaseOrders.length > 0 ? (
                    <div>
                        <p className="mb-2">Available columns: {Object.keys(purchaseOrders[0]).join(', ')}</p>
                        <pre className="bg-gray-100 p-4 rounded overflow-auto">
                            {JSON.stringify(purchaseOrders[0], null, 2)}
                        </pre>
                    </div>
                ) : (
                    <p>No purchase orders found</p>
                )}
            </div>
        </div>
    );
} 