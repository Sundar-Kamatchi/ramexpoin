// src/app/masters/customers/page.jsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { PlusCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import MasterDataModal from '@/components/masters/MasterDataModal';
import ConfirmationDialog from '@/components/masters/ConfirmationDialog';

const customerFields = [
    { name: 'name', label: 'Name', placeholder: 'Enter customer name' },
    { name: 'contact', label: 'Contact Person', placeholder: 'Enter contact person' },
    { name: 'mobile', label: 'Mobile', placeholder: 'Enter mobile number' },
    { name: 'email', label: 'Email', placeholder: 'Enter email address' },
    { name: 'address', label: 'Address', placeholder: 'Enter address' },
    { name: 'country', label: 'Country', placeholder: 'Enter country' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setError(error.message);
      toast.error('Failed to fetch customers.');
    } else {
      setCustomers(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (customer = null) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedCustomer(null);
    setIsModalOpen(false);
  };

  const handleSaveCustomer = async (formData) => {
    // Only send valid DB columns
    const allowedKeys = ['name', 'contact', 'mobile', 'email', 'address', 'country'];
    const payload = allowedKeys.reduce((acc, key) => {
      if (formData[key] !== undefined) acc[key] = formData[key];
      return acc;
    }, {});
    let result;
    if (selectedCustomer) {
      // Update existing customer
      result = await supabase
        .from('customers')
        .update(payload)
        .eq('id', selectedCustomer.id);
    } else {
      // Create new customer
      result = await supabase
        .from('customers')
        .insert([payload]);
    }

    if (result.error) {
      const msg = result.error.message || 'Unknown error';
      toast.error(`Failed to save customer: ${msg}`);
    } else {
      toast.success(`Customer successfully ${selectedCustomer ? 'updated' : 'added'}!`);
      fetchCustomers(); // Re-fetch data to update the table
    }
    handleCloseModal();
  };

  const openConfirmDialog = (customerId) => {
    setCustomerToDelete(customerId);
    setIsConfirmOpen(true);
  };

  const closeConfirmDialog = () => {
    setCustomerToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleDeleteCustomer = async () => {
    if (customerToDelete) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete);

      if (error) {
        toast.error(`Failed to delete customer: ${error.message}`);
      } else {
        toast.success('Customer deleted successfully!');
        fetchCustomers(); // Re-fetch data
      }
      closeConfirmDialog();
    }
  };

  if (loading) return <div className="p-8 text-center">Loading customers...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 mt-10">
        <div className="flex justify-between items-center mb-8">
          <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Manage Customers</h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                  Add, edit, or remove customer records.
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
                  Add Customer
              </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mobile</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Country</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.contact}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.mobile}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.country}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(customer)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => openConfirmDialog(customer.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
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
        onSave={handleSaveCustomer}
        data={selectedCustomer}
        fields={customerFields}
        title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
      />
    </>
  );
}

