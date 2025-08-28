'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
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
      // Fetch data from gqr_entry and join with pre_gr_entry to get related details
      const { data, error: fetchError } = await supabase
        .from('gqr_entry')
        .select(`
          id,
          created_at,
          total_value_received,
          pre_gr_entry (
            vouchernumber,
            suppliers ( name )
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setGqrEntries(data || []);
    } catch (err) {
      setError('Failed to load GQR entries: ' + err.message);
      console.error(err);
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
            <Button variant="outline">Home</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">GQR ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Pre-GR No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Supplier</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Final Value</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            {gqrEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No GQRs found.
                </td>
              </tr>
            ) : (
              gqrEntries.map((gqr) => (
                <tr key={gqr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 font-medium">{gqr.id}</td>
                  <td className="px-6 py-4">{formatDateDDMMYYYY(gqr.created_at)}</td>
                  <td className="px-6 py-4">{gqr.pre_gr_entry?.vouchernumber || 'N/A'}</td>
                  <td className="px-6 py-4">{gqr.pre_gr_entry?.suppliers?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-right font-semibold">
                    ₹{gqr.total_value_received?.toLocaleString('en-IN') || '0.00'}
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