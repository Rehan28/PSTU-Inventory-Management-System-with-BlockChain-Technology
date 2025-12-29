import express from 'express';
import { Office } from '../models.js';  // Import the Office model

const router = express.Router();

// Create a new Office
router.post('/create', async (req, res) => {
    try {
        const { name, description, section } = req.body;

        const office = new Office({
            name,
            description,
            section,
        });

        await office.save();
        res.status(201).json(office);  // Return the newly created office
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Get all Offices
router.get('/get', async (req, res) => {
    try {
        const offices = await Office.find();  // Retrieve all offices
        res.status(200).json(offices);  // Return all offices
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Get a single Office by ID
router.get('/get/:id', async (req, res) => {
    try {
        const office = await Office.findById(req.params.id);  // Retrieve office by ID
        if (!office) {
            return res.status(404).json({ message: 'Office not found' });  // Office not found
        }
        res.status(200).json(office);  // Return the found office
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Update an Office
router.put('/update/:id', async (req, res) => {
    try {
        const office = await Office.findByIdAndUpdate(req.params.id, req.body, { new: true });  // Update office by ID
        if (!office) {
            return res.status(404).json({ message: 'Office not found' });  // Office not found
        }
        res.status(200).json(office);  // Return updated office
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Delete an Office
router.delete('/delete/:id', async (req, res) => {
    try {
        const office = await Office.findByIdAndDelete(req.params.id);  // Delete office by ID
        if (!office) {
            return res.status(404).json({ message: 'Office not found' });  // Office not found
        }
        res.status(200).json({ message: 'Office deleted successfully' });  // Return success message
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Export the router
export default router;
