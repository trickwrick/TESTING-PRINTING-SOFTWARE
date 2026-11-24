import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['FLEX', 'Digital', 'Offset', 'LED / SINAGE', 'General Items'],
  },
  name: { type: String, required: true, trim: true },
  defaultRate: { type: Number, default: 0 },
  defaultTaxPercent: { type: Number, default: 18 },
  hsn: { type: String, default: '4911' },
  unit: { type: String, default: 'PCS' },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const QuotationItem = mongoose.model('QuotationItem', quotationItemSchema);
export default QuotationItem;
