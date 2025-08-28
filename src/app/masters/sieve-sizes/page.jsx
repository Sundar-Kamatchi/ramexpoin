// src/app/masters/sieve-sizes/page.jsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { PlusCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import MasterDataModal from '@/components/masters/MasterDataModal';
import ConfirmationDialog from '@/components/masters/ConfirmationDialog';

const sieveSizeFields = [
    { name: 'size', label: 'Size', placeholder: 'Enter sieve size' },
    { name: 'description', label: 'Description', placeholder: 'Enter description' },
];

export default function SieveSizesPage() {
  const [sieveSizes, setSieveSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSieveSize, setSelectedSieveSize] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [sieveSizeToDelete, setSieveSizeToDelete] = useState(null);

  useEffect(() => {
    fetchSieveSizes();
  }, []);

  const fetchSieveSizes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sieve_sizes')
      .select('*')
      .order('size', { ascending: true });

    if (error) {
      setError(error.message);
      toast.error('Failed to fetch sieve sizes.');
    } else {
      setSieveSizes(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (sieve = null) => {
    setSelectedSieveSize(sieve);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedSieveSize(null);
    setIsModalOpen(false);
  };

  const handleSaveSieveSize = async (formData) => {
    let result;
    if (selectedSieveSize) {
      // Update existing sieve size
      result = await supabase
        .from('sieve_sizes')
        .update(formData)
        .eq('id', selectedSieveSize.id);
    } else {
      // Create new sieve size
      result = await supabase
        .from('sieve_sizes')
        .insert([formData]);
    }

    if (result.error) {
      toast.error(`Failed to save sieve size: ${result.error.message}`);
    } else {
      toast.success(`Sieve size successfully ${selectedSieveSize ? 'updated' : 'added'}!`);
      fetchSieveSizes(); // Re-fetch data to update the table
    }
    handleCloseModal();
  };

  const openConfirmDialog = (sieveId) => {
    setSieveSizeToDelete(sieveId);
    setIsConfirmOpen(true);
  };

  const closeConfirmDialog = () => {
    setSieveSizeToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleDeleteSieveSize = async () => {
    if (sieveSizeToDelete) {
      const { error } = await supabase
        .from('sieve_sizes')
        .delete()
        .eq('id', sieveSizeToDelete);

      if (error) {
        toast.error(`Failed to delete sieve size: ${error.message}`);
      } else {
        toast.success('Sieve size deleted successfully!');
        fetchSieveSizes(); // Re-fetch data
      }
      closeConfirmDialog();
    }
  };

  if (loading) return <div className="p-8 text-center">Loading sieve sizes...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 mt-10">
        <div className="flex justify-between items-center mb-8">
          <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Manage Sieve Sizes</h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                  Add, edit, or remove sieve size records.
              </p>
          </div>
          <div className="flex items-center space-x-4">
              <Link href="/masters" passHref>
                  <Button variant="outline">
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back
                  </Button>
              </Link>
              <Button variant="primary" onClick={() => handleOpenModal()}>
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Add Sieve Size
              </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Size</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                   <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sieveSizes.map((sieve) => (
                  <tr key={sieve.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{sieve.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{sieve.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(sieve)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => openConfirmDialog(sieve.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <MasterDataModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSieveSize}
        data={selectedSieveSize}
        fields={sieveSizeFields}
        title={selectedSieveSize ? 'Edit Sieve Size' : 'Add New Sieve Size'}
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleDeleteSieveSize}
        title="Delete Sieve Size"
        description="Are you sure you want to delete this sieve size? This action cannot be undone."
      />
    </>
  );
}

