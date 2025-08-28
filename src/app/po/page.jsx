'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatDateDDMMYYYY, parseDDMMYYYY } from '@/utils/dateUtils'; // Assuming you have this util

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  
  const initialFormData = {
    vouchernumber: '',
    ref_no: '',
    date: formatDateDDMMYYYY(new Date()),
    supplierId: '',
    itemId: '',
    quantity: '',
    rate: '',
    cargo: '',
    podi_rate: '',
    damage_allowed_kgs_ton: ''
  };

  const [formData, setFormData] = useState({
    vouchernumber: '',
    ref_no: '',
    date: formatDateDDMMYYYY(new Date()),
    supplierId: '',
    itemId: '',
    quantity: '',
    rate: '',
    cargo: '',
    podi_rate: '',
    damage_allowed_kgs_ton: ''
  });
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [suppliersRes, itemsRes, voucherRes] = await Promise.all([
          supabase.from('suppliers').select('id, name'),
          supabase.from('item_master').select('id, item_name'),
          supabase.from('purchase_orders').select('vouchernumber').order('vouchernumber', { ascending: false }).limit(1)
        ]);

        if (suppliersRes.error) throw new Error(suppliersRes.error.message);
        setSuppliers(suppliersRes.data || []);

        if (itemsRes.error) throw new Error(itemsRes.error.message);
        setItems(itemsRes.data || []);

        // Auto-generate next voucher number
        let nextVoucherNumber = '001';
        if (voucherRes.data && voucherRes.data.length > 0) {
          const lastVoucher = voucherRes.data[0].vouchernumber;
          if (lastVoucher && !isNaN(parseInt(lastVoucher))) {
            const nextNumber = parseInt(lastVoucher) + 1;
            nextVoucherNumber = nextNumber.toString().padStart(3, '0');
          }
        }

        setFormData(prev => ({
          ...prev,
          vouchernumber: nextVoucherNumber
        }));

      } catch (err) {
        setError(err.message);
        console.error("Error fetching initial data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setError(null);
    setSuccessMessage(null);
    
    const poDateObject = parseDDMMYYYY(formData.date);
    
    if (!poDateObject || isNaN(poDateObject.getTime())) {
      setError("Please enter a valid date in DD/MM/YYYY format.");
      setFormSubmitted(false);
      return;
    }
    
    if (!formData.vouchernumber || !formData.supplierId || !formData.itemId) {
      setError("Please fill all required fields.");
      setFormSubmitted(false);
      return;
    }
    
    try {
      // --- Supabase Save Logic ---
             const { data: newPO, error: supabaseError } = await supabase
         .from('purchase_orders')
         .insert([{
           vouchernumber: formData.vouchernumber,
           ref_no: formData.ref_no,
           date: poDateObject.toISOString().split('T')[0],
           supplier_id: Number(formData.supplierId),
           item_id: Number(formData.itemId),
           quantity: Number(formData.quantity) || null,
           rate: Number(formData.rate) || null,
           cargo: Number(formData.cargo) || null,
           podi_rate: Number(formData.podi_rate) || null,
           damage_allowed_kgs_ton: Number(formData.damage_allowed_kgs_ton) || null
         }])
        .select()
        .single();
        
      if (supabaseError) throw supabaseError;

      setSuccessMessage('Purchase Order created successfully!');
      
      setTimeout(() => {
        router.push('/po-list');
      }, 1500);

    } catch (err) {
      setError(`Operation failed: ${err.message}`);
      console.error("Submission Error:", err);
    } finally {
      setFormSubmitted(false);
    }
  };

  if (loading) return <div className="text-center p-4">Loading form data...</div>;

  return (
    <div className="container mx-auto p-4 py-3 mt-20">
      <h1 className="text-2xl font-bold ml-5 mb-2">Create Purchase Order</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
      {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        
                 {/* Form fields */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Voucher Number */}
           <div className="mb-2">
             <label htmlFor="vouchernumber" className="block text-gray-700 text-sm font-bold mb-2">Voucher Number:</label>
             <input
               type="text"
               id="vouchernumber"
               name="vouchernumber"
               value={formData.vouchernumber}
               onChange={handleChange}
               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 cursor-not-allowed text-left pr-2"
               required
               disabled={true}
               readOnly
             />
           </div>

           {/* Reference Number */}
           <div className="mb-2">
             <label htmlFor="ref_no" className="block text-gray-700 text-sm font-bold mb-2">Reference Number:</label>
             <input
               type="text"
               id="ref_no"
               name="ref_no"
               value={formData.ref_no}
               onChange={handleChange}
               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2"
               required
               disabled={formSubmitted}
               placeholder="Enter reference number"
             />
           </div>

     {/* Date */}
         <div className="mb-2">
           <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Date:</label>
           <div className="relative">
             <input
               type="date"
               id="date"
               name="date"
               value={formData.date ? new Date(formData.date.split('/').reverse().join('-')).toISOString().split('T')[0] : ''}
               onChange={e => {
                 const selectedDate = e.target.value;
                 if (selectedDate) {
                   const dateObj = new Date(selectedDate);
                   const formattedDate = formatDateDDMMYYYY(dateObj);
                   setFormData(prev => ({ ...prev, date: formattedDate }));
                 }
               }}
               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2"
               required
               disabled={formSubmitted}
             />
             <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
               <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
               </svg>
             </div>
           </div>
         </div>
        
      {/* Supplier Dropdown */}
        <div className="mb-2">
          <label htmlFor="supplierId" className="block text-gray-700 text-sm font-bold mb-2">Supplier:</label>
          <select
            id="supplierId"
            name="supplierId"
            value={formData.supplierId || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            required
            disabled={formSubmitted}
          >
            <option value="">Select a supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        {/* Item Dropdown */}
        <div className="mb-2">
          <label htmlFor="itemId" className="block text-gray-700 text-sm font-bold mb-2">Item:</label>
          <select
            id="itemId"
            name="itemId"
            value={formData.itemId || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            required
            disabled={formSubmitted}
          >
            <option value="">Select an item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.item_name}
              </option>
            ))}
          </select>
        </div>
          
        </div>

        {/* Row for numeric inputs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 col-span-2 mt-4">
          <div>
            <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Quantity (MT):</label>
            <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" step="0.001" />
          </div>
          <div>
            <label htmlFor="rate" className="block text-gray-700 text-sm font-bold mb-2">Rate/Kg:</label>
            <input type="number" id="rate" name="rate" value={formData.rate} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" step="0.01" />
          </div>
          <div>
            <label htmlFor="podi_rate" className="block text-gray-700 text-sm font-bold mb-2">Podi Rate/Kg:</label>
            <input type="number" id="podi_rate" name="podi_rate" value={formData.podi_rate} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" step="0.01" />
          </div>
          <div>
            <label htmlFor="cargo" className="block text-gray-700 text-sm font-bold mb-2">Cargo (%):</label>
            <input type="number" id="cargo" name="cargo" value={formData.cargo} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" step="0.01" />
          </div>
          <div>
            <label htmlFor="damage_allowed_kgs_ton" className="block text-gray-700 text-sm font-bold mb-2">Damage per ton kg:</label>
            <input type="number" id="damage_allowed_kgs_ton" name="damage_allowed_kgs_ton" value={formData.damage_allowed_kgs_ton} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2" step="0.01" />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button variant="primary" type="submit" disabled={formSubmitted}>
            {formSubmitted ? 'Creating...' : 'Create PO'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/po-list')} disabled={formSubmitted}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
