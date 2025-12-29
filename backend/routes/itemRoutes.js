import express from 'express';
import { Item } from '../models.js';  // Import the Item model

const router = express.Router();

// Create a new Item
router.post('/create', async (req, res) => {
    try {
        const { name, description, category_id, unit, price } = req.body;

        const item = new Item({
            name,
            description,
            category_id,
            unit,
            price,
        });

        await item.save();
        res.status(201).json(item);  // Return the newly created item
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Get all Items
router.get('/get', async (req, res) => {
    try {
        const items = await Item.find();  // Retrieve all items
        res.status(200).json(items);  // Return all items
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Get a single Item by ID
router.get('/get/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);  // Retrieve item by ID
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });  // Item not found
        }
        res.status(200).json(item);  // Return the found item
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Update an Item
router.put('/update/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });  // Update item by ID
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });  // Item not found
        }
        res.status(200).json(item);  // Return updated item
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Delete an Item
router.delete('/delete/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);  // Delete item by ID
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });  // Item not found
        }
        res.status(200).json({ message: 'Item deleted successfully' });  // Return success message
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Export the router
export default router;
