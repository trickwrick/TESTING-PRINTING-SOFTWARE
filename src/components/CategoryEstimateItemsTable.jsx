import React from 'react';
import { fmtAmt, fmtQty, fmtRoundOff } from '../utils/taxDocumentPrint';

/**
 * Category-specific print component for Estimate & Quotation.
 * Seamlessly formats table headers, rows, columns, and totals based on whether the
 * quote belongs to FLEX, Digital, Offset, Other Items, LED / SINAGE, or General Items.
 */

// Helper to determine the effective category
export function getEstimateCategory(estimate) {
  if (!estimate) return 'FLEX';
  const cat = estimate.category || estimate.department || '';
  if (cat) return cat;
  if (estimate.flexData) return 'FLEX';
  if (estimate.digitalData) return 'Digital';
  if (estimate.offsetData) return 'Offset';
  if (estimate.otherItemsData) return 'Other Items';
  if (estimate.ledSinageData) return 'LED / SINAGE';
  if (estimate.generalItemsData) return 'General Items';
  return 'FLEX';
}

export function getCategoryColCount(category) {
  switch (category) {
    case 'FLEX':
      return 11;
    case 'Digital':
      return 11;
    case 'Offset':
      return 9;
    case 'LED / SINAGE':
      return 8;
    case 'Other Items':
      return 8;
    case 'General Items':
    default:
      return 9;
  }
}

// Colgroup definition for each category table
export function CategoryEstimateColGroup({ category }) {
  switch (category) {
    case 'FLEX':
      return (
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: '19%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
      );
    case 'Digital':
      return (
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: '17%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '9%' }} />
        </colgroup>
      );
    case 'Offset':
      return (
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: '24%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '12%' }} />
        </colgroup>
      );
    case 'LED / SINAGE':
      return (
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: '23%' }} />
          <col style={{ width: '29%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '12%' }} />
        </colgroup>
      );
    case 'Other Items':
      return (
        <colgroup>
          <col style={{ width: '5%' }} />
          <col style={{ width: '35%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '12%' }} />
        </colgroup>
      );
    case 'General Items':
    default:
      return (
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: '26%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '12%' }} />
        </colgroup>
      );
  }
}

export default function CategoryEstimateItemsTable({
  estimate,
  fallbackItems = [],
  freight = 0,
  gstAmount = 0,
  gstType = 'CGST/SGST',
  grandTotal = 0,
}) {
  const category = getEstimateCategory(estimate);
  const gstLabel = gstType === 'IGST' ? 'IGST' : 'CGST + SGST';

  let stripeIndex = 0;
  const getStripe = () => {
    const cls = stripeIndex % 2 === 0 ? 'tax-items-stripe-row tax-stripe-white' : 'tax-items-stripe-row tax-stripe-grey';
    stripeIndex += 1;
    return cls;
  };

  // 1. FLEX PRINT TABLE
  if (category === 'FLEX') {
    const rows = estimate.flexData?.rows?.length
      ? estimate.flexData.rows
      : fallbackItems.map((it, idx) => ({
          id: idx,
          description: it.description,
          mediaType: it.description,
          widthVal: '',
          heightVal: '',
          widthFt: 0,
          heightFt: 0,
          qty: it.qty,
          areaFt: it.qty,
          rateSqFt: it.rate,
          amount: it.rate * it.qty,
          includeGst: it.gstPercent > 0,
          taxPercent: it.gstPercent,
          taxAmount: it.gstAmount,
          total: it.total,
        }));

    const colCount = 11;
    const totalArea = rows.reduce((acc, r) => acc + (parseFloat(r.areaFt) || 0), 0);
    const totalQty = rows.reduce((acc, r) => acc + (parseFloat(r.qty) || 0), 0);
    const totalAmount = rows.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
    const totalGst = rows.reduce((acc, r) => acc + (parseFloat(r.taxAmount) || 0), 0);
    const totalBill = rows.reduce((acc, r) => acc + (parseFloat(r.total) || 0), 0);

    return (
      <>
        {/* Flex Header */}
        <tr className="tax-item-header-row text-center font-bold">
          <td className="tax-cell w-[4%]">#</td>
          <td className="tax-cell text-left w-[20%]">Description</td>
          <td className="tax-cell text-left w-[16%]">Media Type</td>
          <td className="tax-cell w-[9%]">Size (W x H)</td>
          <td className="tax-cell w-[7%]">Size (Ft)</td>
          <td className="tax-cell w-[5%]">Qty</td>
          <td className="tax-cell w-[8%]">Area (Sq.Ft)</td>
          <td className="tax-cell w-[8%]">Rate (₹)</td>
          <td className="tax-cell w-[9%]">Amount</td>
          <td className="tax-cell w-[6%]">GST</td>
          <td className="tax-cell w-[10%]">Total (₹)</td>
        </tr>

        {/* Flex Rows */}
        {rows.map((row, idx) => {
          const widthStr = row.widthVal ? `${row.widthVal} ${row.widthUnit || 'in'}` : '';
          const heightStr = row.heightVal ? `${row.heightVal} ${row.heightUnit || 'in'}` : '';
          const sizeStr = widthStr && heightStr ? `${widthStr} x ${heightStr}` : '-';
          const sizeFtStr = (row.widthFt || row.heightFt) ? `${row.widthFt || 0} x ${row.heightFt || 0}` : '-';

          return (
            <tr key={row.id || idx} className={`tax-item-main-row ${getStripe()}`}>
              <td className="tax-cell text-center align-middle font-bold text-gray-500">{idx + 1}</td>
              <td className="tax-cell align-middle font-semibold text-gray-900">
                {row.description || 'Flex Printing Banner'}
              </td>
              <td className="tax-cell align-middle text-gray-800">
                <span className="font-bold text-[#0284c7]">{row.mediaType || 'Frontlit Flex'}</span>
                {row.hsn && <span className="text-[9px] text-gray-400 block font-normal">HSN: {row.hsn}</span>}
              </td>
              <td className="tax-cell text-center align-middle text-[10px] font-medium">{sizeStr}</td>
              <td className="tax-cell text-center align-middle text-[10px] text-gray-600">{sizeFtStr}</td>
              <td className="tax-cell text-center align-middle font-bold text-gray-800">{fmtQty(row.qty)}</td>
              <td className="tax-cell text-center align-middle font-bold text-indigo-700 bg-indigo-50/20">
                {Number(row.areaFt || 0).toFixed(2)}
              </td>
              <td className="tax-cell text-center align-middle font-semibold text-blue-700">
                {fmtAmt(row.rateSqFt)}
              </td>
              <td className="tax-cell text-right align-middle font-bold">{fmtAmt(row.amount)}</td>
              <td className="tax-cell text-center align-middle text-[10px]">
                {row.includeGst ? `${row.taxPercent || 18}%` : '0%'}
              </td>
              <td className="tax-cell text-right align-middle font-black text-gray-900">{fmtAmt(row.total)}</td>
            </tr>
          );
        })}

        {/* Subtotal & Extra rows */}
        <tr className="tax-item-grand-total-row font-bold bg-gray-50/60">
          <td className="tax-cell text-center font-bold text-gray-500">&nbsp;</td>
          <td className="tax-cell font-black text-right uppercase text-[10px]" colSpan={4}>Flex Total:</td>
          <td className="tax-cell text-center font-black">{fmtQty(totalQty)}</td>
          <td className="tax-cell text-center font-black text-indigo-800">{totalArea.toFixed(2)}</td>
          <td className="tax-cell">&nbsp;</td>
          <td className="tax-cell text-right font-black">{fmtAmt(totalAmount)}</td>
          <td className="tax-cell text-center font-bold text-gray-600 text-[10px]">{fmtAmt(totalGst)}</td>
          <td className="tax-cell text-right font-black text-gray-900">{fmtAmt(totalBill)} ₹</td>
        </tr>

        {freight > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">Freight / Transport Charges</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtAmt(freight)} ₹</td>
          </tr>
        )}

        {estimate.flexData?.discount > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold text-red-600">Discount</td>
            <td colSpan={2} className="tax-cell text-right font-black text-red-600">- {fmtAmt(estimate.flexData.discount)} ₹</td>
          </tr>
        )}

        {gstAmount > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">{gstLabel}</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtAmt(gstAmount)} ₹</td>
          </tr>
        )}

        {estimate.flexData?.effectiveRoundOff !== 0 && estimate.flexData?.effectiveRoundOff !== undefined && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">Round Off</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtRoundOff(estimate.flexData.effectiveRoundOff)}</td>
          </tr>
        )}

        <tr className="tax-item-grand-total-row font-black text-sm bg-orange-50/50">
          <td colSpan={colCount - 2} className="tax-cell text-right font-black uppercase tracking-wider text-orange-950">
            Grand Total (Final Bill):
          </td>
          <td colSpan={2} className="tax-cell text-right font-black text-emerald-800 text-base">
            {fmtAmt(grandTotal || estimate.totalAmount)} ₹
          </td>
        </tr>
      </>
    );
  }

  // 2. DIGITAL PRINT TABLE
  if (category === 'Digital') {
    const rows = estimate.digitalData?.rows?.length
      ? estimate.digitalData.rows
      : fallbackItems.map((it, idx) => ({
          id: idx,
          description: it.description,
          particular: '',
          media: it.description,
          size: '',
          side: 'Single Side',
          qty: it.qty,
          sheetQty: it.qty,
          rate: it.rate,
          chargesDesign: 0,
          chargesOther: 0,
          amount: it.rate * it.qty,
          taxPercent: it.gstPercent,
          taxAmount: it.gstAmount,
          total: it.total,
        }));

    const colCount = 11;
    const totalQty = rows.reduce((acc, r) => acc + (parseFloat(r.qty) || 0), 0);
    const totalSheets = rows.reduce((acc, r) => acc + (parseFloat(r.sheetQty) || parseFloat(r.qty) || 0), 0);
    const totalBase = rows.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
    const totalBill = rows.reduce((acc, r) => acc + (parseFloat(r.total) || 0), 0);

    return (
      <>
        {/* Digital Header */}
        <tr className="tax-item-header-row text-center font-bold">
          <td className="tax-cell w-[4%]">#</td>
          <td className="tax-cell text-left w-[18%]">Description / Particular</td>
          <td className="tax-cell text-left w-[16%]">Media (Paper)</td>
          <td className="tax-cell w-[9%]">Size</td>
          <td className="tax-cell w-[11%]">Side</td>
          <td className="tax-cell w-[6%]">Qty</td>
          <td className="tax-cell w-[7%]">Sheets</td>
          <td className="tax-cell w-[7%]">Rate</td>
          <td className="tax-cell w-[8%]">Charges</td>
          <td className="tax-cell w-[5%]">GST</td>
          <td className="tax-cell w-[9%]">Total (₹)</td>
        </tr>

        {/* Digital Rows */}
        {rows.map((row, idx) => {
          const extraCharges = (parseFloat(row.chargesDesign) || 0) + (parseFloat(row.chargesOther) || 0);
          return (
            <tr key={row.id || idx} className={`tax-item-main-row ${getStripe()}`}>
              <td className="tax-cell text-center align-middle font-bold text-gray-500">{idx + 1}</td>
              <td className="tax-cell align-middle">
                <span className="font-bold text-gray-900 block">{row.description || 'Digital Print Job'}</span>
                {row.particular && <span className="text-[10px] text-gray-500 italic block">{row.particular}</span>}
              </td>
              <td className="tax-cell align-middle">
                <span className="font-bold text-[#0284c7]">{row.media || 'Art Paper'}</span>
                {row.hsn && <span className="text-[9px] text-gray-400 block">HSN: {row.hsn}</span>}
              </td>
              <td className="tax-cell text-center align-middle text-[10px] font-medium">{row.size || '-'}</td>
              <td className="tax-cell text-center align-middle text-[10px] font-semibold text-gray-700">{row.side || '-'}</td>
              <td className="tax-cell text-center align-middle font-bold text-gray-800">{fmtQty(row.qty)}</td>
              <td className="tax-cell text-center align-middle font-black text-indigo-700 bg-indigo-50/20">
                {fmtQty(row.sheetQty || row.qty)}
              </td>
              <td className="tax-cell text-center align-middle font-semibold text-blue-700">{fmtAmt(row.rate)}</td>
              <td className="tax-cell text-center align-middle text-[10px] text-gray-600">
                {extraCharges > 0 ? `₹ ${extraCharges}` : '-'}
              </td>
              <td className="tax-cell text-center align-middle text-[10px]">{row.taxPercent ?? 18}%</td>
              <td className="tax-cell text-right align-middle font-black text-gray-900">{fmtAmt(row.total)}</td>
            </tr>
          );
        })}

        {/* Total summary row */}
        <tr className="tax-item-grand-total-row font-bold bg-gray-50/60">
          <td className="tax-cell text-center font-bold text-gray-500">&nbsp;</td>
          <td className="tax-cell font-black text-right uppercase text-[10px]" colSpan={4}>Digital Total:</td>
          <td className="tax-cell text-center font-black">{fmtQty(totalQty)}</td>
          <td className="tax-cell text-center font-black text-indigo-800">{fmtQty(totalSheets)}</td>
          <td className="tax-cell">&nbsp;</td>
          <td className="tax-cell text-center font-semibold text-[10px]">{fmtAmt(totalBase)}</td>
          <td className="tax-cell">&nbsp;</td>
          <td className="tax-cell text-right font-black text-gray-900">{fmtAmt(totalBill)} ₹</td>
        </tr>

        {freight > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">Freight / Transport Charges</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtAmt(freight)} ₹</td>
          </tr>
        )}

        {estimate.digitalData?.discount > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold text-red-600">Discount</td>
            <td colSpan={2} className="tax-cell text-right font-black text-red-600">- {fmtAmt(estimate.digitalData.discount)} ₹</td>
          </tr>
        )}

        {gstAmount > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">{gstLabel}</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtAmt(gstAmount)} ₹</td>
          </tr>
        )}

        {estimate.digitalData?.effectiveRoundOff !== 0 && estimate.digitalData?.effectiveRoundOff !== undefined && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">Round Off</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtRoundOff(estimate.digitalData.effectiveRoundOff)}</td>
          </tr>
        )}

        <tr className="tax-item-grand-total-row font-black text-sm bg-orange-50/50">
          <td colSpan={colCount - 2} className="tax-cell text-right font-black uppercase tracking-wider text-orange-950">
            Grand Total (Final Bill):
          </td>
          <td colSpan={2} className="tax-cell text-right font-black text-emerald-800 text-base">
            {fmtAmt(grandTotal || estimate.totalAmount)} ₹
          </td>
        </tr>
      </>
    );
  }

  // 3. OFFSET PRINT TABLE
  if (category === 'Offset') {
    const rows = estimate.offsetData?.rows?.length
      ? estimate.offsetData.rows
      : fallbackItems.map((it, idx) => ({
          id: idx,
          description: it.description,
          item: it.description,
          qty: it.qty,
          unit: it.per || 'PCS',
          designCharges: 0,
          otherCharges: 0,
          discount: 0,
          amount: it.rate,
          taxPercent: it.gstPercent,
          taxAmount: it.gstAmount,
          total: it.total,
        }));

    const colCount = 9;
    const totalQty = rows.reduce((acc, r) => acc + (parseFloat(r.qty) || 0), 0);
    const totalDiscount = rows.reduce((acc, r) => acc + (parseFloat(r.discount) || 0), 0);
    const totalAmount = rows.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
    const totalBill = rows.reduce((acc, r) => acc + (parseFloat(r.total) || 0), 0);

    return (
      <>
        {/* Offset Header */}
        <tr className="tax-item-header-row text-center font-bold">
          <td className="tax-cell w-[4%]">#</td>
          <td className="tax-cell text-left w-[24%]">Description</td>
          <td className="tax-cell text-left w-[20%]">Item / Design</td>
          <td className="tax-cell w-[8%]">Qty</td>
          <td className="tax-cell w-[8%]">Unit</td>
          <td className="tax-cell w-[9%]">Charges</td>
          <td className="tax-cell w-[8%]">Discount</td>
          <td className="tax-cell w-[7%]">GST</td>
          <td className="tax-cell w-[12%]">Total (₹)</td>
        </tr>

        {/* Offset Rows */}
        {rows.map((row, idx) => {
          const designChg = parseFloat(row.designCharges) || 0;
          const otherChg = parseFloat(row.otherCharges) || 0;
          const totalChg = designChg + otherChg;

          return (
            <tr key={row.id || idx} className={`tax-item-main-row ${getStripe()}`}>
              <td className="tax-cell text-center align-middle font-bold text-gray-500">{idx + 1}</td>
              <td className="tax-cell align-middle font-semibold text-gray-900">
                {row.description || 'Offset Printing Job'}
              </td>
              <td className="tax-cell align-middle font-bold text-[#0284c7]">
                {row.item || 'Visiting Card'}
              </td>
              <td className="tax-cell text-center align-middle font-black text-gray-800">{fmtQty(row.qty)}</td>
              <td className="tax-cell text-center align-middle font-bold text-gray-600 text-[10px]">{row.unit || 'PCS'}</td>
              <td className="tax-cell text-center align-middle text-[10px] text-gray-700">
                {totalChg > 0 ? (
                  <span>
                    ₹ {totalChg}
                    {designChg > 0 && <span className="block text-[9px] text-gray-400">Des: ₹{designChg}</span>}
                  </span>
                ) : '-'}
              </td>
              <td className="tax-cell text-center align-middle text-[10px] font-semibold text-red-600">
                {row.discount > 0 ? `₹ ${row.discount}` : '-'}
              </td>
              <td className="tax-cell text-center align-middle text-[10px]">{row.taxPercent ?? 18}%</td>
              <td className="tax-cell text-right align-middle font-black text-gray-900">{fmtAmt(row.total || row.amount)}</td>
            </tr>
          );
        })}

        {/* Total summary row */}
        <tr className="tax-item-grand-total-row font-bold bg-gray-50/60">
          <td className="tax-cell text-center font-bold text-gray-500">&nbsp;</td>
          <td className="tax-cell font-black text-right uppercase text-[10px]" colSpan={2}>Offset Total:</td>
          <td className="tax-cell text-center font-black">{fmtQty(totalQty)}</td>
          <td className="tax-cell">&nbsp;</td>
          <td className="tax-cell">&nbsp;</td>
          <td className="tax-cell text-center font-bold text-red-600 text-[10px]">
            {totalDiscount > 0 ? `₹ ${totalDiscount.toFixed(2)}` : '-'}
          </td>
          <td className="tax-cell">&nbsp;</td>
          <td className="tax-cell text-right font-black text-gray-900">{fmtAmt(totalBill)} ₹</td>
        </tr>

        {freight > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">Freight / Transport Charges</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtAmt(freight)} ₹</td>
          </tr>
        )}

        {estimate.offsetData?.discount > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold text-red-600">Special Discount</td>
            <td colSpan={2} className="tax-cell text-right font-black text-red-600">- {fmtAmt(estimate.offsetData.discount)} ₹</td>
          </tr>
        )}

        {gstAmount > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">{gstLabel}</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtAmt(gstAmount)} ₹</td>
          </tr>
        )}

        {estimate.offsetData?.effectiveRoundOff !== 0 && estimate.offsetData?.effectiveRoundOff !== undefined && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">Round Off</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtRoundOff(estimate.offsetData.effectiveRoundOff)}</td>
          </tr>
        )}

        <tr className="tax-item-grand-total-row font-black text-sm bg-orange-50/50">
          <td colSpan={colCount - 2} className="tax-cell text-right font-black uppercase tracking-wider text-orange-950">
            Grand Total (Final Bill):
          </td>
          <td colSpan={2} className="tax-cell text-right font-black text-emerald-800 text-base">
            {fmtAmt(grandTotal || estimate.totalAmount)} ₹
          </td>
        </tr>
      </>
    );
  }

  // 4. LED / SINAGE PRINT TABLE
  if (category === 'LED / SINAGE') {
    const items = estimate.ledSinageData?.items?.length
      ? estimate.ledSinageData.items
      : fallbackItems.map((it, idx) => ({
          id: idx,
          itemType: it.description,
          description: it.descriptionNote,
          qty: it.qty,
          rate: it.rate,
          discount: 0,
          taxPercent: it.gstPercent,
          taxAmount: it.gstAmount,
          finalAmount: it.total,
        }));

    const colCount = 8;
    const totalQty = items.reduce((acc, it) => acc + (parseFloat(it.qty) || 0), 0);
    const totalDiscount = items.reduce((acc, it) => acc + (parseFloat(it.discount) || 0), 0);
    const totalBill = items.reduce((acc, it) => acc + (parseFloat(it.finalAmount) || 0), 0);

    return (
      <>
        {/* LED / SINAGE Header */}
        <tr className="tax-item-header-row text-center font-bold">
          <td className="tax-cell w-[4%]">#</td>
          <td className="tax-cell text-left w-[24%]">Item Type</td>
          <td className="tax-cell text-left w-[28%]">Description / Board Specifications</td>
          <td className="tax-cell w-[7%]">Qty</td>
          <td className="tax-cell w-[10%]">Rate (₹)</td>
          <td className="tax-cell w-[8%]">Discount</td>
          <td className="tax-cell w-[7%]">GST</td>
          <td className="tax-cell w-[12%]">Final Amount (₹)</td>
        </tr>

        {/* LED Rows */}
        {items.map((it, idx) => (
          <tr key={it.id || idx} className={`tax-item-main-row ${getStripe()}`}>
            <td className="tax-cell text-center align-middle font-bold text-gray-500">{idx + 1}</td>
            <td className="tax-cell align-middle">
              <span className="font-bold text-[#0284c7] block">{it.itemType || 'LED Signage'}</span>
            </td>
            <td className="tax-cell align-middle text-gray-800 font-medium">
              {it.description || '-'}
            </td>
            <td className="tax-cell text-center align-middle font-black text-gray-800">{fmtQty(it.qty)}</td>
            <td className="tax-cell text-center align-middle font-semibold text-blue-700">{fmtAmt(it.rate)}</td>
            <td className="tax-cell text-center align-middle text-[10px] text-red-600 font-semibold">
              {it.discount > 0 ? `₹ ${it.discount}` : '-'}
            </td>
            <td className="tax-cell text-center align-middle text-[10px]">{it.taxPercent ?? 18}%</td>
            <td className="tax-cell text-right align-middle font-black text-gray-900">{fmtAmt(it.finalAmount)}</td>
          </tr>
        ))}

        {/* Total summary row */}
        <tr className="tax-item-grand-total-row font-bold bg-gray-50/60">
          <td className="tax-cell text-center font-bold text-gray-500">&nbsp;</td>
          <td className="tax-cell font-black text-right uppercase text-[10px]" colSpan={2}>LED / Signage Total:</td>
          <td className="tax-cell text-center font-black">{fmtQty(totalQty)}</td>
          <td className="tax-cell">&nbsp;</td>
          <td className="tax-cell text-center font-bold text-red-600 text-[10px]">
            {totalDiscount > 0 ? `₹ ${totalDiscount.toFixed(2)}` : '-'}
          </td>
          <td className="tax-cell">&nbsp;</td>
          <td className="tax-cell text-right font-black text-gray-900">{fmtAmt(totalBill)} ₹</td>
        </tr>

        {freight > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">Freight / Transport Charges</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtAmt(freight)} ₹</td>
          </tr>
        )}

        {estimate.ledSinageData?.discount > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold text-red-600">Special Discount</td>
            <td colSpan={2} className="tax-cell text-right font-black text-red-600">- {fmtAmt(estimate.ledSinageData.discount)} ₹</td>
          </tr>
        )}

        {gstAmount > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">{gstLabel}</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtAmt(gstAmount)} ₹</td>
          </tr>
        )}

        {estimate.ledSinageData?.effectiveRoundOff !== 0 && estimate.ledSinageData?.effectiveRoundOff !== undefined && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">Round Off</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtRoundOff(estimate.ledSinageData.effectiveRoundOff)}</td>
          </tr>
        )}

        <tr className="tax-item-grand-total-row font-black text-sm bg-orange-50/50">
          <td colSpan={colCount - 2} className="tax-cell text-right font-black uppercase tracking-wider text-orange-950">
            Grand Total (Final Bill):
          </td>
          <td colSpan={2} className="tax-cell text-right font-black text-emerald-800 text-base">
            {fmtAmt(grandTotal || estimate.totalAmount)} ₹
          </td>
        </tr>
      </>
    );
  }

  // 5. OTHER ITEMS PRINT TABLE
  if (category === 'Other Items') {
    const rows = estimate.otherItemsData?.rows?.length
      ? estimate.otherItemsData.rows
      : fallbackItems.map((it, idx) => ({
          id: idx,
          description: it.description,
          hsn: it.hsn,
          qty: it.qty,
          rate: it.rate,
          amount: it.rate * it.qty,
          taxPercent: it.gstPercent,
          taxAmount: it.gstAmount,
          total: it.total,
        }));

    const colCount = 8;
    const totalQty = rows.reduce((acc, r) => acc + (parseFloat(r.qty) || 0), 0);
    const totalAmount = rows.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
    const totalBill = rows.reduce((acc, r) => acc + (parseFloat(r.total) || 0), 0);

    return (
      <>
        {/* Other Items Header */}
        <tr className="tax-item-header-row text-center font-bold">
          <td className="tax-cell w-[5%]">#</td>
          <td className="tax-cell text-left w-[35%]">Description</td>
          <td className="tax-cell w-[12%]">HSN/SAC</td>
          <td className="tax-cell w-[8%]">Qty</td>
          <td className="tax-cell w-[10%]">Rate (₹)</td>
          <td className="tax-cell w-[10%]">Amount</td>
          <td className="tax-cell w-[8%]">GST</td>
          <td className="tax-cell w-[12%]">Total (₹)</td>
        </tr>

        {/* Other Items Rows */}
        {rows.map((row, idx) => (
          <tr key={row.id || idx} className={`tax-item-main-row ${getStripe()}`}>
            <td className="tax-cell text-center align-middle font-bold text-gray-500">{idx + 1}</td>
            <td className="tax-cell align-middle font-semibold text-gray-900">{row.description || 'Other Item'}</td>
            <td className="tax-cell text-center align-middle text-gray-600">{row.hsn || '-'}</td>
            <td className="tax-cell text-center align-middle font-bold text-gray-800">{fmtQty(row.qty)}</td>
            <td className="tax-cell text-center align-middle font-semibold text-blue-700">{fmtAmt(row.rate)}</td>
            <td className="tax-cell text-right align-middle font-bold">{fmtAmt(row.amount)}</td>
            <td className="tax-cell text-center align-middle text-[10px]">{row.taxPercent ?? 18}%</td>
            <td className="tax-cell text-right align-middle font-black text-gray-900">{fmtAmt(row.total)}</td>
          </tr>
        ))}

        {/* Total summary row */}
        <tr className="tax-item-grand-total-row font-bold bg-gray-50/60">
          <td className="tax-cell text-center font-bold text-gray-500">&nbsp;</td>
          <td className="tax-cell font-black text-right uppercase text-[10px]" colSpan={2}>Other Items Total:</td>
          <td className="tax-cell text-center font-black">{fmtQty(totalQty)}</td>
          <td className="tax-cell">&nbsp;</td>
          <td className="tax-cell text-right font-black">{fmtAmt(totalAmount)}</td>
          <td className="tax-cell">&nbsp;</td>
          <td className="tax-cell text-right font-black text-gray-900">{fmtAmt(totalBill)} ₹</td>
        </tr>

        {freight > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">Freight / Transport Charges</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtAmt(freight)} ₹</td>
          </tr>
        )}

        {estimate.otherItemsData?.discount > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold text-red-600">Special Discount</td>
            <td colSpan={2} className="tax-cell text-right font-black text-red-600">- {fmtAmt(estimate.otherItemsData.discount)} ₹</td>
          </tr>
        )}

        {gstAmount > 0 && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">{gstLabel}</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtAmt(gstAmount)} ₹</td>
          </tr>
        )}

        {estimate.otherItemsData?.effectiveRoundOff !== 0 && estimate.otherItemsData?.effectiveRoundOff !== undefined && (
          <tr className={`tax-item-sub-row ${getStripe()}`}>
            <td colSpan={colCount - 2} className="tax-cell text-right font-bold">Round Off</td>
            <td colSpan={2} className="tax-cell text-right font-black">{fmtRoundOff(estimate.otherItemsData.effectiveRoundOff)}</td>
          </tr>
        )}

        <tr className="tax-item-grand-total-row font-black text-sm bg-orange-50/50">
          <td colSpan={colCount - 2} className="tax-cell text-right font-black uppercase tracking-wider text-orange-950">
            Grand Total (Final Bill):
          </td>
          <td colSpan={2} className="tax-cell text-right font-black text-emerald-800 text-base">
            {fmtAmt(grandTotal || estimate.totalAmount)} ₹
          </td>
        </tr>
      </>
    );
  }

  // 6. GENERAL ITEMS PRINT TABLE (Default)
  const rows = estimate.generalItemsData?.rows?.length
    ? estimate.generalItemsData.rows
    : fallbackItems.map((it, idx) => ({
        id: idx,
        item: it.description,
        hsn: it.hsn,
        qty: it.qty,
        rate: it.rate,
        unit: it.per || 'PCS',
        discount: 0,
        amount: it.rate * it.qty,
        taxPercent: it.gstPercent,
        taxAmount: it.gstAmount,
        total: it.total,
      }));

  const colCount = 9;
  const totalQty = rows.reduce((acc, r) => acc + (parseFloat(r.qty) || 0), 0);
  const totalDiscount = rows.reduce((acc, r) => acc + (parseFloat(r.discount) || 0), 0);
  const totalAmount = rows.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
  const totalBill = rows.reduce((acc, r) => acc + (parseFloat(r.total) || 0), 0);

  return (
    <>
      {/* General Items Header */}
      <tr className="tax-item-header-row text-center font-bold">
        <td className="tax-cell w-[4%]">#</td>
        <td className="tax-cell text-left w-[26%]">Item</td>
        <td className="tax-cell w-[11%]">HSN/SAC</td>
        <td className="tax-cell w-[7%]">Qty</td>
        <td className="tax-cell w-[10%]">Rate (₹)</td>
        <td className="tax-cell w-[7%]">Unit</td>
        <td className="tax-cell w-[8%]">Discount</td>
        <td className="tax-cell w-[7%]">GST</td>
        <td className="tax-cell w-[12%]">Total (₹)</td>
      </tr>

      {/* General Items Rows */}
      {rows.map((row, idx) => (
        <tr key={row.id || idx} className={`tax-item-main-row ${getStripe()}`}>
          <td className="tax-cell text-center align-middle font-bold text-gray-500">{idx + 1}</td>
          <td className="tax-cell align-middle font-bold text-gray-900">{row.item || 'General Item'}</td>
          <td className="tax-cell text-center align-middle text-gray-600">{row.hsn || '-'}</td>
          <td className="tax-cell text-center align-middle font-black text-gray-800">{fmtQty(row.qty)}</td>
          <td className="tax-cell text-center align-middle font-semibold text-blue-700">{fmtAmt(row.rate)}</td>
          <td className="tax-cell text-center align-middle font-bold text-gray-600 text-[10px]">{row.unit || 'PCS'}</td>
          <td className="tax-cell text-center align-middle text-[10px] text-red-600 font-semibold">
            {row.discount > 0 ? `₹ ${row.discount}` : '-'}
          </td>
          <td className="tax-cell text-center align-middle text-[10px]">{row.taxPercent ?? 18}%</td>
          <td className="tax-cell text-right align-middle font-black text-gray-900">{fmtAmt(row.total)}</td>
        </tr>
      ))}

      {/* Total summary row */}
      <tr className="tax-item-grand-total-row font-bold bg-gray-50/60">
        <td className="tax-cell text-center font-bold text-gray-500">&nbsp;</td>
        <td className="tax-cell font-black text-right uppercase text-[10px]" colSpan={2}>General Total:</td>
        <td className="tax-cell text-center font-black">{fmtQty(totalQty)}</td>
        <td className="tax-cell">&nbsp;</td>
        <td className="tax-cell">&nbsp;</td>
        <td className="tax-cell text-center font-bold text-red-600 text-[10px]">
          {totalDiscount > 0 ? `₹ ${totalDiscount.toFixed(2)}` : '-'}
        </td>
        <td className="tax-cell">&nbsp;</td>
        <td className="tax-cell text-right font-black text-gray-900">{fmtAmt(totalBill)} ₹</td>
      </tr>

      {freight > 0 && (
        <tr className={`tax-item-sub-row ${getStripe()}`}>
          <td colSpan={colCount - 2} className="tax-cell text-right font-bold">Freight / Transport Charges</td>
          <td colSpan={2} className="tax-cell text-right font-black">{fmtAmt(freight)} ₹</td>
        </tr>
      )}

      {estimate.generalItemsData?.discount > 0 && (
        <tr className={`tax-item-sub-row ${getStripe()}`}>
          <td colSpan={colCount - 2} className="tax-cell text-right font-bold text-red-600">Special Discount</td>
          <td colSpan={2} className="tax-cell text-right font-black text-red-600">- {fmtAmt(estimate.generalItemsData.discount)} ₹</td>
        </tr>
      )}

      {gstAmount > 0 && (
        <tr className={`tax-item-sub-row ${getStripe()}`}>
          <td colSpan={colCount - 2} className="tax-cell text-right font-bold">{gstLabel}</td>
          <td colSpan={2} className="tax-cell text-right font-black">{fmtAmt(gstAmount)} ₹</td>
        </tr>
      )}

      {estimate.generalItemsData?.effectiveRoundOff !== 0 && estimate.generalItemsData?.effectiveRoundOff !== undefined && (
        <tr className={`tax-item-sub-row ${getStripe()}`}>
          <td colSpan={colCount - 2} className="tax-cell text-right font-bold">Round Off</td>
          <td colSpan={2} className="tax-cell text-right font-black">{fmtRoundOff(estimate.generalItemsData.effectiveRoundOff)}</td>
        </tr>
      )}

      <tr className="tax-item-grand-total-row font-black text-sm bg-orange-50/50">
        <td colSpan={colCount - 2} className="tax-cell text-right font-black uppercase tracking-wider text-orange-950">
          Grand Total (Final Bill):
        </td>
        <td colSpan={2} className="tax-cell text-right font-black text-emerald-800 text-base">
          {fmtAmt(grandTotal || estimate.totalAmount)} ₹
        </td>
      </tr>
    </>
  );
}
