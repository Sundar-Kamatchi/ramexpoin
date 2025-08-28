'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestDBPage() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const testDatabase = async () => {
            try {
                setLoading(true);
                
                // Test 1: Try to fetch all columns
                console.log('Testing database structure...');
                const { data: allData, error: allError } = await supabase
                    .from('purchase_orders')
                    .select('*')
                    .limit(1);

                if (allError) {
                    console.error('Error fetching all columns:', allError);
                    setError(allError.message);
                    return;
                }

                console.log('All columns data:', allData);
                
                // Test 2: Try to fetch specific columns including damage_allowed_kgs_ton
                const { data: specificData, error: specificError } = await supabase
                    .from('purchase_orders')
                    .select('id, vouchernumber, damage_allowed_kgs_ton')
                    .limit(1);

                if (specificError) {
                    console.error('Error fetching specific columns:', specificError);
                    setError(specificError.message);
                    return;
                }

                console.log('Specific columns data:', specificData);
                
                // Test 3: Check if the column exists by trying to query it
                const { data: testData, error: testError } = await supabase
                    .from('purchase_orders')
                    .select('damage_allowed_kgs_ton')
                    .limit(1);

                if (testError) {
                    console.error('Error testing damage_allowed_kgs_ton column:', testError);
                    setError(testError.message);
                    return;
                }

                console.log('damage_allowed_kgs_ton test data:', testData);
                
                setResult({
                    allColumns: allData,
                    specificColumns: specificData,
                    damageTest: testData
                });
                
            } catch (err) {
                console.error('Test failed:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        testDatabase();
    }, []);

    if (loading) return <div className="p-4">Testing database...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Database Test Results</h1>
            
            <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">All Columns Test</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(result?.allColumns, null, 2)}
                </pre>
            </div>
            
            <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Specific Columns Test</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(result?.specificColumns, null, 2)}
                </pre>
            </div>
            
            <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Damage Allowed Kgs Ton Test</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(result?.damageTest, null, 2)}
                </pre>
            </div>
        </div>
    );
} 