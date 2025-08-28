// src/app/po/[id]/page.jsx (for editing existing POs)
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatDateDDMMYYYY, parseDDMMYYYY } from '@/utils/dateUtils';


export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams();
  const poId = params.id;
  
  const [formData, setFormData] = useState({
    vouchernumber: '',
    ref_no: '',
    date: formatDateDDMMYYYY(new Date()),
    supplierId: 0,
    itemId: 0,
    quantity: 0,
    rate: 0,
    cargo: null,
    podi_rate: null,
    damage_allowed_kgs_ton: null
  });
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Admin section
  const [isPoClosed, setIsPoClosed] = useState(false);
  const [adminRemark, setAdminRemark] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [originalPoData, setOriginalPoData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Validate poId
        if (!poId || isNaN(parseInt(poId))) {
          throw new Error('Invalid PO ID');
        }

        // Determine admin status
        let session = null;
        let userIsAdmin = false;
        
        try {
            const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession();
            session = sessionData;
            if (sessionError) {
                console.error('Error fetching session for admin check:', sessionError);
                userIsAdmin = false;
            } else {
                const userEmail = session?.user?.email;
                userIsAdmin = userEmail && userEmail.startsWith('admin');
            }
        } catch (error) {
            console.log('PO Page: Auth session missing, treating as non-admin');
            userIsAdmin = false;
        }
        
        setIsAdmin(userIsAdmin);

        // Fetch suppliers
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('suppliers')
          .select('id, name');
        if (suppliersError) throw suppliersError;
        setSuppliers(suppliersData || []);

        // Fetch items
        const { data: itemsData, error: itemsError } = await supabase
          .from('item_master')
          .select('id, item_name, hsn_code, item_unit');
        if (itemsError) throw itemsError;
        setItems(itemsData || []);

        // Fetch existing purchase order data
        const { data: existingPO, error: poError } = await supabase
          .from('purchase_orders')
          .select('*')
          .eq('id', parseInt(poId))
          .single();

        if (poError) {
          if (poError.code === 'PGRST116') {
            throw new Error('Purchase Order not found');
          }
          throw poError;
        }

        if (existingPO) {
          console.log('Fetched PO:', existingPO); // Debug log

          setOriginalPoData(existingPO);
          setFormData({
            vouchernumber: existingPO.vouchernumber ?? '',
            ref_no: existingPO.ref_no ?? '',
            date: formatDateDDMMYYYY(existingPO.date),
            supplierId: existingPO.supplier_id ?? '',
            itemId: existingPO.item_id ?? '',
            quantity: existingPO.quantity ?? '',
            rate: existingPO.rate ?? '',
            cargo: existingPO.cargo ?? '',
            podi_rate: existingPO.podi_rate ?? '',
            damage_allowed_kgs_ton: existingPO.damage_allowed_kgs_ton ?? ''
          });
          setIsPoClosed(existingPO.po_closed ?? false);
          setAdminRemark(existingPO.admin_remark ?? '');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Failed to load form data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Only run when poId changes
  }, [poId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'supplierId' || name === 'itemId' || name === 'quantity' || name === 'rate' || name === 'cargo' || name === 'podi_rate' || name === 'damage_allowed_kgs_ton'
        ? (value === '' ? '' : Number(value))
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setError(null);
    setSuccessMessage(null);

    // Basic validation
    if (!formData.vouchernumber || !formData.supplierId || !formData.itemId ||
        formData.quantity <= 0 || formData.rate <= 0) {
      setError("Please fill in all required fields: Voucher Number, Supplier, Item, Quantity, and Rate (must be greater than 0).");
      setFormSubmitted(false);
      return;
    }

    const poDateObject = parseDDMMYYYY(formData.date);

    // Date validation
    if (!poDateObject || isNaN(poDateObject.getTime())) {
      setError("Please enter a valid date in DD/MM/YYYY format.")
      setFormSubmitted(false);
      return;
    }

    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
    const selectedItem = items.find(i => i.id === formData.itemId);

    if (!selectedSupplier) {
      setError("Selected supplier not found.");
      setFormSubmitted(false);
      return;
    }
    if (!selectedItem) {
      setError("Selected item not found.");
      setFormSubmitted(false);
      return;
    }

    // Prepare update data with proper null handling
    const updateData = {
      vouchernumber: formData.vouchernumber,
      ref_no: formData.ref_no,
      date: poDateObject.toISOString().split('T')[0],
      supplier_id: Number(formData.supplierId),
      item_id: Number(formData.itemId),
      quantity: Number(formData.quantity),
      rate: Number(formData.rate),
      podi_rate: formData.podi_rate === '' ? null : Number(formData.podi_rate),
      cargo: formData.cargo === '' ? null : Number(formData.cargo),
      damage_allowed_kgs_ton: formData.damage_allowed_kgs_ton === '' ? null : Number(formData.damage_allowed_kgs_ton),
      po_closed: isPoClosed,
      admin_remark: adminRemark,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updateData)
        .eq('id', parseInt(poId))
        .select()
        .single();

      if (error) throw error;

      setSuccessMessage('Purchase Order updated successfully!');
      setTimeout(() => {
        router.push('/po-list');
      }, 1500);
    } catch (error) {
      console.error('Update error:', error, JSON.stringify(error));
      setError(`Failed to update purchase order: ${error?.message || JSON.stringify(error) || 'Unknown error'}`);
    } finally {
      setFormSubmitted(false);
    }
  };

  const isPoCloseSectionDisabledForNonAdmin = !isAdmin;

  if (loading) return <div className="text-center p-4">Loading form data...</div>;

  return (
    <div className="container mx-auto p-2 py-1 mt-23">
      <h1 className="text-2xl font-bold ml-5 mb-1">Edit Purchase Order</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
      {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Voucher Number */}
          <div className="mb-1">
            <label htmlFor="vouchernumber" className="block text-gray-700 text-sm font-bold mb-2">Voucher Number:</label>
            <input
              type="text"
              id="vouchernumber"
              name="vouchernumber"
              value={formData.vouchernumber}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              required
              disabled={formSubmitted}
            />
          </div>
          {/* Reference Number */}
          <div className="mb-1">
            <label htmlFor="ref_no" className="block text-gray-700 text-sm font-bold mb-2">Reference Number:</label>
            <input
              type="text"
              id="ref_no"
              name="ref_no"
              value={formData.ref_no}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2"
              disabled={formSubmitted}
              placeholder="Enter reference number"
            />
          </div>
          {/* Date */}
          <div className="mb-1">
            <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Date:</label>
            <input
              type="text"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-left pr-2"
              required
              disabled={formSubmitted}
            />
          </div>
          {/* Supplier Dropdown */}
          <div className="mb-1">
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
          <div className="mb-1">
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
          <div className="w-full grid grid-cols-5 md:grid-cols-5 gap-4 mt-2 col-span-2">
  {/* Quantity */}
  <div className="mb-1">
    <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Quantity (MT):</label>
    <input
      type="number"
      id="quantity"
      name="quantity"
      value={formData.quantity ?? ''}
      onChange={handleChange}
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-right"
      required
      disabled={formSubmitted}
    />
  </div>
  {/* Rate */}
  <div className="mb-1">
    <label htmlFor="rate" className="block text-gray-700 text-sm font-bold mb-2">Rate/Kg:</label>
    <input
      type="number"
      id="rate"
      name="rate"
      value={formData.rate ?? ''}
      onChange={handleChange}
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-right"
      required
      disabled={formSubmitted}
    />
  </div>
  {/* Podi Rate */}
  <div className="mb-1">
    <label htmlFor="podi_rate" className="block text-gray-700 text-sm font-bold mb-2">Approx. Podi Rate/Kg</label>
    <input
      type="number"
      id="podi_rate"
      name="podi_rate"
      value={formData.podi_rate ?? ''}
      onChange={handleChange}
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-right"
      disabled={formSubmitted}
    />
  </div>
  {/* Cargo */}
  <div className="mb-1">
    <label htmlFor="cargo" className="block text-gray-700 text-sm font-bold mb-2">Cargo (%):</label>
    <input
      type="number"
      id="cargo"
      name="cargo"
      value={formData.cargo ?? ''}
      onChange={handleChange}
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-right"
      disabled={formSubmitted}
    />
  </div>
  {/* Damage Allowed */}
  <div className="mb-1">
    <label htmlFor="damage_allowed_kgs_ton" className="block text-gray-700 text-sm font-bold mb-2">Damage per ton kg:</label>
    <input
      type="number"
      id="damage_allowed_kgs_ton"
      name="damage_allowed_kgs_ton"
      value={formData.damage_allowed_kgs_ton ?? ''}
      onChange={handleChange}
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-right"
      disabled={formSubmitted}
    />
  </div>
</div>
      </div>
        {/* Admin's PO Closure Section - Only visible if isAdmin is true */}
        {isAdmin && (
          <div className="border border-green-200 rounded-md p-4  bg-white">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Admin Remark</h3>
            <div className="flex items-center mb-1">
              <input
                type="checkbox"
                id="isPoClosed"
                className="h-4 w-4 text-green-800 focus:ring-green-500 border-gray-300 rounded"
                checked={isPoClosed}
                onChange={(e) => setIsPoClosed(e.target.checked)}
                disabled={isPoCloseSectionDisabledForNonAdmin}
              />
              <label htmlFor="adminApproval" className="ml-2 block text-sm font-medium text-green-800">
                Close PO
              </label>
            </div>
            {isPoClosed && (
              <div className='bg-white'>
                <label htmlFor="adminRemark" className="block bg-white text-sm font-medium text-green-900">Admin Remark</label>
                <textarea
                  id="adminRemark"
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
                  value={adminRemark}
                  onChange={(e) => setAdminRemark(e.target.value)}
                  disabled={isPoCloseSectionDisabledForNonAdmin}
                ></textarea>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <Button
            variant="primary"
            type="submit"
            disabled={formSubmitted}
          >
            {formSubmitted ? 'Updating...' : 'Update Purchase Order'}
          </Button>

          <Button
            variant="secondary"
            type="button"
            onClick={() => router.push('/po-list')}
            disabled={formSubmitted}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}