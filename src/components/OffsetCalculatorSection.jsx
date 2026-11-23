import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

const OFFSET_ITEMS = [
  'Select Item',
  'Visiting Card (Offset)',
  'Letterhead (Offset)',
  'Envelope (Offset)',
  'Brochure / Flyer',
  'Bill Book / Challan Book',
  'Poster (Offset)',
  'Folder / File',
  'Box / Packaging',
  'Sticker (Offset Sheet)',
  'Tags / Labels',
  'Catalog / Booklet',
  'Calendar (Table / Wall)',
];

const TAX_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '12%', value: 12 },
  { label: '18%', value: 18 },
  { label: '28%', value: 28 },
];

const defaultOffsetRow = () => ({
  id: Date.now() + Math.random(),
  description: '',
  item: '',
  designCharges: 0,
  qty: '',
  unit: 'PCS',
  otherCharges: 0,
  discount: 0,
  amount: 0,
  taxPercent: 18,
  taxAmount: 0,
  total: 0,
});

const calcOffsetRow = (row) => {
  const qty = parseFloat(row.qty) || 0;
  const design = parseFloat(row.designCharges) || 0;
  const other = parseFloat(row.otherCharges) || 0;
  const disc = parseFloat(row.discount) || 0;

  // Base amount = Base price or user entered amount + design + other - discount
  // If user entered row.amount directly or calculated
  const basePrice = parseFloat(row.basePrice) || parseFloat(row.amount) || 0;
  const effectiveBase = basePrice + design + other - disc;
  const finalAmount = Math.max(0, effectiveBase);

  const taxPercent = parseFloat(row.taxPercent) || 0;
  const taxAmount = (finalAmount * taxPercent) / 100;
  const total = finalAmount + taxAmount;

  return {
    ...row,
    amount: parseFloat(finalAmount.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
};

export default function OffsetCalculatorSection({ onTotalsChange, initialData = {} }) {
  const [rows, setRows] = useState(() => {
    if (initialData?.offsetRows?.length) {
      return initialData.offsetRows.map((r) => calcOffsetRow(r));
    }
    return [defaultOffsetRow()];
  });

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

  const handleRowChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        return calcOffsetRow(updated);
      })
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, defaultOffsetRow()]);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    } else {
      setRows([defaultOffsetRow()]);
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
  const totalOther = rows.reduce((acc, r) => acc + (parseFloat(r.otherCharges) || 0), 0);
  const totalDesign = rows.reduce((acc, r) => acc + (parseFloat(r.designCharges) || 0), 0);
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
      {/* 1. OFFSET ITEM TABLE */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-xs text-left text-gray-700 min-w-[1000px]">
          <thead className="bg-[#f8fafc] text-gray-800 font-bold border-b border-gray-200 uppercase text-[11px] tracking-wider text-center">
            <tr>
              <th className="p-2.5 text-left w-48">Description</th>
              <th className="p-2.5 w-64 text-left">
                Item / Design
              </th>
              <th className="p-2.5 w-24">Qty</th>
              <th className="p-2.5 w-20">Unit</th>
              <th colSpan={2} className="p-2.5 border-x border-gray-200 bg-gray-100/60">
                Charges
                <div className="flex justify-around text-[10px] text-gray-600 font-normal mt-0.5">
                  <span className="w-1/2 text-center border-r border-gray-200">Other</span>
                  <span className="w-1/2 text-center">Design</span>
                </div>
              </th>
              <th className="p-2.5 w-20">Discount</th>
              <th className="p-2.5 w-20">Amount</th>
              <th className="p-2.5 w-16">Tax</th>
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
                    placeholder="e.g. 1000 Pamphlets printing"
                    className="w-full bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-[#29c5d7] focus:ring-1 focus:ring-[#29c5d7] outline-none text-xs"
                  />
                </td>

                {/* Item & Design */}
                <td className="p-2 space-y-1">
                  <select
                    value={row.item}
                    onChange={(e) => handleRowChange(row.id, 'item', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:border-[#29c5d7] outline-none"
                  >
                    {OFFSET_ITEMS.map((item) => (
                      <option key={item} value={item === 'Select Item' ? '' : item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Qty */}
                <td className="p-2">
                  <input
                    type="text"
                    value={row.qty}
                    onChange={(e) => handleRowChange(row.id, 'qty', e.target.value)}
                    placeholder="Select Qty"
                    className="w-full bg-white border border-gray-200 rounded-md px-1.5 py-1.5 text-center font-bold focus:border-[#29c5d7] outline-none text-xs"
                  />
                </td>

                {/* Unit */}
                <td className="p-2">
                  <select
                    value={row.unit}
                    onChange={(e) => handleRowChange(row.id, 'unit', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-1 py-1.5 text-xs focus:border-[#29c5d7] outline-none text-center"
                  >
                    <option value="PCS">PCS</option>
                    <option value="BOX">BOX</option>
                    <option value="BOOK">BOOK</option>
                    <option value="PAD">PAD</option>
                    <option value="SET">SET</option>
                    <option value="REAM">REAM</option>
                  </select>
                </td>

                {/* Charges: Other */}
                <td className="p-2 border-l border-gray-200">
                  <input
                    type="number"
                    step="any"
                    value={row.otherCharges}
                    onChange={(e) => handleRowChange(row.id, 'otherCharges', e.target.value)}
                    placeholder="0.00"
                    className="w-16 bg-white border border-gray-200 rounded-md px-1 py-1.5 text-center text-xs focus:border-[#29c5d7] outline-none"
                  />
                </td>

                {/* Charges: Design */}
                <td className="p-2 border-r border-gray-200">
                  <input
                    type="number"
                    step="any"
                    value={row.designCharges}
                    onChange={(e) => handleRowChange(row.id, 'designCharges', e.target.value)}
                    placeholder="0.00"
                    className="w-16 bg-white border border-gray-200 rounded-md px-1 py-1.5 text-center text-xs focus:border-[#29c5d7] outline-none"
                  />
                </td>

                {/* Discount */}
                <td className="p-2">
                  <input
                    type="number"
                    step="any"
                    value={row.discount}
                    onChange={(e) => handleRowChange(row.id, 'discount', e.target.value)}
                    placeholder="0.00"
                    className="w-16 bg-white border border-gray-200 rounded-md px-1 py-1.5 text-center text-xs focus:border-[#29c5d7] outline-none"
                  />
                </td>

                {/* Amount */}
                <td className="p-2">
                  <input
                    type="number"
                    step="any"
                    value={row.basePrice || row.amount || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleRowChange(row.id, 'basePrice', val);
                      handleRowChange(row.id, 'amount', val);
                    }}
                    placeholder="0.00"
                    className="w-20 bg-white border border-gray-200 rounded-md px-1.5 py-1.5 text-center font-bold text-gray-800 focus:border-[#29c5d7] outline-none text-xs"
                  />
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
              <td colSpan={4} className="p-2.5 text-right font-black uppercase text-xs">
                Total
              </td>
              <td className="p-2 text-center font-bold text-gray-600 border-l border-gray-200">{totalOther.toFixed(2)}</td>
              <td className="p-2 text-center font-bold text-gray-600 border-r border-gray-200">{totalDesign.toFixed(2)}</td>
              <td className="p-2 text-center font-bold text-gray-600">{totalDiscount.toFixed(2)}</td>
              <td className="p-2 text-center font-black">{totalAmount.toFixed(2)}</td>
              <td className="p-2"></td>
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
