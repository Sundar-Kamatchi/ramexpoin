'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { fetchGQRListWithRelationships } from '@/lib/gqrDataFetcher';
import { Button } from '@/components/ui/button';
import { formatDateDDMMYYYY } from '@/utils/dateUtils';

export default function GQRListPage() {
  const [gqrEntries, setGqrEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGqrEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('GQR List: Using production-safe separate queries approach...');
      
      // Use production-safe separate queries approach directly
      const data = await fetchGQRListWithRelationships();
      setGqrEntries(data);
      console.log('GQR List: Separate queries successful with', data.length, 'entries');
      
    } catch (err) {
      console.error('GQR List: Separate queries failed, trying simple fallback:', err);
        
      // Final fallback: Simple query without relationships
      try {
        const { data: simpleData, error: simpleError } = await supabase
          .from('gqr_entry')
          .select('id, created_at, total_value_received')
          .order('created_at', { ascending: false });

        if (simpleError) {
          throw simpleError;
        }

        // Transform to expected structure
        const transformedData = simpleData.map(item => ({
          ...item,
          pre_gr_entry: {
            gr_no: 'N/A',
            gr_dt: null,
            purchase_orders: {
              vouchernumber: 'N/A',
              date: null,
              suppliers: { name: 'N/A' }
            }
          }
        }));

        setGqrEntries(transformedData);
        console.log('GQR List: Simple fallback successful with', transformedData.length, 'entries');
        
      } catch (fallbackError) {
        console.error('GQR List: All approaches failed:', fallbackError);
        setError('Failed to load GQR entries: ' + (fallbackError.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGqrEntries();
  }, [fetchGqrEntries]);

  if (loading) {
    return <div className="text-center p-8">Loading GQR entries...</div>;
  }
  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 mt-20 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Goods Quality Reports (GQR)</h1>
        <div className="flex space-x-4">
          <Link href="/gqr" passHref>
            <Button variant="primary">+ Create New GQR</Button>
          </Link>
          <Link href="/" passHref>
            <Button variant="primary">Home</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
                         <tr>
               <th className="px-6 py-3 text-left text-xs font-medium uppercase">GR NO</th>
               <th className="px-6 py-3 text-left text-xs font-medium uppercase">GR DT</th>
               <th className="px-6 py-3 text-left text-xs font-medium uppercase">PO NO</th>
               <th className="px-6 py-3 text-left text-xs font-medium uppercase">PO DATE</th>
               <th className="px-6 py-3 text-left text-xs font-medium uppercase">Supplier</th>
               <th className="px-6 py-3 text-right text-xs font-medium uppercase">Final Value</th>
               <th className="px-6 py-3 text-center text-xs font-medium uppercase">Status</th>
               <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actions</th>
             </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            {gqrEntries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                  No GQRs found.
                </td>
              </tr>
            ) : (
              gqrEntries.map((gqr) => (
                                 <tr key={gqr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                   <td className="px-6 py-4 font-medium">{gqr.pre_gr_entry?.gr_no || 'N/A'}</td>
                   <td className="px-6 py-4">{gqr.pre_gr_entry?.gr_dt ? formatDateDDMMYYYY(gqr.pre_gr_entry.gr_dt) : 'N/A'}</td>
                   <td className="px-6 py-4">{gqr.pre_gr_entry?.purchase_orders?.vouchernumber || 'N/A'}</td>
                   <td className="px-6 py-4">{gqr.pre_gr_entry?.purchase_orders?.date ? formatDateDDMMYYYY(gqr.pre_gr_entry.purchase_orders.date) : 'N/A'}</td>
                   <td className="px-6 py-4">{gqr.pre_gr_entry?.purchase_orders?.suppliers?.name || 'N/A'}</td>
                   <td className="px-6 py-4 text-right font-semibold">
                     ₹{gqr.total_value_received?.toLocaleString('en-IN') || '0.00'}
                   </td>
                   <td className="px-6 py-4 text-center">
                     <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                       gqr.gqr_status === 'Closed' || gqr.gqr_status === 'Finalized' 
                         ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                         : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                     }`}>
                       {gqr.gqr_status === 'Closed' || gqr.gqr_status === 'Finalized' ? 'Finalized' : 'Open'}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-right">
                     <Link href={`/gqr/${gqr.id}`} passHref>
                       <Button variant="primary" >View / Edit</Button>
                     </Link>
                   </td>
                 </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}