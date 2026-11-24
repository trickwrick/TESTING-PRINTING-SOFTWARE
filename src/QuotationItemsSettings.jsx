import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, RefreshCw, Sparkles, Layers } from 'lucide-react';
import { API_BASE_URL } from './utils/apiBase';

// Category Definitions customized exactly to the respective Estimation section fields
const CATEGORIES = [
  {
    id: 'FLEX',
    label: 'Flex',
    titleLabel: 'Media Type',
    titlePlaceholder: 'e.g. Frontlit Flex, Star Flex, Vinyl, Backlit',
    rateLabel: 'Rate Sq.Ft (₹)',
    unitLabel: 'Unit',
    defaultUnit: 'Sq.Ft',
    descLabel: 'Specifications / Micron',
    hasHsn: true,
    hasTax: true,
  },
  {
    id: 'Digital',
    label: 'Digital',
    titleLabel: 'Media',
    titlePlaceholder: 'e.g. 130 GSM Art Paper, 300 GSM Art Card, Sticker',
    rateLabel: 'Sheet Rate (₹)',
    unitLabel: 'Unit',
    defaultUnit: 'Sheet',
    descLabel: 'Paper Quality / Finish',
    hasHsn: true,
    hasTax: true,
  },
  {
    id: 'Offset',
    label: 'Offset',
    titleLabel: 'Item / Design',
    titlePlaceholder: 'e.g. Visiting Card, Letterhead, Pamphlet, Bill Book',
    rateLabel: 'Default Rate (₹)',
    unitLabel: 'Unit (PCS, BOX, BOOK, REAM)',
    defaultUnit: 'PCS',
    descLabel: 'Printing / Binding Specs',
    hasHsn: false,
    hasTax: true,
  },
  {
    id: 'LED / SINAGE',
    label: 'LED / SINAGE',
    titleLabel: 'Item Type',
    titlePlaceholder: 'e.g. Channel Letter, Acrylic LED Signage, Neon Sign, LED Board',
    rateLabel: 'Default Rate (₹)',
    unitLabel: 'Unit',
    defaultUnit: 'PCS',
    descLabel: 'Default Description / Specs',
    hasHsn: false,
    hasTax: true,
  },
  {
    id: 'General Items',
    label: 'General Items',
    titleLabel: 'Item Name',
    titlePlaceholder: 'e.g. Graphic Design Work, Photo Framing, Rubber Stamp',
    rateLabel: 'Default Rate (₹)',
    unitLabel: 'Unit',
    defaultUnit: 'PCS',
    descLabel: 'Item Specs / Details',
    hasHsn: true,
    hasTax: true,
  },
];

export default function QuotationItemsSettings() {
  const [activeCategory, setActiveCategory] = useState('FLEX');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    defaultRate: '',
    unit: 'Sq.Ft',
    hsn: '4911',
    defaultTaxPercent: 18,
    description: '',
  });

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/quotation-items`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Error loading quotation items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const currentCat = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
  const filteredItems = items.filter((item) => item.category === activeCategory);

  const handleStartAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      defaultRate: '',
      unit: currentCat.defaultUnit,
      hsn: '4911',
      defaultTaxPercent: 18,
      description: '',
    });
    setIsAdding(true);
  };

  const handleStartEdit = (item) => {
    setIsAdding(false);
    setEditingId(item._id);
    setFormData({
      name: item.name,
      defaultRate: item.defaultRate || '',
      unit: item.unit || currentCat.defaultUnit,
      hsn: item.hsn || '4911',
      defaultTaxPercent: item.defaultTaxPercent ?? 18,
      description: item.description || '',
    });
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert(`${currentCat.titleLabel} is required`);

    try {
      if (editingId) {
        const res = await fetch(`${API_BASE_URL}/api/quotation-items/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            defaultRate: Number(formData.defaultRate) || 0,
            unit: formData.unit,
            hsn: formData.hsn,
            defaultTaxPercent: Number(formData.defaultTaxPercent) || 18,
            description: formData.description,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setItems((prev) => prev.map((it) => (it._id === editingId ? updated : it)));
          handleCancelForm();
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/quotation-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: activeCategory,
            name: formData.name.trim(),
            defaultRate: Number(formData.defaultRate) || 0,
            unit: formData.unit,
            hsn: formData.hsn,
            defaultTaxPercent: Number(formData.defaultTaxPercent) || 18,
            description: formData.description,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setItems((prev) => [...prev, created]);
          handleCancelForm();
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/quotation-items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it._id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="bg-[#29c5d7] w-2 h-7 rounded-full" />
            Quotation Item Settings
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Configure section-specific items: Flex Media, Digital Media, Offset Items, LED/Signage Item Types & General Items.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadItems}
            className="p-2.5 text-gray-500 hover:text-[#29c5d7] hover:bg-gray-50 rounded-xl transition-all border border-gray-200"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleStartAdd}
            className="inline-flex items-center gap-2 bg-[#29c5d7] hover:bg-[#20b2c3] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <Plus size={16} /> Add {currentCat.titleLabel}
          </button>
        </div>
      </div>

      {/* Category Tabs (Matches Estimation Tab Styling) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="flex items-center border-b border-gray-200 overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = items.filter((it) => it.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  handleCancelForm();
                }}
                className={`relative px-6 py-3.5 text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all select-none border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#29c5d7] text-white border-[#f43f5e] shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-50'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-black ${
                    isActive ? 'bg-black/30 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {count}
                </span>
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#f43f5e]" />}
              </button>
            );
          })}
        </div>

        {/* Section Context Info Banner */}
        <div className="p-4 bg-sky-50/60 border-b border-sky-100 flex items-center justify-between text-xs text-sky-800">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-sky-600 shrink-0" />
            <span>
              Configuring <strong>{currentCat.label}</strong> section: Items added here will appear in the <strong>{currentCat.titleLabel}</strong> dropdown in Quotation / Estimate.
            </span>
          </div>
          <span className="font-bold text-sky-900">Total {currentCat.titleLabel}: {filteredItems.length}</span>
        </div>

        {/* Section Specific Add / Edit Form */}
        {(isAdding || editingId) && (
          <form onSubmit={handleSave} className="p-5 bg-gray-50/80 border-b border-gray-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-800 text-sm">
                {editingId ? `Edit ${currentCat.titleLabel}` : `Add New [${currentCat.titleLabel}] for ${currentCat.label}`}
              </h3>
              <button type="button" onClick={handleCancelForm} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Item Title / Name Field */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-700 uppercase">
                  {currentCat.titleLabel} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={currentCat.titlePlaceholder}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold focus:border-[#29c5d7] outline-none"
                />
              </div>

              {/* Rate Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 uppercase">{currentCat.rateLabel}</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={formData.defaultRate}
                  onChange={(e) => setFormData({ ...formData, defaultRate: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-blue-700 focus:border-[#29c5d7] outline-none"
                />
              </div>

              {/* Unit Field (Hidden for LED / Fixed for Flex if preferred) */}
              {activeCategory !== 'LED / SINAGE' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">{currentCat.unitLabel}</label>
                  <input
                    type="text"
                    placeholder={currentCat.defaultUnit}
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-[#29c5d7] outline-none"
                  />
                </div>
              )}

              {/* HSN Field */}
              {currentCat.hasHsn && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">HSN/SAC Code</label>
                  <input
                    type="text"
                    value={formData.hsn}
                    onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-[#29c5d7] outline-none"
                  />
                </div>
              )}

              {/* Tax Field */}
              {currentCat.hasTax && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Tax %</label>
                  <select
                    value={formData.defaultTaxPercent}
                    onChange={(e) => setFormData({ ...formData, defaultTaxPercent: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-[#29c5d7] outline-none"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              )}

              {/* Description / Extra Details Field */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-700 uppercase">{currentCat.descLabel}</label>
                <input
                  type="text"
                  placeholder="Optional details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-[#29c5d7] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-[#29c5d7] hover:bg-[#20b2c3] rounded-lg shadow-sm transition active:scale-95"
              >
                {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {/* Section Specific Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-gray-700">
            <thead className="bg-gray-100/70 text-gray-800 uppercase font-black text-[11px] border-b border-gray-200">
              <tr>
                <th className="p-3.5 w-12 text-center">#</th>
                <th className="p-3.5">{currentCat.titleLabel}</th>
                <th className="p-3.5 text-center w-32">{currentCat.rateLabel}</th>
                {activeCategory !== 'LED / SINAGE' && <th className="p-3.5 text-center w-24">Unit</th>}
                {currentCat.hasHsn && <th className="p-3.5 text-center w-24">HSN</th>}
                <th className="p-3.5 text-center w-20">Tax</th>
                <th className="p-3.5 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-semibold">
                    Loading items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                    No {currentCat.titleLabel} configured yet. Click &quot;Add {currentCat.titleLabel}&quot; above.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={item._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3 text-center font-bold text-gray-400">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-bold text-gray-900 text-sm block">{item.name}</span>
                      {item.description && <span className="text-[11px] text-gray-400 mt-0.5 block">{item.description}</span>}
                    </td>
                    <td className="p-3 text-center font-black text-blue-700 text-xs">
                      ₹ {Number(item.defaultRate || 0).toFixed(2)}
                    </td>
                    {activeCategory !== 'LED / SINAGE' && (
                      <td className="p-3 text-center font-semibold text-gray-600 uppercase text-[11px]">
                        {item.unit || currentCat.defaultUnit}
                      </td>
                    )}
                    {currentCat.hasHsn && <td className="p-3 text-center text-gray-500">{item.hsn || '-'}</td>}
                    <td className="p-3 text-center font-bold text-gray-700">{item.defaultTaxPercent ?? 18}%</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
