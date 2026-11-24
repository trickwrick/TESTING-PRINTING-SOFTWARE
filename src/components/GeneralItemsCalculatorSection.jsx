import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiBase';

const GENERAL_ITEMS = [
  'Select Item',
  'Graphic Design Work',
  'Photo Framing',
  'Rubber Stamp',
  'ID Card / Lanyard',
  'Mug Printing',
  'T-Shirt Printing',
  'Cap Printing',
  'Pen Printing',
  'Key Chain',
  'Badge / Button Pin',
  'Certificate Printing',
  'Laser Cutting / Engraving',
  'Packaging Tape',
  'General Printing Work',
];

const TAX_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '12%', value: 12 },
  { label: '18%', value: 18 },
  { label: '28%', value: 28 },
];

const defaultGeneralRow = () => ({
  id: Date.now() + Math.random(),
  item: '',
  hsn: '4911',
  qty: 1,
  rate: 0,
  unit: 'PCS',
  discount: 0,
  amount: 0,
  taxPercent: 18,
  taxAmount: 0,
  total: 0,
});

const calcGeneralRow = (row) => {
  const qty = parseFloat(row.qty) || 0;
  const rate = parseFloat(row.rate) || 0;
  const discount = parseFloat(row.discount) || 0;

  const baseAmount = Math.max(0, (qty * rate) - discount);
  const taxPercent = parseFloat(row.taxPercent) || 0;
  const taxAmount = (baseAmount * taxPercent) / 100;
  const total = baseAmount + taxAmount;

  return {
    ...row,
    amount: parseFloat(baseAmount.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
};

export default function GeneralItemsCalculatorSection({ onTotalsChange, initialData = {} }) {
  const [quotationItemsList, setQuotationItemsList] = useState([]);
  const [generalItemOptions, setGeneralItemOptions] = useState(GENERAL_ITEMS);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/quotation-items?category=General%20Items`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setQuotationItemsList(data);
          const names = ['Select Item', ...data.map((d) => d.name)];
          setGeneralItemOptions(names);
        }
      })
      .catch((err) => console.error('Error fetching general items:', err));
  }, []);

  const [rows, setRows] = useState(() => {
    if (initialData?.generalRows?.length) {
      return initialData.generalRows.map((r) => calcGeneralRow(r));
    }
    return [defaultGeneralRow()];
  });

  const [receipts, setReceipts] = useState(() => initialData?.receipts || []);
  const [comment, setComment] = useState(initialData?.comment || '');

  const [setIgst, setSetIgst] = useState(initialData?.setIgst || false);
  const [sendWhatsApp, setSendWhatsApp] = useState(initialData?.sendWhatsApp ?? true);
  const [sendEmail, setSendEmail] = useState(initialData?.sendEmail ?? true);
  const [createInvoiceNow, setCreateInvoiceNow] = useState(initialData?.createInvoiceNow || false);

  const [activeRightTab, setActiveRightTab] = useState('Summary');
  const [discount, setDiscount] = useState(initialData?.discount || 0);
  const [roundOffEnabled, setRoundOffEnabled] = useState(initialData?.roundOffEnabled ?? false);
  const [roundOffDelta, setRoundOffDelta] = useState(initialData?.roundOffDelta || 0);

  const handleRowChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        let updated = { ...r, [field]: value };

        // Auto-fill when item changes
        if (field === 'item' && value) {
          const matched = quotationItemsList.find((q) => q.name.toLowerCase() === value.toLowerCase());
          if (matched) {
            if (matched.defaultRate) updated.rate = matched.defaultRate;
            if (matched.hsn) updated.hsn = matched.hsn;
            if (matched.unit) updated.unit = matched.unit;
            if (matched.defaultTaxPercent !== undefined) updated.taxPercent = matched.defaultTaxPercent;
          }
        }

        return calcGeneralRow(updated);
      })
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, defaultGeneralRow()]);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    } else {
      setRows([defaultGeneralRow()]);
    }
  };

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

  // Totals calculations
  const totalDiscount = rows.reduce((acc, r) => acc + (parseFloat(r.discount) || 0), 0);
  const totalAmount = rows.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
  const totalTaxAmount = rows.reduce((acc, r) => acc + (parseFloat(r.taxAmount) || 0), 0);
  const totalBill = rows.reduce((acc, r) => acc + (parseFloat(r.total) || 0), 0);

  const discountNum = parseFloat(discount) || 0;
  const totalAfterDiscount = Math.max(0, totalBill - discountNum);
  const grandTotal = totalAfterDiscount;

  const autoRound = Math.round(grandTotal) - grandTotal;
  const effectiveRoundOff = roundOffEnabled ? (roundOffDelta !== 0 ? roundOffDelta : autoRound) : 0;
  const finalBill = Math.max(0, grandTotal + effectiveRoundOff);

  useEffect(() => {
    if (typeof onTotalsChange === 'function') {
      onTotalsChange({
        rows,
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
    rows,
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
      {/* 1. GENERAL ITEMS TABLE */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-xs text-left text-gray-700 min-w-[950px]">
          <thead className="bg-[#f8fafc] text-gray-800 font-bold border-b border-gray-200 uppercase text-[11px] tracking-wider text-center">
            <tr>
              <th className="p-2.5 text-left w-56">Item</th>
              <th className="p-2.5 w-24">HSN/SAC</th>
              <th className="p-2.5 w-20">Qty</th>
              <th className="p-2.5 w-24">Rate</th>
              <th className="p-2.5 w-24">Unit</th>
              <th className="p-2.5 w-20">Discount</th>
              <th className="p-2.5 w-24">Amount</th>
              <th className="p-2.5 w-20">Tax</th>
              <th className="p-2.5 w-24">Tax amount</th>
              <th className="p-2.5 w-24">Total amount</th>
              <th className="p-2.5 w-10 text-center">
                <button
                  type="button"
                  onClick={addRow}
                  className="bg-[#29c5d7] hover:bg-[#20b2c3] text-white p-1 rounded-md transition-all active:scale-95 inline-flex items-center justify-center"
                  title="Add Line Item"
                >
                  <Plus size={14} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                {/* Item */}
                <td className="p-2">
                  <select
                    value={row.item}
                    onChange={(e) => handleRowChange(row.id, 'item', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:border-[#29c5d7] outline-none"
                  >
                    {generalItemOptions.map((item) => (
                      <option key={item} value={item === 'Select Item' ? '' : item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </td>

                {/* HSN/SAC */}
                <td className="p-2">
                  <input
                    type="text"
                    value={row.hsn}
                    onChange={(e) => handleRowChange(row.id, 'hsn', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-1.5 py-1.5 text-center focus:border-[#29c5d7] outline-none text-xs"
                  />
                </td>

                {/* Qty */}
                <td className="p-2">
                  <input
                    type="number"
                    min="1"
                    value={row.qty}
                    onChange={(e) => handleRowChange(row.id, 'qty', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-1.5 py-1.5 text-center font-bold focus:border-[#29c5d7] outline-none text-xs"
                  />
                </td>

                {/* Rate */}
                <td className="p-2">
                  <input
                    type="number"
                    step="any"
                    value={row.rate}
                    onChange={(e) => handleRowChange(row.id, 'rate', e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border border-gray-200 rounded-md px-1.5 py-1.5 text-center font-semibold text-blue-700 focus:border-[#29c5d7] outline-none text-xs"
                  />
                </td>

                {/* Unit */}
                <td className="p-2">
                  <select
                    value={row.unit}
                    onChange={(e) => handleRowChange(row.id, 'unit', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-1.5 py-1.5 text-xs focus:border-[#29c5d7] outline-none text-center"
                  >
                    <option value="PCS">PCS</option>
                    <option value="BOX">BOX</option>
                    <option value="SET">SET</option>
                    <option value="PKG">PKG</option>
                    <option value="PAIR">PAIR</option>
                    <option value="JOB">JOB</option>
                  </select>
                </td>

                {/* Discount */}
                <td className="p-2">
                  <input
                    type="number"
                    step="any"
                    value={row.discount}
                    onChange={(e) => handleRowChange(row.id, 'discount', e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border border-gray-200 rounded-md px-1.5 py-1.5 text-center text-xs focus:border-[#29c5d7] outline-none"
                  />
                </td>

                {/* Amount */}
                <td className="p-2 text-center text-gray-800 font-bold">
                  {row.amount ? row.amount.toFixed(2) : '0.00'}
                </td>

                {/* Tax */}
                <td className="p-2">
                  <select
                    value={row.taxPercent}
                    onChange={(e) => handleRowChange(row.id, 'taxPercent', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-1.5 py-1.5 text-xs text-center focus:border-[#29c5d7] outline-none"
                  >
                    {TAX_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Tax Amount */}
                <td className="p-2 text-center text-gray-600 font-medium">
                  {row.taxAmount ? row.taxAmount.toFixed(2) : '0.00'}
                </td>

                {/* Total amount */}
                <td className="p-2 text-center text-emerald-700 font-black">
                  {row.total ? row.total.toFixed(2) : '0.00'}
                </td>

                {/* Action */}
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                    title="Remove item"
                  >
                    <X size={15} />
                  </button>
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="bg-gray-50/90 font-bold text-gray-800 border-t-2 border-gray-200">
              <td colSpan={5} className="p-2.5 text-right font-black uppercase text-xs">
                Total
              </td>
              <td className="p-2 text-center font-bold text-gray-600">{totalDiscount.toFixed(2)}</td>
              <td className="p-2 text-center font-black">{totalAmount.toFixed(2)}</td>
              <td className="p-2"></td>
              <td className="p-2 text-center font-black">{totalTaxAmount.toFixed(2)}</td>
              <td className="p-2 text-center font-black text-emerald-800">{totalBill.toFixed(2)}</td>
              <td className="p-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2. LOWER SECTION: LEFT & RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
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
                        <td className="p-2 border-r border-gray-200">{totalAmount.toFixed(2)}</td>
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
