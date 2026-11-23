import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus, Trash2, X, Printer, UserPlus } from 'lucide-react';
import { buildPartySuggestions, partyNameExists } from './utils/partySuggestions';
import { masterItemToLineFields, listedItemInputClass, LISTED_ITEM_FIELD_HINT } from './utils/itemSuggestions';
import ItemDescriptionInput from './components/ItemDescriptionInput';
import { useMasterItemsAutoSave } from './hooks/useMasterItemsAutoSave';
import { setStoredItemNotes, mapLineItemsForSave } from './utils/itemNoteStorage';
import PaymentTypeSection from './components/PaymentTypeSection';
import { usePaymentTypes } from './utils/usePaymentTypes';
import { API_BASE_URL } from './utils/apiBase';
import GSTInput from './components/GSTInput';
import FlexCalculatorSection from './components/FlexCalculatorSection';
import DigitalCalculatorSection from './components/DigitalCalculatorSection';
import OffsetCalculatorSection from './components/OffsetCalculatorSection';
import OtherItemsCalculatorSection from './components/OtherItemsCalculatorSection';

const EMPTY_PARTY_FORM = {
  partyName: '',
  address: '',
  contactNo: '',
  emailId: '',
  gstNo: '',
};

const defaultEstimateItem = () => ({
  id: Date.now() + Math.random(),
  description: '',
  descriptionNote: '',
  hsn: '',
  qty: 0,
  rate: 0,
  per: 'PCS',
  gstPercent: 18,
  total: 0,
  gstAmount: 0,
  lockedFromMaster: false,
});

const calcEstimateItem = (item, fallbackGst = 18) => {
  const qty = parseFloat(item.qty || 0);
  const rate = parseFloat(item.rate || 0);
  const gstPercent = parseFloat(item.gstPercent ?? fallbackGst);
  const total = qty * rate;
  const gstAmount = (total * gstPercent) / 100;
  return { ...item, qty, rate, gstPercent, total, gstAmount };
};

const normalizeEstimateItems = (editData) => {
  if (editData?.items?.length) {
    return editData.items.map((item) => calcEstimateItem({
      ...item,
      id: item.id || item._id || Date.now() + Math.random(),
      descriptionNote: item.descriptionNote || '',
      hsn: item.hsn || '',
      per: item.per ?? 'PCS',
      gstPercent: item.gstPercent ?? editData.gstPercent ?? 18,
      lockedFromMaster: false,
    }, editData.gstPercent ?? 18));
  }

  if (editData) {
    const qtyMatch = String(editData.jobQty || '').match(/[\d.]+/);
    const qty = qtyMatch ? parseFloat(qtyMatch[0]) : 0;
    const total = Number(editData.totalAmount) || 0;
    const rate = qty > 0 ? total / qty : total;
    return [calcEstimateItem({
      id: Date.now(),
      description: editData.jobName || '',
      hsn: '',
      qty,
      rate,
      per: 'PCS',
      gstPercent: editData.gstPercent ?? 18,
    })];
  }

  return [defaultEstimateItem()];
};

const AddEstimate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [quoteDate, setQuoteDate] = useState(
    editData?.quoteDate ? new Date(editData.quoteDate) : new Date(),
  );
  const [orderDate, setOrderDate] = useState(
    editData?.orderDate
      ? new Date(editData.orderDate)
      : (editData?.quoteDate ? new Date(editData.quoteDate) : new Date()),
  );
  const [jobCards, setJobCards] = useState([]);
  const [createJobCard, setCreateJobCard] = useState(false);
  const [newJobCardName, setNewJobCardName] = useState('');
  const [formData, setFormData] = useState({
    quoteNumber: editData?.quoteNumber || '',
    jobCard: editData?.jobCard || '',
    orderNo: editData?.orderNo || editData?.jobCard || '',
    party: editData?.partyName || '',
    partyAddress: editData?.partyAddress || editData?.address || '',
    partyContact: editData?.partyContact || '',
    partyEmail: editData?.partyEmail || '',
    partyGst: editData?.partyGst || editData?.gstNo || '',
    gstType: editData?.gstType || 'CGST/SGST',
    freight: editData?.freight || 0,
    reverseCharge: editData?.reverseCharge || 'No',
    paymentType: editData?.paymentType || '',
  });

  const [activeCategoryTab, setActiveCategoryTab] = useState(
    location.state?.category || editData?.category || 'FLEX'
  );
  const [flexData, setFlexData] = useState(editData?.flexData || null);
  const [digitalData, setDigitalData] = useState(editData?.digitalData || null);
  const [offsetData, setOffsetData] = useState(editData?.offsetData || null);
  const [otherItemsData, setOtherItemsData] = useState(editData?.otherItemsData || null);

  const [items, setItems] = useState(() => normalizeEstimateItems(editData));
  const [masterItems, setMasterItems] = useState([]);
  const { paymentTypes, loading: paymentTypesLoading } = usePaymentTypes();

  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
  const [partyForm, setPartyForm] = useState(EMPTY_PARTY_FORM);
  const [isSavingParty, setIsSavingParty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const partyDropdownRef = useRef(null);

  const partySuggestions = useMemo(() => buildPartySuggestions(jobCards), [jobCards]);

  const filteredPartySuggestions = partySuggestions.filter((party) => {
    const query = formData.party.trim().toLowerCase();
    if (!query) return true;
    return party.partyName.toLowerCase().includes(query);
  }).slice(0, 8);

  const showAddPartyButton = formData.party.trim().length > 0
    && !partyNameExists(partySuggestions, formData.party);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target)) {
        setIsPartyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jobcard`)
      .then((res) => res.json())
      .then((data) => setJobCards(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error fetching job cards:', err));

    fetch(`${API_BASE_URL}/api/items`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data.filter((item) => item.isActive !== false) : [];
        setMasterItems(list);
      })
      .catch((err) => console.error('Error fetching items:', err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'party') {
      setIsPartyDropdownOpen(true);
    }
  };

  const applyPartySuggestion = (party) => {
    setFormData((prev) => ({
      ...prev,
      party: party.partyName,
      partyAddress: party.address || prev.partyAddress,
      partyContact: party.contactNo || prev.partyContact,
      partyEmail: party.emailId || prev.partyEmail,
      partyGst: party.gstNo || prev.partyGst,
    }));
    setIsPartyDropdownOpen(false);
  };

  const openAddPartyModal = () => {
    setPartyForm({ ...EMPTY_PARTY_FORM, partyName: formData.party.trim() });
    setIsAddPartyModalOpen(true);
    setIsPartyDropdownOpen(false);
  };

  const handlePartyFormChange = (e) => {
    const { name, value } = e.target;
    setPartyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPartySave = async (e) => {
    e.preventDefault();
    if (!partyForm.partyName.trim()) {
      alert('Party name is required');
      return;
    }

    setIsSavingParty(true);
    try {
      setFormData((prev) => ({
        ...prev,
        party: partyForm.partyName.trim(),
        partyAddress: partyForm.address.trim(),
        partyContact: partyForm.contactNo.trim(),
        partyEmail: partyForm.emailId.trim(),
        partyGst: partyForm.gstNo.trim(),
      }));
      setIsAddPartyModalOpen(false);
      setPartyForm(EMPTY_PARTY_FORM);
    } finally {
      setIsSavingParty(false);
    }
  };

  const handleItemChange = (id, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;
        if (item.lockedFromMaster && ['hsn', 'per', 'gstPercent'].includes(field)) {
          return item;
        }
        const updates = { [field]: value };
        if (field === 'description') {
          updates.lockedFromMaster = false;
        }
        return calcEstimateItem({ ...item, ...updates });
      }),
    );
  };

  const applyMasterItemToRow = (id, masterItem) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;
        return calcEstimateItem({
          ...item,
          ...masterItemToLineFields(masterItem, {
            includeHsn: true,
            currentQty: item.qty,
            existingNote: item.descriptionNote,
          }),
          lockedFromMaster: true,
        });
      }),
    );
  };

  const addRow = () => {
    setItems((prev) => [...prev, defaultEstimateItem()]);
  };

  const removeRow = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const computedItems = useMemo(() => items.map((item) => calcEstimateItem(item)), [items]);

  useMasterItemsAutoSave(computedItems, masterItems, setMasterItems, API_BASE_URL);

  const subTotal = computedItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const itemsGstAmount = computedItems.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
  const freight = Number(formData.freight) || 0;
  const freightGstPercent = computedItems[0]?.gstPercent ?? 18;
  const freightGstAmount = (freight * freightGstPercent) / 100;
  const gstAmount = itemsGstAmount + freightGstAmount;
  const grandTotal = subTotal + freight + gstAmount;
  const estimateGstPercent = computedItems.length
    ? Math.round(computedItems.reduce((sum, item) => sum + item.gstPercent, 0) / computedItems.length)
    : 18;

  const createJobCardEntry = async () => {
    const firstItem = computedItems[0];
    const response = await fetch(`${API_BASE_URL}/api/jobcard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partyName: formData.party.trim(),
        companyName: formData.party.trim(),
        address: formData.partyAddress,
        contactNo: formData.partyContact,
        emailId: formData.partyEmail,
        gstNo: formData.partyGst,
        jobName: newJobCardName.trim() || firstItem?.description?.trim() || 'Direct Estimate',
        jobDate: quoteDate.toISOString(),
        jobQty: String(firstItem?.qty || 1),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create job card');
    }

    const savedJobCard = await response.json();
    setJobCards((prev) => [savedJobCard, ...prev]);
    return savedJobCard;
  };

  const buildEstimatePayload = (jobCardNumber = '') => {
    // If category is FLEX and we have flexData, use flex calculated totals and lines
    if (activeCategoryTab === 'FLEX' && flexData) {
      const flexLines = (flexData.rows || []).map((r) => ({
        description: r.description || (r.mediaType ? `${r.mediaType} Flex Printing` : 'Flex Banner Printing'),
        descriptionNote: `Size: ${r.widthVal || 0}${r.widthUnit} x ${r.heightVal || 0}${r.heightUnit} (${r.areaFt || 0} Sq.Ft.)`,
        hsn: r.hsn || '4911',
        qty: Number(r.qty) || 1,
        rate: Number(r.rateSqFt) || 0,
        per: 'SQ.FT',
        total: Number(r.total) || Number(r.amount) || 0,
        gstPercent: r.includeGst ? Number(r.taxPercent) || 18 : 0,
        gstAmount: Number(r.taxAmount) || 0,
      }));

      const finalGrandTotal = Number(flexData.finalBill) || Number(flexData.grandTotal) || 0;
      const flexJobName = flexLines.map((l) => l.description).join(' / ') || 'Flex Printing';
      const totalAreaQty = (flexData.rows || []).reduce((s, r) => s + (Number(r.qty) || 0), 0);

      return {
        quoteNumber: formData.quoteNumber || undefined,
        category: 'FLEX',
        quoteDate: quoteDate.toISOString(),
        orderNo: jobCardNumber || formData.orderNo,
        orderDate: orderDate.toISOString(),
        jobCard: jobCardNumber,
        partyName: formData.party,
        partyAddress: formData.partyAddress,
        partyContact: formData.partyContact,
        partyEmail: formData.partyEmail,
        partyGst: formData.partyGst,
        address: formData.partyAddress,
        gstNo: formData.partyGst,
        items: flexLines,
        subTotal: Number(flexData.totalBill) || finalGrandTotal,
        freight,
        reverseCharge: formData.reverseCharge || 'No',
        gstPercent: 18,
        gstType: flexData.setIgst ? 'IGST' : (formData.gstType || 'CGST/SGST'),
        gstAmount: Number(flexData.totalTaxAmount) || 0,
        totalAmount: finalGrandTotal,
        paymentType: formData.paymentType || (flexData.receipts?.[0]?.mode || ''),
        jobName: flexJobName,
        jobQty: String(totalAreaQty || 1),
        flexData,
      };
    }

    // If category is Digital and we have digitalData
    if (activeCategoryTab === 'Digital' && digitalData) {
      const digitalLines = (digitalData.rows || []).map((r) => ({
        description: r.description || (r.particular ? `${r.particular} - ${r.media || 'Digital'}` : 'Digital Printing'),
        descriptionNote: [
          r.particular && `Part: ${r.particular}`,
          r.media && `Media: ${r.media}`,
          r.size && `Size: ${r.size}`,
          r.side && `Side: ${r.side}`,
          (Number(r.chargesDesign) > 0 || Number(r.chargesOther) > 0) && `Design: ₹${r.chargesDesign || 0}, Other: ₹${r.chargesOther || 0}`,
        ].filter(Boolean).join(' | '),
        hsn: r.hsn || '4911',
        qty: Number(r.sheetQty) || Number(r.qty) || 1,
        rate: Number(r.rate) || 0,
        per: 'SHEET',
        total: Number(r.total) || Number(r.amount) || 0,
        gstPercent: Number(r.taxPercent) || 18,
        gstAmount: Number(r.taxAmount) || 0,
      }));

      const finalGrandTotal = Number(digitalData.finalBill) || Number(digitalData.grandTotal) || 0;
      const digJobName = digitalLines.map((l) => l.description).join(' / ') || 'Digital Printing';
      const totalSheetQty = (digitalData.rows || []).reduce((s, r) => s + (Number(r.sheetQty) || Number(r.qty) || 0), 0);

      return {
        quoteNumber: formData.quoteNumber || undefined,
        category: 'Digital',
        quoteDate: quoteDate.toISOString(),
        orderNo: jobCardNumber || formData.orderNo,
        orderDate: orderDate.toISOString(),
        jobCard: jobCardNumber,
        partyName: formData.party,
        partyAddress: formData.partyAddress,
        partyContact: formData.partyContact,
        partyEmail: formData.partyEmail,
        partyGst: formData.partyGst,
        address: formData.partyAddress,
        gstNo: formData.partyGst,
        items: digitalLines,
        subTotal: Number(digitalData.totalBill) || finalGrandTotal,
        freight,
        reverseCharge: formData.reverseCharge || 'No',
        gstPercent: 18,
        gstType: digitalData.setIgst ? 'IGST' : (formData.gstType || 'CGST/SGST'),
        gstAmount: Number(digitalData.totalTaxAmount) || 0,
        totalAmount: finalGrandTotal,
        paymentType: formData.paymentType || (digitalData.receipts?.[0]?.mode || ''),
        jobName: digJobName,
        jobQty: String(totalSheetQty || 1),
        digitalData,
      };
    }

    // If category is Offset and we have offsetData
    if (activeCategoryTab === 'Offset' && offsetData) {
      const offsetLines = (offsetData.rows || []).map((r) => ({
        description: r.description || r.item || 'Offset Printing Job',
        descriptionNote: [
          r.item && `Item: ${r.item}`,
          (Number(r.designCharges) > 0 || Number(r.otherCharges) > 0) && `Design: ₹${r.designCharges || 0}, Other: ₹${r.otherCharges || 0}`,
          Number(r.discount) > 0 && `Discount: ₹${r.discount}`,
        ].filter(Boolean).join(' | '),
        hsn: '4911',
        qty: parseFloat(r.qty) || 1,
        rate: Number(r.amount) || Number(r.total) || 0,
        per: r.unit || 'PCS',
        total: Number(r.total) || Number(r.amount) || 0,
        gstPercent: Number(r.taxPercent) || 18,
        gstAmount: Number(r.taxAmount) || 0,
      }));

      const finalGrandTotal = Number(offsetData.finalBill) || Number(offsetData.grandTotal) || 0;
      const offJobName = offsetLines.map((l) => l.description).join(' / ') || 'Offset Printing';
      const totalOffQty = (offsetData.rows || []).reduce((s, r) => s + (parseFloat(r.qty) || 1), 0);

      return {
        quoteNumber: formData.quoteNumber || undefined,
        category: 'Offset',
        quoteDate: quoteDate.toISOString(),
        orderNo: jobCardNumber || formData.orderNo,
        orderDate: orderDate.toISOString(),
        jobCard: jobCardNumber,
        partyName: formData.party,
        partyAddress: formData.partyAddress,
        partyContact: formData.partyContact,
        partyEmail: formData.partyEmail,
        partyGst: formData.partyGst,
        address: formData.partyAddress,
        gstNo: formData.partyGst,
        items: offsetLines,
        subTotal: Number(offsetData.totalBill) || finalGrandTotal,
        freight,
        reverseCharge: formData.reverseCharge || 'No',
        gstPercent: 18,
        gstType: offsetData.setIgst ? 'IGST' : (formData.gstType || 'CGST/SGST'),
        gstAmount: Number(offsetData.totalTaxAmount) || 0,
        totalAmount: finalGrandTotal,
        paymentType: formData.paymentType || (offsetData.receipts?.[0]?.mode || ''),
        jobName: offJobName,
        jobQty: String(totalOffQty || 1),
        offsetData,
      };
    }

    // If category is Other Items and we have otherItemsData
    if (activeCategoryTab === 'Other Items' && otherItemsData) {
      const otherLines = (otherItemsData.rows || []).map((r) => ({
        description: r.description || 'Other Item',
        descriptionNote: '',
        hsn: r.hsn || '4911',
        qty: parseFloat(r.qty) || 1,
        rate: Number(r.rate) || 0,
        per: 'PCS',
        total: Number(r.total) || Number(r.amount) || 0,
        gstPercent: Number(r.taxPercent) || 18,
        gstAmount: Number(r.taxAmount) || 0,
      }));

      const finalGrandTotal = Number(otherItemsData.finalBill) || Number(otherItemsData.grandTotal) || 0;
      const otherJobName = otherLines.map((l) => l.description).join(' / ') || 'Other Items';
      const totalOtherQty = (otherItemsData.rows || []).reduce((s, r) => s + (parseFloat(r.qty) || 1), 0);

      return {
        quoteNumber: formData.quoteNumber || undefined,
        category: 'Other Items',
        quoteDate: quoteDate.toISOString(),
        orderNo: jobCardNumber || formData.orderNo,
        orderDate: orderDate.toISOString(),
        jobCard: jobCardNumber,
        partyName: formData.party,
        partyAddress: formData.partyAddress,
        partyContact: formData.partyContact,
        partyEmail: formData.partyEmail,
        partyGst: formData.partyGst,
        address: formData.partyAddress,
        gstNo: formData.partyGst,
        items: otherLines,
        subTotal: Number(otherItemsData.totalBill) || finalGrandTotal,
        freight,
        reverseCharge: formData.reverseCharge || 'No',
        gstPercent: 18,
        gstType: otherItemsData.setIgst ? 'IGST' : (formData.gstType || 'CGST/SGST'),
        gstAmount: Number(otherItemsData.totalTaxAmount) || 0,
        totalAmount: finalGrandTotal,
        paymentType: formData.paymentType || (otherItemsData.receipts?.[0]?.mode || ''),
        jobName: otherJobName,
        jobQty: String(totalOtherQty || 1),
        otherItemsData,
      };
    }

    const jobName = computedItems
      .map((item) => item.description?.trim())
      .filter(Boolean)
      .join(' / ') || '';

    return {
      quoteNumber: formData.quoteNumber || undefined,
      category: activeCategoryTab,
      quoteDate: quoteDate.toISOString(),
      orderNo: jobCardNumber || formData.orderNo,
      orderDate: orderDate.toISOString(),
      jobCard: jobCardNumber,
      partyName: formData.party,
      partyAddress: formData.partyAddress,
      partyContact: formData.partyContact,
      partyEmail: formData.partyEmail,
      partyGst: formData.partyGst,
      address: formData.partyAddress,
      gstNo: formData.partyGst,
      items: mapLineItemsForSave(computedItems),
      subTotal,
      freight,
      reverseCharge: formData.reverseCharge || 'No',
      gstPercent: estimateGstPercent,
      gstType: formData.gstType,
      gstAmount,
      totalAmount: grandTotal,
      paymentType: formData.paymentType || '',
      jobName,
      jobQty: String(computedItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) || 0),
    };
  };

  const saveEstimate = async () => {
    let jobCardNumber = formData.jobCard || '';
    if (createJobCard) {
      const savedJobCard = await createJobCardEntry();
      jobCardNumber = savedJobCard.jobNumber || '';
    }

    const url = editData?._id
      ? `${API_BASE_URL}/api/estimate/${editData._id}`
      : `${API_BASE_URL}/api/estimate`;
    const method = editData?._id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildEstimatePayload(jobCardNumber)),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save estimate');
    }

    const saved = await response.json();
    const savedItems = mapLineItemsForSave(computedItems).map((item, index) => ({
      ...item,
      descriptionNote: computedItems[index]?.descriptionNote || item.descriptionNote || '',
    }));
    setStoredItemNotes(saved._id, saved.quoteNumber, savedItems);
    return { ...saved, items: savedItems };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.party.trim()) {
      alert('Party name is required');
      return;
    }

    setIsSaving(true);
    try {
      await saveEstimate();
      navigate('/estimates');
    } catch (err) {
      console.error('Error saving estimate:', err);
      alert(err.message || 'Failed to save estimate. Is server running?');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndPrint = async () => {
    if (!formData.party.trim()) {
      alert('Party name is required');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveEstimate();
      navigate('/estimates', {
        state: { printEstimateId: saved._id, printDoc: saved },
      });
    } catch (err) {
      console.error('Error saving estimate:', err);
      alert(err.message || 'Failed to save estimate. Is server running?');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto mt-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 group flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Manage Estimate & Quotation
          </h1>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Estimate &gt; <span className="text-blue-600">{editData ? 'Edit Estimate' : 'Add Estimate'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
          <div className="bg-blue-900 text-white px-6 py-2 w-fit relative font-semibold text-xs sm:text-sm rounded-br-2xl">
            Basic Details
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Quote No *</label>
              <input
                type="text"
                name="quoteNumber"
                value={formData.quoteNumber || (editData ? '' : 'Auto-generated')}
                readOnly
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Date *</label>
              <DatePicker
                selected={quoteDate}
                onChange={(date) => setQuoteDate(date || new Date())}
                wrapperClassName="w-full"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Order No.</label>
              <input
                type="text"
                name="orderNo"
                value={formData.orderNo}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                placeholder="Order number"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Order Date</label>
              <DatePicker
                selected={orderDate}
                onChange={(date) => setOrderDate(date || new Date())}
                wrapperClassName="w-full"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
            <div className="space-y-1 relative z-20" ref={partyDropdownRef}>
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Party *</label>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    name="party"
                    value={formData.party}
                    onChange={handleInputChange}
                    onFocus={() => setIsPartyDropdownOpen(true)}
                    onBlur={() => {
                      const match = partySuggestions.find(
                        (party) => party.partyName.toLowerCase() === formData.party.trim().toLowerCase(),
                      );
                      if (match) applyPartySuggestion(match);
                    }}
                    required
                    placeholder="Type party name..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  />
                  {isPartyDropdownOpen && filteredPartySuggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full min-w-55 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Existing parties
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredPartySuggestions.map((party) => (
                          <button
                            key={party.partyName}
                            type="button"
                            onClick={() => applyPartySuggestion(party)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 text-gray-700"
                          >
                            <span className="font-semibold text-gray-900">{party.partyName}</span>
                            {party.address && (
                              <span className="block text-xs text-gray-400 mt-0.5 truncate">{party.address}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {showAddPartyButton && (
                  <button
                    type="button"
                    onClick={openAddPartyModal}
                    className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
                    title="Add new party"
                  >
                    <UserPlus size={16} />
                    Add
                  </button>
                )}
              </div>
              {showAddPartyButton && (
                <p className="text-[11px] text-emerald-700 font-semibold px-1">
                  New party — click Add
                </p>
              )}
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-800 whitespace-nowrap self-end pb-2.5">
              <input
                type="checkbox"
                checked={createJobCard}
                onChange={(e) => setCreateJobCard(e.target.checked)}
                className="rounded border-gray-400 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              Create Job Card
            </label>
            {createJobCard && (
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Job / Item Name</label>
                <input
                  type="text"
                  value={newJobCardName}
                  onChange={(e) => setNewJobCardName(e.target.value)}
                  placeholder={computedItems[0]?.description?.trim() || 'Uses first item description if blank'}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* CATEGORY TABS (FLEX / DIGITAL / OFFSET / ETC.) */}
        <div className="bg-white border border-gray-200 overflow-x-auto rounded-2xl shadow-sm">
          <div className="flex items-center min-w-max border-b border-gray-200">
            {[
              { id: 'FLEX', label: 'FLEX' },
              { id: 'Digital', label: 'Digital' },
              { id: 'Offset', label: 'Offset' },
              { id: 'Other Items', label: 'Other Items' },
              { id: 'LED / SINAGE', label: 'LED / SINAGE' },
              { id: 'General Items', label: 'General Items' },
            ].map((tab) => {
              const isActive = activeCategoryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategoryTab(tab.id)}
                  className={`relative px-6 py-3 text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all select-none border-b-2 ${
                    isActive
                      ? 'bg-[#29c5d7] text-white border-[#f43f5e] shadow-xs'
                      : 'bg-white text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className="tracking-wide">{tab.label}</span>
                  <span
                    className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-black transition-colors ${
                      isActive ? 'bg-black/30 text-white' : 'bg-gray-400 text-white'
                    }`}
                  >
                    {tab.id === 'FLEX'
                      ? (flexData?.rows?.length || 1)
                      : tab.id === 'Digital'
                      ? (digitalData?.rows?.length || 0)
                      : tab.id === 'Offset'
                      ? (offsetData?.rows?.length || 0)
                      : tab.id === 'Other Items'
                      ? (otherItemsData?.rows?.length || 0)
                      : 0}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#f43f5e]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE CATEGORY CONTENT */}
        {activeCategoryTab === 'FLEX' ? (
          <FlexCalculatorSection
            initialData={editData?.flexData}
            onTotalsChange={(data) => setFlexData(data)}
          />
        ) : activeCategoryTab === 'Digital' ? (
          <DigitalCalculatorSection
            initialData={editData?.digitalData}
            onTotalsChange={(data) => setDigitalData(data)}
          />
        ) : activeCategoryTab === 'Offset' ? (
          <OffsetCalculatorSection
            initialData={editData?.offsetData}
            onTotalsChange={(data) => setOffsetData(data)}
          />
        ) : activeCategoryTab === 'Other Items' ? (
          <OtherItemsCalculatorSection
            initialData={editData?.otherItemsData}
            onTotalsChange={(data) => setOtherItemsData(data)}
          />
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
              <div className="bg-blue-900 text-white px-6 py-2 w-fit relative font-semibold text-xs sm:text-sm rounded-br-2xl">
                Item Details ({activeCategoryTab})
              </div>
              <div className="overflow-x-auto overflow-y-visible -mx-1 px-1">
                <table className="crm-items-table w-full text-left border-collapse min-w-245">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider w-56">Description *</th>
                      <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider w-40">HSN/SAC</th>
                      <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-24">Qty *</th>
                      <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-28">Rate *</th>
                      <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-20">per</th>
                      <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-24">GST %</th>
                      <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-32">Amount</th>
                      <th className="px-6 py-3 w-14" />
                    </tr>
                  </thead>
                  <tbody>
                    {computedItems.map((item) => {
                      const isListedItem = item.lockedFromMaster;
                      return (
                        <tr key={item.id} className="border-t border-gray-100 group">
                          <td className="px-6 py-4">
                            <ItemDescriptionInput
                              value={item.description}
                              note={item.descriptionNote || ''}
                              onChange={(value) => handleItemChange(item.id, 'description', value)}
                              onNoteChange={(value) => handleItemChange(item.id, 'descriptionNote', value)}
                              onSelectMaster={(masterItem) => applyMasterItemToRow(item.id, masterItem)}
                              masterItems={masterItems}
                              required
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={item.hsn || ''}
                              onChange={(e) => handleItemChange(item.id, 'hsn', e.target.value)}
                              placeholder="HSN/SAC"
                              readOnly={isListedItem}
                              title={isListedItem ? LISTED_ITEM_FIELD_HINT : undefined}
                              className={listedItemInputClass(
                                isListedItem,
                                'w-full bg-white border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm',
                              )}
                            />
                          </td>
                          <td className="px-2 py-4 text-center">
                            <div className="flex justify-center">
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                                required
                                className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-center"
                              />
                            </div>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <div className="flex justify-center">
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                                required
                                className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-center"
                              />
                            </div>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <div className="flex justify-center">
                              <input
                                type="text"
                                value={item.per ?? ''}
                                onChange={(e) => handleItemChange(item.id, 'per', e.target.value)}
                                placeholder="PCS"
                                readOnly={isListedItem}
                                title={isListedItem ? LISTED_ITEM_FIELD_HINT : undefined}
                                className={listedItemInputClass(
                                  isListedItem,
                                  'w-16 bg-white border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-center uppercase',
                                )}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <div className="flex justify-center">
                              <input
                                type="number"
                                value={item.gstPercent}
                                onChange={(e) => handleItemChange(item.id, 'gstPercent', e.target.value)}
                                min="0"
                                step="any"
                                readOnly={isListedItem}
                                title={isListedItem ? LISTED_ITEM_FIELD_HINT : undefined}
                                className={listedItemInputClass(
                                  isListedItem,
                                  'w-20 bg-white border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-center',
                                )}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <div className="flex justify-center">
                              <input
                                type="text"
                                value={Number(item.total || 0).toFixed(2)}
                                readOnly
                                className="w-28 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 focus:outline-none text-sm text-center font-semibold text-blue-700"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(item.id)}
                              className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-100"
                              title="Remove row"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 flex justify-end bg-gray-50/50">
                <button
                  type="button"
                  onClick={addRow}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
                >
                  <Plus size={16} /> Add Row
                </button>
              </div>
            </div>

            <PaymentTypeSection
              value={formData.paymentType}
              onChange={(value) => setFormData((prev) => ({ ...prev, paymentType: value }))}
              paymentTypes={paymentTypes}
              loading={paymentTypesLoading}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Sub Total *</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-lg font-semibold text-gray-800">
                  ₹ {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Freight</label>
                <input
                  type="number"
                  name="freight"
                  min="0"
                  step="0.01"
                  value={formData.freight}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base sm:text-lg font-semibold text-gray-800"
                  placeholder="0.00"
                />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">GST Amount</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-lg font-semibold text-gray-800">
                  ₹ {gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">GST Type *</label>
                <select
                  name="gstType"
                  value={formData.gstType}
                  onChange={handleInputChange}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-lg px-4 py-2.5 outline-none cursor-not-allowed transition-all text-base sm:text-lg font-semibold pointer-events-none"
                >
                  <option value="CGST/SGST">CGST + SGST</option>
                  <option value="IGST">IGST</option>
                </select>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Reverse Charge</label>
                <select
                  name="reverseCharge"
                  value={formData.reverseCharge}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base sm:text-lg font-semibold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2 sm:col-span-2 lg:col-span-1">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Grand Total</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-lg font-bold text-blue-600">
                  ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleSaveAndPrint}
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Printer size={18} />
            {isSaving ? 'Saving...' : 'Save & Print'}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white px-10 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            {isSaving ? 'Saving...' : (editData ? 'Update Estimate' : 'Save Estimate')}
          </button>
        </div>
      </form>

      {isAddPartyModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add New Party</h2>
                <p className="text-sm text-gray-500">Basic details for quotation printing</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPartyModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddPartySave} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Party Name *</label>
                <input
                  type="text"
                  name="partyName"
                  value={partyForm.partyName}
                  onChange={handlePartyFormChange}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Address</label>
                <input
                  type="text"
                  name="address"
                  value={partyForm.address}
                  onChange={handlePartyFormChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Contact No</label>
                  <input
                    type="text"
                    name="contactNo"
                    value={partyForm.contactNo}
                    onChange={handlePartyFormChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">GST No</label>
                  <GSTInput
                    name="gstNo"
                    value={partyForm.gstNo}
                    onChange={handlePartyFormChange}
                    placeholder="URP if unregistered"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  name="emailId"
                  value={partyForm.emailId}
                  onChange={handlePartyFormChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPartyModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingParty}
                  className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-sm"
                >
                  {isSavingParty ? 'Saving...' : 'Save Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEstimate;
