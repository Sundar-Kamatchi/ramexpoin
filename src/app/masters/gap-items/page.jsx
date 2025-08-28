// src/app/masters/gap-items/page.jsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { PlusCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import MasterDataModal from '@/components/masters/MasterDataModal';
import ConfirmationDialog from '@/components/masters/ConfirmationDialog';

const gapItemFields = [
    { name: 'name', label: 'Name', placeholder: 'Enter gap item name' },
    { name: 'description', label: 'Description', placeholder: 'Enter description' },
];

export default function GapItemsPage() {
  const [gapItems, setGapItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGapItem, setSelectedGapItem] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [gapItemToDelete, setGapItemToDelete] = useState(null);

  useEffect(() => {
    fetchGapItems();
  }, []);

  const fetchGapItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gap_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setError(error.message);
      toast.error('Failed to fetch gap items.');
    } else {
      setGapItems(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (item = null) => {
    setSelectedGapItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedGapItem(null);
    setIsModalOpen(false);
  };

  const handleSaveGapItem = async (formData) => {
    let result;
    if (selectedGapItem) {
      // Update existing gap item
      result = await supabase
        .from('gap_items')
        .update(formData)
        .eq('id', selectedGapItem.id);
    } else {
      // Create new gap item
      result = await supabase
        .from('gap_items')
        .insert([formData]);
    }

    if (result.error) {
      toast.error(`Failed to save gap item: ${result.error.message}`);
    } else {
      toast.success(`Gap item successfully ${selectedGapItem ? 'updated' : 'added'}!`);
      fetchGapItems(); // Re-fetch data to update the table
    }
    handleCloseModal();
  };

  const openConfirmDialog = (itemId) => {
    setGapItemToDelete(itemId);
    setIsConfirmOpen(true);
  };

  const closeConfirmDialog = () => {
    setGapItemToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleDeleteGapItem = async () => {
    if (gapItemToDelete) {
      const { error } = await supabase
        .from('gap_items')
        .delete()
        .eq('id', gapItemToDelete);

      if (error) {
        toast.error(`Failed to delete gap item: ${error.message}`);
      } else {
        toast.success('Gap item deleted successfully!');
        fetchGapItems(); // Re-fetch data
      }
      closeConfirmDialog();
    }
  };

  if (loading) return <div className="p-8 text-center">Loading gap items...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 mt-10">
        <div className="flex justify-between items-center mb-2">
          <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Manage Gap Items</h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                  Add, edit, or remove gap item records.
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
                  Add Gap Item
              </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                   <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {gapItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => openConfirmDialog(item.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
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
        onSave={handleSaveGapItem}
        data={selectedGapItem}
        fields={gapItemFields}
        title={selectedGapItem ? 'Edit Gap Item' : 'Add New Gap Item'}
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleDeleteGapItem}
        title="Delete Gap Item"
        description="Are you sure you want to delete this gap item? This action cannot be undone."
      />
    </>
  );
}

