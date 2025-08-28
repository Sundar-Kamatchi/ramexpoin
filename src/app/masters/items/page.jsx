// src/app/masters/items/page.jsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { PlusCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import MasterDataModal from '@/components/masters/MasterDataModal';
import ConfirmationDialog from '@/components/masters/ConfirmationDialog';

const itemFields = [
    { name: 'item_name', label: 'Item Name', placeholder: 'Enter item name' },
    { name: 'item_unit', label: 'Item Unit', placeholder: 'Select unit', type: 'select', options: [] },
    { name: 'hsn_code', label: 'HSN Code', placeholder: 'Enter HSN code' },
];

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [unitOptions, setUnitOptions] = useState([]);

  useEffect(() => {
    fetchItems();
    fetchUnits();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('item_master')
      .select('*')
      .order('item_name', { ascending: true });

    if (error) {
      setError(error.message);
      toast.error('Failed to fetch items.');
    } else {
      setItems(data);
    }
    setLoading(false);
  };

  const fetchUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('uqc_code, quantity')
      .order('quantity', { ascending: true });
    if (!error && data) {
      setUnitOptions(
        data.map(u => ({ value: u.uqc_code, label: `${u.quantity} (${u.uqc_code})` }))
      );
    }
  };

  const handleOpenModal = (item = null) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  const handleSaveItem = async (formData) => {
    // Only send valid DB columns
    const allowedKeys = ['item_name', 'item_unit', 'hsn_code'];
    const payload = allowedKeys.reduce((acc, key) => {
      if (formData[key] !== undefined) acc[key] = formData[key];
      return acc;
    }, {});
    let result;
    if (selectedItem) {
      // Update existing item
      result = await supabase
        .from('item_master')
        .update(payload)
        .eq('id', selectedItem.id);
    } else {
      // Create new item
      result = await supabase
        .from('item_master')
        .insert([payload]);
    }

    if (result.error) {
      const msg = result.error.message || 'Unknown error';
      if (/unique/i.test(msg) && /item_name/i.test(msg)) {
        toast.error('Item name must be unique. This item already exists.');
      } else if (/null value in column "item_unit" violates not-null constraint/i.test(msg)) {
        toast.error('Item Unit is required.');
      } else {
        toast.error(`Failed to save item: ${msg}`);
      }
    } else {
      toast.success(`Item successfully ${selectedItem ? 'updated' : 'added'}!`);
      fetchItems(); // Re-fetch data to update the table
    }
    handleCloseModal();
  };

  const openConfirmDialog = (itemId) => {
    setItemToDelete(itemId);
    setIsConfirmOpen(true);
  };

  const closeConfirmDialog = () => {
    setItemToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleDeleteItem = async () => {
    if (itemToDelete) {
      const { error } = await supabase
        .from('item_master')
        .delete()
        .eq('id', itemToDelete);

      if (error) {
        toast.error(`Failed to delete item: ${error.message}`);
      } else {
        toast.success('Item deleted successfully!');
        fetchItems(); // Re-fetch data
      }
      closeConfirmDialog();
    }
  };

  if (loading) return <div className="p-8 text-center">Loading items...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 mt-10">
        <div className="flex justify-between items-center mb-8">
          <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Manage Items</h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                  Add, edit, or remove item records.
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
                  Add Item
              </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">HSN Code</th>
                   <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.item_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.item_unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.hsn_code}</td>
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
        onSave={handleSaveItem}
        data={selectedItem}
        fields={itemFields.map(f =>
          f.name === 'item_unit' ? { ...f, options: unitOptions } : f
        )}
        title={selectedItem ? 'Edit Item' : 'Add New Item'}
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleDeleteItem}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
      />
    </>
  );
}

