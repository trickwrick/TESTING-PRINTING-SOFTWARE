import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

const DIGITAL_MEDIA_OPTIONS = [
  'Select Media',
  '130 GSM Art Paper',
  '170 GSM Art Paper',
  '250 GSM Art Card',
  '300 GSM Art Card',
  '350 GSM Art Card',
  'Synthetic / Non-Tearable',
  'Self Adhesive Sticker',
  'Metallic Paper',
  'Texture Paper',
  'Kraft Paper',
];

const DIGITAL_SIZE_OPTIONS = [
  'Select Size',
  '12 x 18 inch',
  '13 x 19 inch',
  '12.5 x 18.5 inch',
  'A4',
  'A3',
  'Custom',
];

const SIDE_OPTIONS = [
  'Single Side (4+0)',
  'Both Side (4+4)',
];

const TAX_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '12%', value: 12 },
  { label: '18%', value: 18 },
  { label: '28%', value: 28 },
];

const defaultDigitalRow = () => ({
  id: Date.now() + Math.random(),
  description: '',
  particular: '',
  media: '',
  size: '',
  side: 'Single Side (4+0)',
  qty: 1,
  sheetQty: 1,
  hsn: '4911',
  rate: 0,
  chargesDesign: 0,
  chargesOther: 0,
  amount: 0,
  taxPercent: 18,
  taxAmount: 0,
  total: 0,
});

const calcDigitalRow = (row) => {
  const sheetQty = parseFloat(row.sheetQty) || parseFloat(row.qty) || 0;
  const rate = parseFloat(row.rate) || 0;
  const design = parseFloat(row.chargesDesign) || 0;
  const other = parseFloat(row.chargesOther) || 0;

  // Base Amount = (sheetQty * rate) + design + other
  const baseAmount = (sheetQty * rate) + design + other;

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

export default function DigitalCalculatorSection({ onTotalsChange, initialData = {} }) {
  const [rows, setRows] = useState(() => {
    if (initialData?.digitalRows?.length) {
      return initialData.digitalRows.map((r) => calcDigitalRow(r));
    }
    return [defaultDigitalRow()];
  });

  // Receipts
  const [receipts, setReceipts] = useState(() => initialData?.receipts || []);
  const [comment, setComment] = useState(initialData?.comment || '');

  // Options checkboxes
  const [setIgst, setSetIgst] = useState(initialData?.setIgst || false);
  const [sendWhatsApp, setSendWhatsApp] = useState(initialData?.sendWhatsApp || false);
  const [sendEmail, setSendEmail] = useState(initialData?.sendEmail || false);
  const [createInvoiceNow, setCreateInvoiceNow] = useState(initialData?.createInvoiceNow || false);

  // Right side tab
  const [activeRightTab, setActiveRightTab] = useState('Details'); // 'Jobcard Details' | 'Details' | 'Summary'
  const [discount, setDiscount] = useState(initialData?.discount || 0);
  const [roundOffEnabled, setRoundOffEnabled] = useState(initialData?.roundOffEnabled ?? false);
  const [roundOffDelta, setRoundOffDelta] = useState(initialData?.roundOffDelta || 0);

  // Row update
  const handleRowChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        return calcDigitalRow(updated);
      })
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, defaultDigitalRow()]);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    } else {
      setRows([defaultDigitalRow()]);
    }
  };

  // Receipt management
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
  const totalQty = rows.reduce((acc, r) => acc + (parseFloat(r.qty) || 0), 0);
  const totalSheetQty = rows.reduce((acc, r) => acc + (parseFloat(r.sheetQty) || 0), 0);
  const totalDesign = rows.reduce((acc, r) => acc + (parseFloat(r.chargesDesign) || 0), 0);
  const totalOther = rows.reduce((acc, r) => acc + (parseFloat(r.chargesOther) || 0), 0);
  const totalAmount = rows.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
  const totalTaxAmount = rows.reduce((acc, r) => acc + (parseFloat(r.taxAmount) || 0), 0);
  const totalBill = rows.reduce((acc, r) => acc + (parseFloat(r.total) || 0), 0);

  const discountNum = parseFloat(discount) || 0;
  const totalAfterDiscount = Math.max(0, totalBill - discountNum);
  const grandTotal = totalAfterDiscount;

  // Round off
  const autoRound = Math.round(grandTotal) - grandTotal;
  const effectiveRoundOff = roundOffEnabled ? (roundOffDelta !== 0 ? roundOffDelta : autoRound) : 0;
  const finalBill = Math.max(0, grandTotal + effectiveRoundOff);

  // Notify parent component
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
      {/* 1. DIGITAL ITEM TABLE */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-xs text-left text-gray-700 min-w-[1050px]">
          <thead className="bg-[#f8fafc] text-gray-800 font-bold border-b border-gray-200 uppercase text-[11px] tracking-wider text-center">
            <tr>
              <th className="p-2.5 text-left w-36">Description</th>
              <th className="p-2.5 w-32">Particular</th>
              <th className="p-2.5 w-32">Media</th>
              <th className="p-2.5 w-24">Size</th>
              <th className="p-2.5 w-28">Side</th>
              <th className="p-2.5 w-16">Qty</th>
              <th className="p-2.5 w-16">Sheet<br /><span className="text-[10px] text-gray-400 font-normal">Qty</span></th>
              <th className="p-2.5 w-20">HSN/SAC</th>
              <th className="p-2.5 w-20">Rate</th>
              <th colSpan={2} className="p-2.5 border-x border-gray-200 bg-gray-100/60">
                Charges
                <div className="flex justify-around text-[10px] text-gray-600 font-normal mt-0.5">
                  <span className="w-1/2 text-center border-r border-gray-200">Design</span>
                  <span className="w-1/2 text-center">Other</span>
                </div>
              </th>
              <th className="p-2.5 w-20">Amount</th>
              <th className="p-2.5 w-16">Tax</th>
              <th className="p-2.5 w-20">Tax Amount</th>
              <th className="p-2.5 w-20">Total</th>
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
                {/* Description */}
                <td className="p-2">
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                    placeholder="e.g. Brochure / Card"
                    className="w-full bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-[#29c5d7] focus:ring-1 focus:ring-[#29c5d7] outline-none text-xs"
                  />
                </td>
                {/* Particular */}
                <td className="p-2">
                  <input
                    type="text"
                    value={row.particular}
                    onChange={(e) => handleRowChange(row.id, 'particular', e.target.value)}
                    placeholder="e.g. Front Cover"
                    className="w-full bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-[#29c5d7] outline-none text-xs"
                  />
                </td>
                {/* Media */}
                <td className="p-2">
                  <select
                    value={row.media}
                    onChange={(e) => handleRowChange(row.id, 'media', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-1.5 py-1.5 text-xs focus:border-[#29c5d7] outline-none"
                  >
                    {DIGITAL_MEDIA_OPTIONS.map((m) => (
                      <option key={m} value={m === 'Select Media' ? '' : m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </td>
                {/* Size */}
                <td className="p-2">
                  <select
                    value={row.size}
                    onChange={(e) => handleRowChange(row.id, 'size', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-1 py-1.5 text-xs focus:border-[#29c5d7] outline-none"
                  >
                    {DIGITAL_SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s === 'Select Size' ? '' : s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                {/* Side */}
                <td className="p-2">
                  <select
                    value={row.side}
                    onChange={(e) => handleRowChange(row.id, 'side', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-1 py-1.5 text-xs focus:border-[#29c5d7] outline-none"
                  >
                    {SIDE_OPTIONS.map((sd) => (
                      <option key={sd} value={sd}>
                        {sd}
                      </option>
                    ))}
                  </select>
                </td>
                {/* Qty */}
                <td className="p-2">
                  <input
                    type="number"
                    min="1"
                    value={row.qty}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleRowChange(row.id, 'qty', val);
                      // If sheetQty equals prev qty or is 1, mirror it
                      if (!row.sheetQty || row.sheetQty === row.qty) {
                        handleRowChange(row.id, 'sheetQty', val);
                      }
                    }}
                    className="w-full bg-white border border-gray-200 rounded-md px-1 py-1.5 text-center font-bold focus:border-[#29c5d7] outline-none text-xs"
                  />
                </td>
                {/* Sheet Qty */}
                <td className="p-2">
                  <input
                    type="number"
                    min="1"
                    value={row.sheetQty}
                    onChange={(e) => handleRowChange(row.id, 'sheetQty', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-1 py-1.5 text-center font-bold text-blue-700 bg-blue-50/20 focus:border-[#29c5d7] outline-none text-xs"
                  />
                </td>
                {/* HSN/SAC */}
                <td className="p-2">
                  <input
                    type="text"
                    value={row.hsn}
                    onChange={(e) => handleRowChange(row.id, 'hsn', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-1 py-1.5 text-center focus:border-[#29c5d7] outline-none text-xs"
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
                    className="w-full bg-white border border-gray-200 rounded-md px-1 py-1.5 text-center font-semibold text-blue-700 focus:border-[#29c5d7] outline-none text-xs"
                  />
                </td>
                {/* Charges: Design */}
                <td className="p-2 border-l border-gray-200">
                  <input
                    type="number"
                    step="any"
                    value={row.chargesDesign}
                    onChange={(e) => handleRowChange(row.id, 'chargesDesign', e.target.value)}
                    placeholder="0.00"
                    className="w-16 bg-white border border-gray-200 rounded-md px-1 py-1.5 text-center text-xs focus:border-[#29c5d7] outline-none"
                  />
                </td>
                {/* Charges: Other */}
                <td className="p-2 border-r border-gray-200">
                  <input
                    type="number"
                    step="any"
                    value={row.chargesOther}
                    onChange={(e) => handleRowChange(row.id, 'chargesOther', e.target.value)}
                    placeholder="0.00"
                    className="w-16 bg-white border border-gray-200 rounded-md px-1 py-1.5 text-center text-xs focus:border-[#29c5d7] outline-none"
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
                    className="w-full bg-white border border-gray-200 rounded-md px-1 py-1.5 text-xs text-center focus:border-[#29c5d7] outline-none"
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
                {/* Total */}
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
              <td className="p-2 text-center font-black">{totalQty || '-'}</td>
              <td className="p-2 text-center font-black text-blue-700">{totalSheetQty || '-'}</td>
              <td className="p-2 text-center">-</td>
              <td className="p-2 text-center">-</td>
              <td className="p-2 text-center font-bold text-gray-600 border-l border-gray-200">{totalDesign.toFixed(2)}</td>
              <td className="p-2 text-center font-bold text-gray-600 border-r border-gray-200">{totalOther.toFixed(2)}</td>
              <td className="p-2 text-center font-black">{totalAmount.toFixed(2)}</td>
              <td className="p-2"></td>
              <td className="p-2 text-center font-black">{totalTaxAmount.toFixed(2)}</td>
              <td className="p-2 text-center font-black text-emerald-800">{totalBill.toFixed(2)}</td>
              <td className="p-2"></td>
            </tr>
          </tbody>
        </table>
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

          {/* Receipt Table */}
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

          {/* Comment Box */}
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

          {/* Checkbox Options */}
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
                className="h-4 w-4 rounded-sm border-gray-300 text-[#29c5d7] focus:ring-[#29c5d7]"
              />
              Send WhatsApp
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 rounded-sm border-gray-300 text-[#29c5d7] focus:ring-[#29c5d7]"
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

        {/* RIGHT COLUMN: TABS (Jobcard Details / Details / Summary) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            {/* Header Tabs */}
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

            {/* TAB CONTENTS */}
            <div className="mt-2">
              {/* TAB 1: Jobcard Details */}
              {activeRightTab === 'Jobcard Details' && (
                <div className="border border-gray-200 rounded-lg overflow-hidden animate-fadeIn">
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

              {/* TAB 2: Details (Tax Details) */}
              {activeRightTab === 'Details' && (
                <div className="border border-gray-200 rounded-lg overflow-hidden animate-fadeIn">
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
                        <td className="p-2 border-r border-gray-200 font-semibold">GST (Standard)</td>
                        <td className="p-2 border-r border-gray-200">{totalAmount.toFixed(2)}</td>
                        <td className="p-2 border-r border-gray-200">{totalTaxAmount.toFixed(2)}</td>
                        <td className="p-2 font-bold">{totalBill.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-gray-50 font-bold border-t border-gray-200">
                        <td className="p-2 border-r border-gray-200">Total</td>
                        <td className="p-2 border-r border-gray-200">{totalAmount.toFixed(2)}</td>
                        <td className="p-2 border-r border-gray-200">{totalTaxAmount.toFixed(2)}</td>
                        <td className="p-2 text-emerald-700">{totalBill.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: Summary */}
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
                      <span className="text-gray-400">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0.00"
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
                          title="Reset"
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
