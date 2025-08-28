'use client';

import React, { useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  const router = useRouter();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_vendor_performance_report');
      if (error) {
        setError('Failed to fetch report data: ' + error.message);
      } else {
        setReportData(data || []);
      }
      setLoading(false);
    };
    fetchReportData();
  }, []);

  const VarianceCell = ({ value }) => {
    const isNegative = value < 0;
    const isPositive = value > 0;
    const colorClass = isNegative ? 'text-red-500' : isPositive ? 'text-green-500' : 'text-gray-500';
    return (
      <td className={`px-6 py-4 font-semibold ${colorClass}`}>
        {value?.toFixed(2)}%
      </td>
    );
  };

  if (loading) return <div className="text-center p-8">Loading report...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      <div className='flex justify-between items-center'>
        <h1 className="text-3xl font-bold">Vendor Performance Report</h1>
        <Button variant="primary" onClick={() => router.push('/')}>
          Home
        </Button>
      </div>

      {/* 1. Graphical Output Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Assured Cargo vs. Actual Yield</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="pre_gr_vouchernumber" />
            <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="assured_cargo_percentage" fill="#8884d8" name="Assured Cargo %" />
            <Bar dataKey="actual_yield_percentage" fill="#82ca9d" name="Actual Yield %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Detailed Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-xl font-semibold p-6">Consignment Details</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Pre-GR No.</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Assured Yield %</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actual Yield %</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Yield Variance</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Wastage Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reportData.map((row) => (
              <tr key={row.gqr_id}>
                <td className="px-6 py-4">{row.supplier_name}</td>
                <td className="px-6 py-4">{row.pre_gr_vouchernumber}</td>
                <td className="px-6 py-4 text-right">{row.assured_cargo_percentage?.toFixed(2)}%</td>
                <td className="px-6 py-4 text-right font-bold">{row.actual_yield_percentage?.toFixed(2)}%</td>
                <VarianceCell value={row.yield_variance} />
                <VarianceCell value={row.wastage_variance} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}