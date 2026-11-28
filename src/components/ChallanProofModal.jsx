import React, { useState, useRef } from 'react';
import { Image as ImageIcon, X, UploadCloud, Check, Trash2, Eye, FileText, AlertCircle } from 'lucide-react';

/**
 * Challan Proof Image Upload & Preview Modal
 */
export default function ChallanProofModal({
  isOpen,
  onClose,
  jobCard,
  onSaveChallanProof,
}) {
  if (!isOpen || !jobCard) return null;

  const currentProof = jobCard.challanProof || {};
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(currentProof.imageUrl || null);
  const [notes, setNotes] = useState(currentProof.notes || '');
  const [operator, setOperator] = useState(currentProof.uploadedBy || 'Aakash Sharma');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [fullViewOpen, setFullViewOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    setErrorMsg('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setSelectedImage(reader.result);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    if (!imagePreview) {
      setErrorMsg('Please upload a challan proof image first.');
      return;
    }

    setIsSaving(true);
    try {
      const proofData = {
        imageUrl: imagePreview,
        uploadedAt: new Date().toISOString(),
        uploadedBy: operator.trim() || 'Aakash Sharma',
        notes: notes.trim(),
      };
      await onSaveChallanProof(proofData);
      onClose();
    } catch (err) {
      setErrorMsg('Failed to save challan proof. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to delete this challan proof image?')) return;
    setIsSaving(true);
    try {
      await onSaveChallanProof({
        imageUrl: '',
        uploadedAt: null,
        uploadedBy: '',
        notes: '',
      });
      setImagePreview(null);
      setSelectedImage(null);
      setNotes('');
    } catch (err) {
      setErrorMsg('Failed to remove challan proof.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ImageIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                Challan Proof Document
              </h2>
              {jobCard.partyName && (
                <p className="text-[11px] text-gray-400 font-medium">
                  Job #{jobCard.jobNumber} · {jobCard.partyName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-xs text-red-600">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Status Pill */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                imagePreview
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}
            >
              {imagePreview ? (
                <>
                  <Check size={12} strokeWidth={3} /> Proof Uploaded
                </>
              ) : (
                <>No Proof Uploaded</>
              )}
            </span>
          </div>

          {/* Image Preview Box if exists */}
          {imagePreview ? (
            <div className="space-y-3">
              <div className="relative group rounded-xl border border-gray-200 overflow-hidden bg-gray-50 max-h-64 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Challan Proof"
                  className="w-full h-auto max-h-64 object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFullViewOpen(true)}
                    className="p-2 bg-white/90 text-gray-800 rounded-lg hover:bg-white transition-all shadow-md flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Eye size={14} /> Full View
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white/90 text-blue-600 rounded-lg hover:bg-white transition-all shadow-md flex items-center gap-1.5 text-xs font-bold"
                  >
                    <UploadCloud size={14} /> Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="p-2 bg-white/90 text-red-600 rounded-lg hover:bg-white transition-all shadow-md flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>

              {currentProof.uploadedAt && (
                <div className="text-[11px] text-gray-400 bg-gray-50 rounded-lg p-2.5 border border-gray-100 flex items-center justify-between">
                  <span>
                    Uploaded on:{' '}
                    <strong className="text-gray-700">
                      {new Date(currentProof.uploadedAt).toLocaleString('en-IN')}
                    </strong>
                  </span>
                  {currentProof.uploadedBy && (
                    <span>By: <strong className="text-gray-700">{currentProof.uploadedBy}</strong></span>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Upload Drop Area */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                  : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50 bg-gray-50/30'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-bold text-gray-800">
                Click to browse or drag &amp; drop Challan Proof
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, JPEG, WEBP up to 10MB
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          {/* Notes Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">
              Challan Notes / Delivery Details (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received &amp; signed by security gate, Challan #408"
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Operator Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">
              Verified By
            </label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-gray-50/70 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!imagePreview || isSaving}
            onClick={handleSave}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              !imagePreview || isSaving
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            <Check size={14} />
            <span>{isSaving ? 'Saving...' : 'Save Proof'}</span>
          </button>
        </div>
      </div>

      {/* Fullscreen View Modal */}
      {fullViewOpen && imagePreview && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setFullViewOpen(false)}
        >
          <button
            onClick={() => setFullViewOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
          >
            <X size={24} />
          </button>
          <img
            src={imagePreview}
            alt="Full Proof"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
