// src/app/masters/suppliers/page.jsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { PlusCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import MasterDataModal from '@/components/masters/MasterDataModal';
import ConfirmationDialog from '@/components/masters/ConfirmationDialog';

const supplierFields = [
    { name: 'name', label: 'Name', placeholder: 'Enter supplier name' },
    { name: 'contact_person', label: 'Contact Person', placeholder: 'Enter contact person' },
    { name: 'phone', label: 'Phone', placeholder: 'Enter phone number' },
    { name: 'address', label: 'Address', placeholder: 'Enter address' },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setError(error.message);
      toast.error('Failed to fetch suppliers.');
    } else {
      setSuppliers(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (supplier = null) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedSupplier(null);
    setIsModalOpen(false);
  };

  const handleSaveSupplier = async (formData) => {
    // Only send fields that exist in DB to avoid 400s from unknown columns
    const allowedKeys = ['name', 'contact_person', 'phone', 'address'];
    const payload = allowedKeys.reduce((acc, key) => {
      if (formData[key] !== undefined) acc[key] = formData[key];
      return acc;
    }, {});
    let result;
    if (selectedSupplier) {
      // Update existing supplier
      result = await supabase
        .from('suppliers')
        .update(payload)
        .eq('id', selectedSupplier.id);
    } else {
      // Create new supplier
      result = await supabase
        .from('suppliers')
        .insert([payload]);
    }

    if (result.error) {
      // Show clearer message for common errors
      const msg = result.error.message || 'Unknown error';
      if (/duplicate key value violates unique constraint/i.test(msg) || /unique violation/i.test(msg)) {
        toast.error('Supplier name must be unique. A supplier with this name already exists.');
      } else {
        toast.error(`Failed to save supplier: ${msg}`);
      }
    } else {
      toast.success(`Supplier successfully ${selectedSupplier ? 'updated' : 'added'}!`);
      fetchSuppliers(); // Re-fetch data to update the table
    }
    handleCloseModal();
  };

  const openConfirmDialog = (supplierId) => {
    setSupplierToDelete(supplierId);
    setIsConfirmOpen(true);
  };

  const closeConfirmDialog = () => {
    setSupplierToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleDeleteSupplier = async () => {
    if (supplierToDelete) {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierToDelete);

      if (error) {
        toast.error(`Failed to delete supplier: ${error.message}`);
      } else {
        toast.success('Supplier deleted successfully!');
        fetchSuppliers(); // Re-fetch data
      }
      closeConfirmDialog();
    }
  };

  if (loading) return <div className="p-8 text-center">Loading suppliers...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 mt-10">
        <div className="flex justify-between items-center mb-8">
          <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Manage Suppliers</h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                  Add, edit, or remove supplier records.
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
                  Add Supplier
              </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact Person</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Address</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{supplier.contact_person}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{supplier.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{supplier.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(supplier)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => openConfirmDialog(supplier.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
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
        onSave={handleSaveSupplier}
        data={selectedSupplier}
        fields={supplierFields}
        title={selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleDeleteSupplier}
        title="Delete Supplier"
        description="Are you sure you want to delete this supplier? This action cannot be undone."
      />
    </>
  );
}

