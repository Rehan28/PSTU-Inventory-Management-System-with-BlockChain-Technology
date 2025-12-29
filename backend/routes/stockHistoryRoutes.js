import express from 'express';
import { StockHistory } from '../models.js';  // Import the StockHistory model

const router = express.Router();

// Create a new StockHistory entry
router.post('/create', async (req, res) => {
    try {
        const { item_id, action, reference_id, quantity, performed_by, date } = req.body;

        const stockHistory = new StockHistory({
            item_id,
            action,
            reference_id,
            quantity,
            performed_by,
            date,
        });

        await stockHistory.save();
        res.status(201).json(stockHistory);  // Return the newly created StockHistory entry
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Get all StockHistory entries
router.get('/get', async (req, res) => {
    try {
        const stockHistories = await StockHistory.find();  // Retrieve all StockHistory entries
        res.status(200).json(stockHistories);  // Return all StockHistory entries
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Get a single StockHistory entry by ID
router.get('/get/:id', async (req, res) => {
    try {
        const stockHistory = await StockHistory.findById(req.params.id);  // Retrieve StockHistory entry by ID
        if (!stockHistory) {
            return res.status(404).json({ message: 'StockHistory entry not found' });  // StockHistory entry not found
        }
        res.status(200).json(stockHistory);  // Return the found StockHistory entry
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Update a StockHistory entry
router.put('/update/:id', async (req, res) => {
    try {
        const stockHistory = await StockHistory.findByIdAndUpdate(req.params.id, req.body, { new: true });  // Update StockHistory entry by ID
        if (!stockHistory) {
            return res.status(404).json({ message: 'StockHistory entry not found' });  // StockHistory entry not found
        }
        res.status(200).json(stockHistory);  // Return updated StockHistory entry
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Delete a StockHistory entry
router.delete('/delete/:id', async (req, res) => {
    try {
        const stockHistory = await StockHistory.findByIdAndDelete(req.params.id);  // Delete StockHistory entry by ID
        if (!stockHistory) {
            return res.status(404).json({ message: 'StockHistory entry not found' });  // StockHistory entry not found
        }
        res.status(200).json({ message: 'StockHistory entry deleted successfully' });  // Return success message
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});



// Export the router
export default router;
