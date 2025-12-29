import express from 'express';
import { Report } from '../models.js';  // Import the Report model

import mongoose from 'mongoose'
import { StockIn, StockOut, DeadStock } from '../models.js'

const router = express.Router();

// Create a new Report
router.post('/create', async (req, res) => {
    try {
        const { report_type, generated_by, generated_at } = req.body;

        const report = new Report({
            report_type,
            generated_by,
            generated_at,
        });

        await report.save();
        res.status(201).json(report);  // Return the newly created report
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Get all Reports
router.get('/get', async (req, res) => {
    try {
        const reports = await Report.find();  // Retrieve all reports
        res.status(200).json(reports);  // Return all reports
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Get a single Report by ID
router.get('/get/:id', async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);  // Retrieve report by ID
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });  // Report not found
        }
        res.status(200).json(report);  // Return the found report
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Update a Report
router.put('/update/:id', async (req, res) => {
    try {
        const report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });  // Update report by ID
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });  // Report not found
        }
        res.status(200).json(report);  // Return updated report
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Delete a Report
router.delete('/delete/:id', async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);  // Delete report by ID
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });  // Report not found
        }
        res.status(200).json({ message: 'Report deleted successfully' });  // Return success message
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});



router.get('/:id/stats', async (req, res) => {
  try {
    const itemId = req.params.id

    const matchConditions = [
      { item_id: itemId }, // if stored as string
    ]

    // Also match ObjectId if valid
    if (mongoose.Types.ObjectId.isValid(itemId)) {
      matchConditions.push({ item_id: new mongoose.Types.ObjectId(itemId) })
    }

    const matchQuery = { $or: matchConditions }

    // Stock In
    const stockInTotal = await StockIn.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ])

    // Stock Out
    const stockOutTotal = await StockOut.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ])

    // Dead Stock
    const deadStockTotal = await DeadStock.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ])

    // Response
    res.json({
      item_id: itemId,
      stock_in: stockInTotal[0]?.total || 0,
      stock_out: stockOutTotal[0]?.total || 0,
      dead_stock: deadStockTotal[0]?.total || 0,
      current_stock:
        (stockInTotal[0]?.total || 0) -
        (stockOutTotal[0]?.total || 0) -
        (deadStockTotal[0]?.total || 0),
    })
  } catch (err) {
    console.error('Error fetching stock stats:', err)
    res.status(500).json({ message: 'Server error' })
  }
})


// Export the router
export default router;
