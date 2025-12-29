import express from 'express';
import { Supplier } from '../models.js';  // Import the Supplier model

const router = express.Router();

// Create a new Supplier
router.post('/create', async (req, res) => {
    try {
        const { name, contactPerson, phone, email, address } = req.body;

        const supplier = new Supplier({
            name,
            contactPerson,
            phone,
            email,
            address
        });

        await supplier.save();
        res.status(201).json(supplier);  // Return the newly created supplier
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Get all Suppliers
router.get('/get', async (req, res) => {
    try {
        const suppliers = await Supplier.find();  // Retrieve all suppliers
        res.status(200).json(suppliers);  // Return all suppliers
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Get a single Supplier by ID
router.get('/get/:id', async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);  // Retrieve supplier by ID
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });  // Supplier not found
        }
        res.status(200).json(supplier);  // Return the found supplier
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Update a Supplier
router.put('/update/:id', async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });  // Update supplier by ID
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });  // Supplier not found
        }
        res.status(200).json(supplier);  // Return updated supplier
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Delete a Supplier
router.delete('/delete/:id', async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);  // Delete supplier by ID
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });  // Supplier not found
        }
        res.status(200).json({ message: 'Supplier deleted successfully' });  // Return success message
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Export the router
export default router;
