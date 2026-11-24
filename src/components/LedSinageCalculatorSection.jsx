import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiBase';

const LED_ITEM_TYPES = [
  'Select Item Type',
  'Channel Letter',
  'LED Plate',
  'Acrylic LED Signage',
  'LED Board',
  'Acrylic Letters',
  'Acrylic Box',
  'Edge Lit Box',
  'Neon LED Sign',
  'Backlit LED Board',
  'Profile Letter / 3D Letter',
  'Number Plate',
  'Rod',
  '2D LED',
  '3D LED',
  'Sign Board Frame',
];

const TAX_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '12%', value: 12 },
  { label: '18%', value: 18 },
  { label: '28%', value: 28 },
];

const defaultLedItem = (index = 1) => ({
  id: Date.now() + Math.random(),
  tabTitle: `Item ${index}`,
  itemType: '',
  description: '',
  qty: 1,
  rate: 0,
  discount: 0,
  taxPercent: 18,
  taxAmount: 0,
  finalAmount: 0,
});

const calcLedItem = (item) => {
  const qty = parseFloat(item.qty) || 0;
  const rate = parseFloat(item.rate) || 0;
  const discount = parseFloat(item.discount) || 0;

  const baseAmount = Math.max(0, (qty * rate) - discount);
  const taxPercent = parseFloat(item.taxPercent) || 0;
  const taxAmount = (baseAmount * taxPercent) / 100;
  const finalAmount = baseAmount + taxAmount;

  return {
    ...item,
    baseAmount: parseFloat(baseAmount.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    finalAmount: parseFloat(finalAmount.toFixed(2)),
  };
};

export default function LedSinageCalculatorSection({ onTotalsChange, initialData = {} }) {
  const [quotationItemsList, setQuotationItemsList] = useState([]);
  const [itemTypeOptions, setItemTypeOptions] = useState(LED_ITEM_TYPES);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/quotation-items?category=LED%20%2F%20SINAGE`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setQuotationItemsList(data);
          const names = ['Select Item Type', ...data.map((d) => d.name)];
          setItemTypeOptions(names);
        }
      })
      .catch((err) => console.error('Error fetching led signage items:', err));
  }, []);

  const [items, setItems] = useState(() => {
    if (initialData?.ledItems?.length) {
      return initialData.ledItems.map((item, idx) => calcLedItem({ ...item, tabTitle: item.tabTitle || `Item ${idx + 1}` }));
    }
    return [defaultLedItem(1)];
  });

  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Receipts
  const [receipts, setReceipts] = useState(() => initialData?.receipts || []);
  const [comment, setComment] = useState(initialData?.comment || '');

  // Options checkboxes
  const [setIgst, setSetIgst] = useState(initialData?.setIgst || false);
  const [sendWhatsApp, setSendWhatsApp] = useState(initialData?.sendWhatsApp ?? true);
  const [sendEmail, setSendEmail] = useState(initialData?.sendEmail ?? true);
  const [createInvoiceNow, setCreateInvoiceNow] = useState(initialData?.createInvoiceNow || false);

  // Right side tab
  const [activeRightTab, setActiveRightTab] = useState('Summary');
  const [discount, setDiscount] = useState(initialData?.discount || 0);
  const [roundOffEnabled, setRoundOffEnabled] = useState(initialData?.roundOffEnabled ?? false);
  const [roundOffDelta, setRoundOffDelta] = useState(initialData?.roundOffDelta || 0);

  const currentItem = items[activeItemIndex] || items[0];

  const handleCurrentItemChange = (field, value) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== activeItemIndex) return it;
        let updated = { ...it, [field]: value };

        // When itemType changes, auto-fill description, rate, and taxPercent from quotation-items if available
        if (field === 'itemType' && value) {
          const matched = quotationItemsList.find((q) => q.name.toLowerCase() === value.toLowerCase());
          if (matched) {
            if (matched.defaultRate) updated.rate = matched.defaultRate;
            if (matched.defaultTaxPercent !== undefined) updated.taxPercent = matched.defaultTaxPercent;
            if (matched.description && !updated.description) updated.description = matched.description;
          }
        }

        return calcLedItem(updated);
      })
    );
  };

  const addItemTab = () => {
    const nextIdx = items.length + 1;
    const newItem = defaultLedItem(nextIdx);
    setItems((prev) => [...prev, newItem]);
    setActiveItemIndex(items.length);
  };

  const removeItemTab = (indexToRemove, e) => {
    e.stopPropagation();
    if (items.length <= 1) {
      setItems([defaultLedItem(1)]);
      setActiveItemIndex(0);
      return;
    }
    const updated = items.filter((_, idx) => idx !== indexToRemove).map((item, idx) => ({
      ...item,
      tabTitle: `Item ${idx + 1}`,
    }));
    setItems(updated);
    setActiveItemIndex((prev) => (prev >= updated.length ? updated.length - 1 : prev));
  };

  // Receipts handlers
  const addReceipt = () => {
    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    setReceipts((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        date: today,
        mode: 'Online',
        amount: '',
        bankName: '',
        refNo: '',
      },
    ]);
  };

  const updateReceipt = (id, field, value) => {
    setReceipts((prev) =>
      prev.map((rc) => (rc.id === id ? { ...rc, [field]: value } : rc))
    );
  };

  const removeReceipt = (id) => {
    setReceipts((prev) => prev.filter((rc) => rc.id !== id));
  };

  // Totals calculations across all items
  const totalBill = items.reduce((acc, it) => acc + (parseFloat(it.finalAmount) || 0), 0);
  const totalTaxAmount = items.reduce((acc, it) => acc + (parseFloat(it.taxAmount) || 0), 0);
  const totalBaseAmount = items.reduce((acc, it) => acc + (parseFloat(it.baseAmount) || 0), 0);

  const discountNum = parseFloat(discount) || 0;
  const totalAfterDiscount = Math.max(0, totalBill - discountNum);
  const grandTotal = totalAfterDiscount;

  const autoRound = Math.round(grandTotal) - grandTotal;
  const effectiveRoundOff = roundOffEnabled ? (roundOffDelta !== 0 ? roundOffDelta : autoRound) : 0;
  const finalBill = Math.max(0, grandTotal + effectiveRoundOff);

  useEffect(() => {
    if (typeof onTotalsChange === 'function') {
      onTotalsChange({
        items,
        receipts,
        comment,
        setIgst,
        sendWhatsApp,
        sendEmail,
        createInvoiceNow,
        totalBill,
        discount: discountNum,
        grandTotal,
        effectiveRoundOff,
        finalBill,
        totalTaxAmount,
      });
    }
  }, [
    items,
    receipts,
    comment,
    setIgst,
    sendWhatsApp,
    sendEmail,
    createInvoiceNow,
    totalBill,
    discountNum,
    grandTotal,
    effectiveRoundOff,
    finalBill,
    totalTaxAmount,
  ]);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-5 space-y-6">
      {/* 1. TOP CARDS / ITEM TABS & FORM */}
      <div className="border border-gray-200 rounded-xl p-4 bg-[#fafbfc]">
        {/* Item Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-gray-200">
          {items.map((it, idx) => {
            const isActive = idx === activeItemIndex;
            return (
              <div
                key={it.id}
                onClick={() => setActiveItemIndex(idx)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-gray-300 text-gray-900 border-gray-400 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{it.tabTitle || `Item ${idx + 1}`}</span>
                <button
                  type="button"
                  onClick={(e) => removeItemTab(idx, e)}
                  className="text-red-500 hover:text-red-700 p-0.5 rounded transition-colors"
                  title="Delete Item"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={addItemTab}
            className="flex items-center gap-1 bg-[#29c5d7] hover:bg-[#20b2c3] text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>

        {/* Item Form Body (Two Column Layout matching screenshot) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
          {/* Left: Item Type Selector */}
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-gray-700 w-24">Item Type</label>
              <div className="flex-1">
                <select
                  value={currentItem?.itemType || ''}
                  onChange={(e) => handleCurrentItemChange('itemType', e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium focus:border-[#29c5d7] focus:ring-1 focus:ring-[#29c5d7] outline-none shadow-2xs"
                >
                  {itemTypeOptions.map((t) => (
                    <option key={t} value={t === 'Select Item Type' ? '' : t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right: Description, Qty, Rate, Discount, Tax, Totals */}
          <div className="lg:col-span-6 space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700">Description</label>
              <input
                type="text"
                value={currentItem?.description || ''}
                onChange={(e) => handleCurrentItemChange('description', e.target.value)}
                placeholder="Item Description / Board Specifications"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:border-[#29c5d7] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={currentItem?.qty ?? 1}
                  onChange={(e) => handleCurrentItemChange('qty', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-800 focus:bg-white focus:border-[#29c5d7] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Rate</label>
                <input
                  type="number"
                  step="any"
                  value={currentItem?.rate ?? ''}
                  onChange={(e) => handleCurrentItemChange('rate', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-700 focus:bg-white focus:border-[#29c5d7] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Discount</label>
                <input
                  type="number"
                  step="any"
                  value={currentItem?.discount ?? ''}
                  onChange={(e) => handleCurrentItemChange('discount', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:border-[#29c5d7] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Tax</label>
                <select
                  value={currentItem?.taxPercent ?? 18}
                  onChange={(e) => handleCurrentItemChange('taxPercent', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:border-[#29c5d7] outline-none"
                >
                  {TAX_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculated Values in Item Card */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-semibold">
                Tax Amount: <strong className="text-gray-800">Rs. {Number(currentItem?.taxAmount || 0).toFixed(2)}</strong>
              </span>
              <span className="text-gray-700 font-bold">
                Final Amount: <strong className="text-emerald-700 text-sm">Rs. {Number(currentItem?.finalAmount || 0).toFixed(2)}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LOWER SECTION: LEFT (RECEIPTS & ACTIONS) & RIGHT (SUMMARY/TAX/JOBCARD TABS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* LEFT COLUMN: RECEIPT + COMMENT + CHECKBOXES + SAVE/CANCEL */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addReceipt}
              className="inline-flex items-center gap-1.5 bg-[#29c5d7] hover:bg-[#20b2c3] text-white px-3.5 py-1.5 rounded-md text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <Plus size={14} /> Take Receipt
            </button>
          </div>

          {receipts.length > 0 && (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-xs text-left text-gray-700">
                <thead className="bg-gray-100/70 text-gray-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2 w-8">Sr.</th>
                    <th className="p-2">Receipt Date</th>
                    <th className="p-2">Receipt Mode</th>
                    <th className="p-2">Receipt Amount</th>
                    <th className="p-2">Bank Name/Card Type</th>
                    <th className="p-2">Cheque No/Ref.No</th>
                    <th className="p-2 w-8 text-center">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receipts.map((rc, idx) => (
                    <tr key={rc.id}>
                      <td className="p-2 text-center font-bold text-gray-500">{idx + 1}</td>
                      <td className="p-2 text-xs font-semibold">{rc.date}</td>
                      <td className="p-2">
                        <select
                          value={rc.mode}
                          onChange={(e) => updateReceipt(rc.id, 'mode', e.target.value)}
                          className="bg-white border border-gray-200 rounded-md px-1.5 py-1 text-xs outline-none"
                        >
                          <option value="Online">Online</option>
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Card">Card</option>
                          <option value="UPI">UPI</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={rc.amount}
                          onChange={(e) => updateReceipt(rc.id, 'amount', e.target.value)}
                          placeholder="Amount"
                          className="w-24 bg-white border border-gray-200 rounded-md px-2 py-1 text-xs font-bold text-emerald-600 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rc.bankName}
                          onChange={(e) => updateReceipt(rc.id, 'bankName', e.target.value)}
                          placeholder="Select Bank"
                          className="w-full bg-white border border-gray-200 rounded-md px-2 py-1 text-xs outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rc.refNo}
                          onChange={(e) => updateReceipt(rc.id, 'refNo', e.target.value)}
                          placeholder="Ref / Chq #"
                          className="w-full bg-white border border-gray-200 rounded-md px-2 py-1 text-xs outline-none"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeReceipt(rc.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600">Comment</label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comment"
              className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#29c5d7] focus:border-[#29c5d7] outline-none transition-all placeholder:text-gray-300"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-700 pt-1">
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={setIgst}
                onChange={(e) => setSetIgst(e.target.checked)}
                className="h-4 w-4 rounded-sm border-gray-300 text-[#29c5d7] focus:ring-[#29c5d7]"
              />
              Set IGST
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendWhatsApp}
                onChange={(e) => setSendWhatsApp(e.target.checked)}
                className="h-4 w-4 rounded-sm border-pink-500 text-pink-600 focus:ring-pink-500 accent-pink-500"
              />
              Send WhatsApp
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 rounded-sm border-pink-500 text-pink-600 focus:ring-pink-500 accent-pink-500"
              />
              Send Email
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createInvoiceNow}
                onChange={(e) => setCreateInvoiceNow(e.target.checked)}
                className="h-4 w-4 rounded-sm border-gray-300 text-[#29c5d7] focus:ring-[#29c5d7]"
              />
              Create Invoice Now
            </label>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-end border-b border-gray-200 gap-1 pb-1">
              {['Jobcard Details', 'Details', 'Summary'].map((tab) => {
                const isActive = activeRightTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveRightTab(tab)}
                    className={`px-3 py-1.5 text-xs font-bold transition-all rounded-t-lg select-none border-b-2 ${
                      isActive
                        ? 'border-[#29c5d7] text-[#29c5d7] bg-white border-b-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            <div className="mt-2">
              {activeRightTab === 'Jobcard Details' && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 text-center text-xs font-bold text-gray-800 border-b border-gray-200">
                    Jobcard Details
                  </div>
                  <table className="w-full text-xs text-center">
                    <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5 w-1/2 border-r border-gray-200">Parent Jobcard</th>
                        <th className="p-2.5 w-1/2">Child jobcard</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-r border-gray-200 text-gray-400 italic">None</td>
                        <td className="p-3 text-gray-400 italic">None</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeRightTab === 'Details' && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 text-center text-xs font-bold text-gray-800 border-b border-gray-200">
                    Tax Details
                  </div>
                  <table className="w-full text-xs text-center">
                    <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2 border-r border-gray-200">Tax</th>
                        <th className="p-2 border-r border-gray-200">Amount</th>
                        <th className="p-2 border-r border-gray-200">Tax Amount</th>
                        <th className="p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="p-2 border-r border-gray-200 font-semibold">GST</td>
                        <td className="p-2 border-r border-gray-200">{totalBaseAmount.toFixed(2)}</td>
                        <td className="p-2 border-r border-gray-200">{totalTaxAmount.toFixed(2)}</td>
                        <td className="p-2 font-bold">{totalBill.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeRightTab === 'Summary' && (
                <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200 text-xs">
                  <div className="flex items-center justify-between p-2.5">
                    <span className="font-bold text-gray-700">Total Bill</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Rs.</span>
                      <span className="font-bold text-gray-800 w-24 text-right">
                        {totalBill.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5">
                    <span className="font-bold text-gray-700">Discount</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0"
                        className="w-24 bg-white border border-gray-200 rounded-md px-2 py-0.5 text-right font-bold focus:border-[#29c5d7] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-gray-50/50">
                    <span className="font-bold text-gray-700">Total</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Rs.</span>
                      <span className="font-bold text-gray-800 w-24 text-right">
                        {totalAfterDiscount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5">
                    <span className="font-bold text-gray-700">Grand Total</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Rs.</span>
                      <span className="font-bold text-gray-900 w-24 text-right">
                        {grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-gray-50/30">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700">Round Off</span>
                      <input
                        type="checkbox"
                        checked={roundOffEnabled}
                        onChange={(e) => setRoundOffEnabled(e.target.checked)}
                        className="h-4 w-4 rounded-sm border-gray-300 text-[#29c5d7] focus:ring-[#29c5d7] cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => setRoundOffDelta((d) => parseFloat((d + 1).toFixed(2)))}
                          className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold border-r border-gray-200"
                        >
                          +
                        </button>
                        <input
                          type="number"
                          step="any"
                          value={roundOffDelta}
                          onChange={(e) => setRoundOffDelta(parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-0.5 text-center text-xs font-bold outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setRoundOffDelta(0)}
                          className="px-2 py-0.5 text-gray-400 hover:text-red-500 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#f0fdf4] text-emerald-900">
                    <span className="font-black text-sm uppercase">Final Bill</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold text-xs">Rs.</span>
                      <span className="font-black text-base w-28 text-right text-emerald-700">
                        {finalBill.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
