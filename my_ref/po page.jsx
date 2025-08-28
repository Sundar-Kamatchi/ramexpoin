// src/app/purchase-order/page.jsx
'use client';

import { useState, useEffect } from 'react';
import {supabase } from '../../lib/supabaseClient'; // Adjust path if needed
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'xmlbuilder2';
import { Button } from '@/components/ui/button';

import { getPurchaseOrderTallyXmlObject } from '../../utils/tallyXmlTemplates';

// --- CORRECTED: Julian Day Number calculation for Tally ---
const getJulianDayNumber = (date) => {
  // Validate input date
  if (!date || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to getJulianDayNumber');
  }
  
  // Julian Day Number calculation (days since January 1, 1900 for Excel/Tally compatibility)
  const julianDayNumber = Math.floor((date.getTime() / 86400000) + 25569);
  return julianDayNumber;
};

// --- Format date for Tally display (19-Jul-25 format) ---
const formatDateForTally = (date) => {
  if (!date || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to formatDateForTally');
  }
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
  
  return `${day}-${month}-${year}`;
};

// --- OPTIONAL: Day of year function (if you need J001-J366 format somewhere else) ---
const getDayOfYear = (date) => {
  if (!date || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to getDayOfYear');
  }
  
  const startOfYear = new Date(date.getFullYear(), 0, 1); // FIXED: Start from Jan 1, not Jan 0
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay) + 1; // +1 because Jan 1 is day 1, not day 0
  return `J${dayOfYear.toString().padStart(3, '0')}`;
};

export default function PurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditing = Boolean(editId);
  const [formData, setFormData] = useState({
    vouchernumber: '',
    date: new Date().toISOString().slice(0, 10),
    supplierId: 0,
    itemId: 0,
    quantity: 0,
    rate: 0,
    damage_allowed: null,
    cargo: null,
  });
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [tallyCompanies, setTallyCompanies] = useState([]);
  const [selectedTallyCompany, setSelectedTallyCompany] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  //admin section
  const [isPoClosed, setIsPoClosed] = useState(false);
  const [adminRemark, setAdminRemark] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // Initialize isAdmin as false by default  

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      let mainError = null;

      try {
        // Determine admin status based on user email
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error('Error fetching session for admin check:', sessionError);
            setIsAdmin(false);
        } else {
            const userEmail = session?.user?.email;
            // Check if the user's email starts with 'admin'
            const userIsAdmin = userEmail && userEmail.startsWith('admin');
            setIsAdmin(userIsAdmin);
            console.log('Auth Check: User Email:', userEmail, 'Is Admin:', userIsAdmin);
        }

        // --- Fetch suppliers ---
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('suppliers')
          .select('id, name');
        if (suppliersError) {
          mainError = `Failed to fetch suppliers: ${suppliersError.message}`;
          console.error(mainError);
        } else {
          setSuppliers(suppliersData || []);
        }

        // --- Fetch items ---
        const { data: itemsData, error: itemsError } = await supabase
          .from('item_master')
          .select('id, item_name, hsn_code, item_unit');
        if (itemsError) {
          mainError = mainError ? `${mainError}\nFailed to fetch items: ${itemsError.message}` : `Failed to fetch items: ${itemsError.message}`;
          console.error(`Failed to fetch items: ${itemsError.message}`);
        } else {
          setItems(itemsData || []);
        }
     // --- If editing, fetch existing purchase order data ---
        if (isEditing && editId) {
          const { data: existingPO, error: poError } = await supabase
            .from('purchase_orders')
            .select('*')
            .eq('id', parseInt(editId))
            .single();

          if (poError) {
            mainError = mainError ? `${mainError}\nFailed to fetch purchase order: ${poError.message}` : `Failed to fetch purchase order: ${poError.message}`;
            console.error(`Failed to fetch purchase order: ${poError.message}`);
          } else if (existingPO) {
            setFormData({
              vouchernumber: existingPO.vouchernumber || '',
              date: existingPO.date || new Date().toISOString().slice(0, 10),
              supplierId: existingPO.supplier_id,
              itemId: existingPO.item_id,
              quantity: existingPO.quantity || 0,
              rate: existingPO.rate || 0,
                              damage_allowed: existingPO.damage_allowed_kgs_ton,
              cargo: existingPO.cargo,
            });
          }
        }

        // --- Fetch Tally Companies ---
        let tallyCompaniesFetched = [];
        let tallyFetchError = null;

        try {
          const tallyResponse = await fetch('/api/tally-companies');
          if (!tallyResponse.ok) {
            const errText = await tallyResponse.text();
            tallyFetchError = `Tally API responded with status ${tallyResponse.status}: ${errText}`;
            console.error("Failed to fetch Tally companies:", tallyFetchError);
          } else {
            const tallyData = await tallyResponse.json();
            console.log("Tally companies response:", tallyData);
            
            if (tallyData.companies && tallyData.companies.length > 0) {
              setTallyCompanies(tallyData.companies);
              setSelectedTallyCompany(tallyData.companies[0].name);
            } else {
              tallyFetchError = "No companies found in Tally response";
            }
          }
        } catch (err) {
          tallyFetchError = `Error connecting to Tally: ${err.message}`;
          console.error("Tally fetch error:", err);
        }
        if (tallyFetchError) {
            mainError = mainError ? `${mainError}\n${tallyFetchError}` : tallyFetchError;
        }

      } catch (err) {
        mainError = mainError ? `${mainError}\nUnexpected error: ${err.message}` : `Unexpected error: ${err.message}`;
        console.error('Unexpected error fetching data:', err.message);
      } finally {
        setLoading(false);
        setError(mainError);
      }
    };

    fetchInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'supplierId' || name === 'itemId' || name === 'quantity' || name === 'rate' || name === 'damage_allowed' || name === 'cargo'
        ? (value === '' ? null : Number(value))
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

  // Date validation
  if (!formData.date) {
    setError("Please select a valid date.");
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

  // --- Conditional Logic for Units (Onion vs. Other Items) ---
  let primaryUnitForTally;
  let alternativeUnitForTally;

  const isOnionItem = selectedItem.item_name.toLowerCase().includes('onion');

  if (isOnionItem) {
    primaryUnitForTally = 'MT';
    alternativeUnitForTally = 'Kgs';
  } else {
    if (!selectedItem.item_unit ) {
      setError(`Selected item "${selectedItem.item_name}" is missing unit or conversion factor data in the database.`);
      setFormSubmitted(false);
      return;
    }
    primaryUnitForTally = selectedItem.item_unit;
    alternativeUnitForTally = selectedItem.item_unit;
  }

  // Validate essential item master data for Tally (HSN is always needed)
  if (!selectedItem.hsn_code) {
      setError(`Selected item "${selectedItem.item_name}" is missing HSN code.`);
      setFormSubmitted(false);
      return;
  }

  // Tally company is required only for new records and if Electron API is available
  if (!isEditing && !selectedTallyCompany) {
      setError("Please select a Tally company to post the Purchase Order.");
      setFormSubmitted(false);
      return;
  }

  try {
    let supabaseResponseData;
    let supabaseError;
    // --- Supabase Save/Update Logic ---
    if (isEditing && editId) {
      const response = await supabase
        .from('purchase_orders')
        .update({
          vouchernumber: formData.vouchernumber,
          date: formData.date,
          supplier_id: formData.supplierId,
          item_id: formData.itemId,
          quantity: formData.quantity,
          rate: formData.rate,
          damage_allowed: formData.damage_allowed,
          cargo: formData.cargo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parseInt(editId))
        .select()
        .single();

      supabaseResponseData = response.data;
      supabaseError = response.error;
    } else {
      const response = await supabase
        .from('purchase_orders')
        .insert([
          {
            vouchernumber: formData.vouchernumber,
            date: formData.date,
            supplier_id: formData.supplierId,
            item_id: formData.itemId,
            quantity: formData.quantity,
            rate: formData.rate,
            damage_allowed: formData.damage_allowed_kgs_ton,
            cargo: formData.cargo,
          },
        ])
        .select()
        .single();

      supabaseResponseData = response.data;
      supabaseError = response.error;
    }

    if (supabaseError) {
      console.error('Supabase save error:', supabaseError);
      throw new Error(`Supabase save error: ${supabaseError.message}`);
    }

    console.log(`Purchase Order ${isEditing ? 'updated' : 'saved'} to Supabase:`, supabaseResponseData);

    // --- Post to TallyPrime ONLY FOR NEW RECORDS ---
    if (!isEditing && supabaseResponseData && selectedTallyCompany) {
      try {
        // --- Prepare Data for Tally (TallyPurchaseOrderGenerationData object) ---
        const voucherGuid = uuidv4().toUpperCase();
        const voucherKey = `${voucherGuid}-0000008e`;

        const currentDate = new Date();
        const currentDateFormatted = format(currentDate, 'yyyyMMdd');
        
        // SAFE DATE HANDLING WITH PROPER VALIDATION
        const poDateObject = new Date(formData.date);
        
        // Validate the date object
        if (isNaN(poDateObject.getTime())) {
          setError("Invalid date format. Please select a valid date.");
          setFormSubmitted(false);
          return;
        }
        
        const poDateForTally = format(poDateObject, 'yyyyMMdd');
        const orderDueDate = poDateForTally;
        
        // SAFE Julian day number calculation using the corrected function
        let orderDueDateJD;
        let orderDueDateForTally;
        
        try {
          orderDueDateJD = getJulianDayNumber(poDateObject);
          orderDueDateForTally = formatDateForTally(poDateObject);
        } catch (dateError) {
          console.error('Date processing error:', dateError);
          setError("Failed to process the selected date. Please try again.");
          setFormSubmitted(false);
          return;
        }

        const tallyData = {
          poData: formData,
          selectedTallyCompany: selectedTallyCompany,
          supplierName: selectedSupplier.name,
          itemName: selectedItem.item_name,
          itemHSN: selectedItem.hsn_code,
          primaryUnit: primaryUnitForTally,
          alternativeUnit: alternativeUnitForTally,
          qtyInAlternativeUnit: formData.quantity / 1000,
          rate:formData.rate,
          actualItemAmount: formData.quantity * formData.rate,
          voucherGuid: voucherGuid,
          voucherKey: voucherKey,
          currentDateFormatted: currentDateFormatted,
          poDate: poDateForTally,
          orderDueDate: orderDueDate,
          orderDueDateJD: orderDueDateJD, // Now properly calculated
          orderDueDateForTally: orderDueDateForTally, // Human-readable format for XML
          damageAllowed: formData.damage_allowed_kgs_ton || 0,
          cargoPer: formData.cargo || 0,
        };

        // --- Get the XML Object from your utility function ---
        const tallyXmlObject = getPurchaseOrderTallyXmlObject(tallyData);

        // --- Convert the XML Object to a string ---
        let tallyXmlString;
        try {
          tallyXmlString = create(tallyXmlObject).end({ prettyPrint: false, indent: '', newline: '' });
          console.log(tallyXmlString);
        } catch (builderError) {
          console.error("Error converting XML object to string:", builderError);
          setError("Failed to generate XML for Tally. Check console for details.");
          setFormSubmitted(false);
          return;
        }

        console.log("Generated Tally XML (Frontend):\n", tallyXmlString);

        // --- Post the XML string to TallyPrime via Electron API ---
        const tallyPostResponse = await fetch('/api/tally-post-po', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            purchaseOrderId: supabaseResponseData.id
          })
        });

        const tallyPostResult = await tallyPostResponse.json();
        if (!tallyPostResult.success) {
          console.error('Tally posting error:', tallyPostResult.error);
          setError(`Failed to post to Tally: ${tallyPostResult.error}. Details: ${tallyPostResult.tallyResponse ? JSON.stringify(tallyPostResult.tallyResponse) : tallyPostResult.tallyRawResponse || 'N/A'}`);
        } else {
          console.log('Tally posting successful:', tallyPostResult.message);
          setSuccessMessage(`Purchase Order created and posted to Tally successfully!`);
        }
      } catch (tallyError) {
        console.error('Tally preparation error:', tallyError);
        setError(`Failed to prepare data for Tally: ${tallyError.message}`);
        setFormSubmitted(false);
        return;
      }
    } else if (isEditing) {
      setSuccessMessage('Purchase Order updated successfully!');
    }

    // --- Navigation and Form Reset ---
    setTimeout(() => {
      router.push('/po-list');
    }, 1500);

    // Reset form only if creating new (not editing)
    if (!isEditing) {
      setFormData({
        vouchernumber: '',
        date: new Date().toISOString().slice(0, 10),
        supplierId: 0,
        itemId: 0,
        quantity: 0,
        rate: 0,
        damage_allowed: null,
        cargo: null,
      });
    }

  } catch (err) {
    console.error('Form submission error:', err.message);
    setError(`Failed to ${isEditing ? 'update' : 'create'} purchase order: ${err.message}`);
  } finally {
    setFormSubmitted(false);
  }
};

  const isPoCloseSectionDisabledForNonAdmin = !isAdmin;


  if (loading) return <div className="text-center p-4">Loading form data...</div>;

  return (
    <div className="container mx-auto p-4 py-3">
      <h1 className="text-2xl font-bold ml-5 mb-2">
        {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
      </h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
      {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        {!isEditing && (
          <div className="mb-4">
            <label htmlFor="tallyCompany" className="block text-gray-700 text-sm font-bold mb-2">
              Select Tally Company:
            </label>
            <select
              id="tallyCompany"
              name="tallyCompany"
              value={selectedTallyCompany || ''}
              onChange={(e) => setSelectedTallyCompany(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              required
              disabled={tallyCompanies.length === 0 || formSubmitted}
            >
              {tallyCompanies.length === 0 ? (
                <option value="">Loading companies...</option>
              ) : (
                <>
                  <option value="">Select a company</option>
                  {tallyCompanies.map((company) => (
                    <option key={company.companyNumber} value={company.name}>
                      {company.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {tallyCompanies.length === 0 && <p className="text-red-500 text-xs mt-1">
              Please ensure TallyPrime is running with a company open and configured correctly in Electron.</p>}
          </div>
        )}

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
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              required
              disabled={formSubmitted}
            />
          </div>
          {/* Date */}
          <div className="mb-2">
            <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              required
              disabled={formSubmitted}
            />
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

          {/* Quantity */}
          <div className="mb-2">
            <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Quantity:</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity === null ? '' : formData.quantity}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              required
              step="0.001"
              disabled={formSubmitted}
            />
          </div>

          {/* Rate */}
          <div className="mb-2">
            <label htmlFor="rate" className="block text-gray-700 text-sm font-bold mb-2">Rate:</label>
            <input
              type="number"
              id="rate"
              name="rate"
              value={formData.rate === null ? '' : formData.rate}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              step="0.01"
              disabled={formSubmitted}
            />
          </div>

          {/* Damage Allowed */}
          <div className="mb-2">
            <label htmlFor="damage_allowed" className="block text-gray-700 text-sm font-bold mb-2">Damage per ton kg:</label>
            <input
              type="number"
              id="damage_allowed"
              name="damage_allowed"
              value={formData.damage_allowed === null ? '' : formData.damage_allowed}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              step="0.01"
              disabled={formSubmitted}
            />
          </div>

          {/* Cargo */}
          <div className="mb-2">
            <label htmlFor="cargo" className="block text-gray-700 text-sm font-bold mb-2">Cargo (%):</label>
            <input
              type="number"
              id="cargo"
              name="cargo"
              value={formData.cargo === null ? '' : formData.cargo}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              step="0.01"
              disabled={formSubmitted}
            />
          </div>
        </div>
          {/* Admin's PO Closure Section - Only visible if isAdmin is true */}
        {isAdmin && (
            <div className="border border-green-200 dark:border-green-700 rounded-md p-4 mb-6 bg-white dark:bg-white">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-800 mb-2">Admin Remark</h3>
                <div className="flex items-center mb-2">
                    <input
                        type="checkbox"
                        id="isPoClosed"
                        className="h-4 w-4 text-green-800 focus:ring-green-500 border-gray-300 rounded dark:bg-green-900 dark:border-gray-600"
                        checked={isPoClosed}
                        onChange={(e) => setIsPoClosed(e.target.checked)}
                        disabled={isPoCloseSectionDisabledForNonAdmin} // Disabled if not admin and already closed
                    />
                    <label htmlFor="adminApproval" className="ml-2 block text-sm font-medium text-green-800 dark:text-green-800">
                        Close PO
                    </label>
                </div>
                {isPoClosed && (
                    <div className='bg-white'>
                        <label htmlFor="adminRemark" className="block bg-white text-sm font-medium text-green-900 dark:text-green-900">Admin Remark</label>
                        <textarea
                            id="adminRemark"
                            rows="3"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-white dark:text-white"
                            value={adminRemark}
                            onChange={(e) => setAdminRemark(e.target.value)}
                            disabled={isPoCloseSectionDisabledForNonAdmin} // Disabled if not admin and already closed
                        ></textarea>
                    </div>
                )}
            </div>
        )}

        <div className="flex gap-4">
          <Button
            variant="primary"
            type="submit"
            //className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={formSubmitted}
          >
            {formSubmitted ? 'Saving...' : (isEditing ? 'Update Purchase Order' : 'Create & Post PO')}
          </Button>

          <Button
            variant="secondary"
            type="button"
            onClick={() => router.push('/po-list')}
            //className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={formSubmitted}
          >
            Cancel
          </Button>
        </div>

      </form>
    </div>
  );
}