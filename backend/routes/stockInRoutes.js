import express from 'express';
import nodemailer from 'nodemailer';
import { StockIn, User, Item, Supplier } from '../models.js';
import { captureBlockchainEvent } from '../block_page.js';

const router = express.Router();

// ----------------------------
// Create a new StockIn entry
// ----------------------------
router.post('/create', async (req, res) => {
    try {
        const { 
            user_id, 
            department_id, 
            office_id, 
            item_id, 
            supplier_id, 
            quantity, 
            unit_price, 
            total_price, 
            purchase_date, 
            invoice_no, 
            remarks 
        } = req.body;

        // Validate required fields
        if (
            !user_id || 
            (!department_id && !office_id) || 
            !item_id || 
            !supplier_id || 
            !quantity || 
            !unit_price || 
            !total_price || 
            !purchase_date || 
            !invoice_no
        ) {
            return res.status(400).json({ message: 'All required fields must be provided.' });
        }

        // Check duplicate invoice
        const exists = await StockIn.findOne({ invoice_no });
        if (exists) {
            return res.status(409).json({
                message: "Invoice number already exists! Please use a unique invoice number."
            });
        }

        // Create new entry
        const newStockIn = new StockIn({
            user_id,
            department_id,
            office_id,
            item_id,
            supplier_id,
            quantity,
            unit_price,
            total_price,
            purchase_date,
            invoice_no,
            remarks
        });

        // Save with protected error handling
        try {
            await newStockIn.save();
        } catch (err) {
            if (err.code === 11000 && err.keyPattern?.invoice_no) {
                return res.status(409).json({
                    message: "Invoice number already exists (database check). Please use a unique invoice number."
                });
            }
            throw err;
        }

        console.log("StockIn entry created:", newStockIn._id);

        // 🟦 BLOCKCHAIN EVENT: STOCK IN CREATED
        await captureBlockchainEvent(
            "STOCK_IN",
            newStockIn._id,
            "StockIn",
            req.body,        // payload
            user_id          // who did it
        );

        // Email user
        const user = await User.findById(user_id);
        const item = await Item.findById(item_id);
        const supplier = await Supplier.findById(supplier_id);

        if (user) {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: "New StockIn Entry Created",
                html: `
                    <h2>Hello, ${user.name}!</h2>
                    <p>A new <strong>StockIn</strong> entry was created.</p>
                    <p><strong>Item:</strong> ${item?.name || "N/A"}</p>
                    <p><strong>Supplier:</strong> ${supplier?.name || "N/A"}</p>
                    <p><strong>Quantity:</strong> ${quantity}</p>
                    <p><strong>Total Price:</strong> ${total_price}</p>
                    <p><strong>Invoice No:</strong> ${invoice_no}</p>
                    <p><strong>Purchase Date:</strong> ${new Date(purchase_date).toLocaleDateString()}</p>
                `
            });
        }

        return res.status(201).json({
            message: "StockIn entry created successfully.",
            data: newStockIn
        });

    } catch (error) {
        console.error("Error creating StockIn entry:", error);

        return res.status(500).json({
            message: "Error creating StockIn entry.",
            error: error.message
        });
    }
});


// ----------------------------
// Get all StockIn entries
// ----------------------------
router.get('/get', async (req, res) => {
    try {
        const stockIns = await StockIn.find();
        res.status(200).json(stockIns);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// ----------------------------
// Get StockIn by ID
// ----------------------------
router.get('/get/:id', async (req, res) => {
    try {
        const stockIn = await StockIn.findById(req.params.id);
        if (!stockIn) return res.status(404).json({ message: 'StockIn entry not found' });
        res.status(200).json(stockIn);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// ----------------------------
// Get StockIn entries by item_id
// ----------------------------
router.get('/item/:item_id', async (req, res) => {
    try {
        const stockIns = await StockIn.find({ item_id: req.params.item_id });
        if (stockIns.length === 0) return res.status(404).json({ message: 'No StockIn entries found for this item.' });
        res.status(200).json(stockIns);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/department/:department_id', async (req, res) => {
    try {
        const stockIns = await StockIn.find({ department_id: req.params.department_id });

        if (stockIns.length === 0) {
            return res.status(404).json({ message: 'No StockIn entries found for this department.' });
        }

        res.status(200).json(stockIns);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/office/:office_id', async (req, res) => {
    try {
        const stockIns = await StockIn.find({ office_id: req.params.office_id });

        if (stockIns.length === 0) {
            return res.status(404).json({ message: 'No StockIn entries found for this office.' });
        }

        res.status(200).json(stockIns);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ----------------------------
// Get StockIn entries by user_id
// ----------------------------
router.get('/user/:user_id', async (req, res) => {
    try {
        const stockIns = await StockIn.find({ user_id: req.params.user_id });
        if (stockIns.length === 0) return res.status(404).json({ message: 'No StockIn entries found for this user.' });
        res.status(200).json(stockIns);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// ----------------------------
// Update StockIn entry
// ----------------------------
router.put('/update/:id', async (req, res) => {
    try {
        const stockIn = await StockIn.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!stockIn) return res.status(404).json({ message: 'StockIn entry not found' });

        // 🟦 BLOCKCHAIN EVENT: UPDATE
        await captureBlockchainEvent(
            "UPDATE",
            stockIn._id,
            "StockIn",
            req.body,
            req.body.user_id || "SYSTEM"
        );

        res.status(200).json(stockIn);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// ----------------------------
// Delete StockIn entry
// ----------------------------
router.delete('/delete/:id', async (req, res) => {
    try {
        const stockIn = await StockIn.findByIdAndDelete(req.params.id);
        if (!stockIn) return res.status(404).json({ message: 'StockIn entry not found' });

        // 🟦 BLOCKCHAIN EVENT: DELETE
        await captureBlockchainEvent(
            "DELETE",
            stockIn._id,
            "StockIn",
            stockIn,
            stockIn.user_id || "SYSTEM"
        );

        res.status(200).json({ message: 'StockIn entry deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
