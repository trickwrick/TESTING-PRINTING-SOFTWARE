import express from 'express';
import QuotationItem from '../models/QuotationItem.js';

const router = express.Router();

const SEED_ITEMS = [
  // FLEX Media Types
  { category: 'FLEX', name: 'Frontlit Flex (Normal)', defaultRate: 8, unit: 'Sq.Ft' },
  { category: 'FLEX', name: 'Star Flex (Heavy)', defaultRate: 12, unit: 'Sq.Ft' },
  { category: 'FLEX', name: 'Backlit Flex', defaultRate: 18, unit: 'Sq.Ft' },
  { category: 'FLEX', name: 'Blackout Flex', defaultRate: 16, unit: 'Sq.Ft' },
  { category: 'FLEX', name: 'Vinyl (Normal)', defaultRate: 20, unit: 'Sq.Ft' },
  { category: 'FLEX', name: 'Vinyl (Cast / Glossy)', defaultRate: 25, unit: 'Sq.Ft' },
  { category: 'FLEX', name: 'One Way Vision', defaultRate: 35, unit: 'Sq.Ft' },
  { category: 'FLEX', name: 'Clear Film / Transparent', defaultRate: 30, unit: 'Sq.Ft' },
  { category: 'FLEX', name: 'Canvas Fabric', defaultRate: 45, unit: 'Sq.Ft' },
  { category: 'FLEX', name: 'Retro Reflective', defaultRate: 65, unit: 'Sq.Ft' },
  { category: 'FLEX', name: 'Cloth Banner', defaultRate: 22, unit: 'Sq.Ft' },
  { category: 'FLEX', name: 'Satin Fabric', defaultRate: 40, unit: 'Sq.Ft' },

  // Digital Media
  { category: 'Digital', name: '130 GSM Art Paper', defaultRate: 5, unit: 'Sheet' },
  { category: 'Digital', name: '170 GSM Art Paper', defaultRate: 7, unit: 'Sheet' },
  { category: 'Digital', name: '250 GSM Art Card', defaultRate: 10, unit: 'Sheet' },
  { category: 'Digital', name: '300 GSM Art Card', defaultRate: 12, unit: 'Sheet' },
  { category: 'Digital', name: '350 GSM Art Card', defaultRate: 15, unit: 'Sheet' },
  { category: 'Digital', name: 'Synthetic / Non-Tearable', defaultRate: 20, unit: 'Sheet' },
  { category: 'Digital', name: 'Self Adhesive Sticker', defaultRate: 18, unit: 'Sheet' },
  { category: 'Digital', name: 'Metallic Paper', defaultRate: 25, unit: 'Sheet' },
  { category: 'Digital', name: 'Texture Paper', defaultRate: 22, unit: 'Sheet' },
  { category: 'Digital', name: 'Kraft Paper', defaultRate: 14, unit: 'Sheet' },

  // Offset Items
  { category: 'Offset', name: 'Visiting Card (Offset)', defaultRate: 350, unit: 'BOX' },
  { category: 'Offset', name: 'Letterhead (Offset)', defaultRate: 850, unit: 'REAM' },
  { category: 'Offset', name: 'Envelope (Offset)', defaultRate: 1.5, unit: 'PCS' },
  { category: 'Offset', name: 'Brochure / Flyer', defaultRate: 1200, unit: 'PCS' },
  { category: 'Offset', name: 'Bill Book / Challan Book', defaultRate: 75, unit: 'BOOK' },
  { category: 'Offset', name: 'Poster (Offset)', defaultRate: 15, unit: 'PCS' },
  { category: 'Offset', name: 'Folder / File', defaultRate: 25, unit: 'PCS' },
  { category: 'Offset', name: 'Box / Packaging', defaultRate: 40, unit: 'PCS' },
  { category: 'Offset', name: 'Sticker (Offset Sheet)', defaultRate: 6, unit: 'PCS' },
  { category: 'Offset', name: 'Tags / Labels', defaultRate: 1.2, unit: 'PCS' },
  { category: 'Offset', name: 'Catalog / Booklet', defaultRate: 45, unit: 'BOOK' },
  { category: 'Offset', name: 'Calendar (Table / Wall)', defaultRate: 85, unit: 'PCS' },

  // LED / SINAGE Items
  { category: 'LED / SINAGE', name: 'Channel Letter', defaultRate: 120, unit: 'PCS' },
  { category: 'LED / SINAGE', name: 'LED Plate', defaultRate: 450, unit: 'PCS' },
  { category: 'LED / SINAGE', name: 'Acrylic LED Signage', defaultRate: 1800, unit: 'PCS' },
  { category: 'LED / SINAGE', name: 'LED Board', defaultRate: 2500, unit: 'PCS' },
  { category: 'LED / SINAGE', name: 'Acrylic Letters', defaultRate: 85, unit: 'PCS' },
  { category: 'LED / SINAGE', name: 'Acrylic Box', defaultRate: 950, unit: 'PCS' },
  { category: 'LED / SINAGE', name: 'Edge Lit Box', defaultRate: 1400, unit: 'PCS' },
  { category: 'LED / SINAGE', name: 'Neon LED Sign', defaultRate: 2200, unit: 'PCS' },
  { category: 'LED / SINAGE', name: 'Backlit LED Board', defaultRate: 3200, unit: 'PCS' },
  { category: 'LED / SINAGE', name: 'Profile Letter / 3D Letter', defaultRate: 150, unit: 'PCS' },
  { category: 'LED / SINAGE', name: 'Number Plate', defaultRate: 350, unit: 'PCS' },

  // General Items
  { category: 'General Items', name: 'Graphic Design Work', defaultRate: 250, unit: 'JOB' },
  { category: 'General Items', name: 'Photo Framing', defaultRate: 350, unit: 'PCS' },
  { category: 'General Items', name: 'Rubber Stamp', defaultRate: 150, unit: 'PCS' },
  { category: 'General Items', name: 'ID Card / Lanyard', defaultRate: 45, unit: 'SET' },
  { category: 'General Items', name: 'Mug Printing', defaultRate: 120, unit: 'PCS' },
  { category: 'General Items', name: 'T-Shirt Printing', defaultRate: 220, unit: 'PCS' },
  { category: 'General Items', name: 'Cap Printing', defaultRate: 90, unit: 'PCS' },
  { category: 'General Items', name: 'Pen Printing', defaultRate: 12, unit: 'PCS' },
  { category: 'General Items', name: 'Key Chain', defaultRate: 35, unit: 'PCS' },
  { category: 'General Items', name: 'Badge / Button Pin', defaultRate: 20, unit: 'PCS' },
  { category: 'General Items', name: 'Certificate Printing', defaultRate: 15, unit: 'PCS' },
  { category: 'General Items', name: 'Laser Cutting / Engraving', defaultRate: 500, unit: 'JOB' },
  { category: 'General Items', name: 'Packaging Tape', defaultRate: 65, unit: 'PCS' },
  { category: 'General Items', name: 'General Printing Work', defaultRate: 100, unit: 'JOB' },
];

// GET all quotation items (optionally filter by category)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const count = await QuotationItem.countDocuments();
    if (count === 0) {
      await QuotationItem.insertMany(SEED_ITEMS);
    }

    const query = { isActive: true };
    if (category) {
      query.category = category;
    }
    const items = await QuotationItem.find(query).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE a new quotation item
router.post('/', async (req, res) => {
  try {
    const { category, name, defaultRate, defaultTaxPercent, hsn, unit, description } = req.body;
    if (!category || !name) {
      return res.status(400).json({ error: 'Category and Name are required' });
    }

    const item = new QuotationItem({
      category,
      name: name.trim(),
      defaultRate: Number(defaultRate) || 0,
      defaultTaxPercent: Number(defaultTaxPercent) || 18,
      hsn: hsn || '4911',
      unit: unit || 'PCS',
      description: description || '',
    });

    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a quotation item
router.put('/:id', async (req, res) => {
  try {
    const item = await QuotationItem.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a quotation item
router.delete('/:id', async (req, res) => {
  try {
    await QuotationItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
