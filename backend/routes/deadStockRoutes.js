import express from 'express';
import nodemailer from 'nodemailer';
import { DeadStock, User, Item } from '../models.js';

const router = express.Router();

// ----------------------------
// Create a new DeadStock entry with email notification
// ----------------------------
router.post('/create', async (req, res) => {
    try {
        const { user_id, department_id, office_id, item_id, quantity, reason, reported_at } = req.body;

        // 1️⃣ Create DeadStock entry
        const deadStock = new DeadStock({
            user_id,
            department_id,
            office_id,
            item_id,
            quantity,
            reason,
            reported_at: reported_at || new Date()
        });

        await deadStock.save();
        console.log('DeadStock entry created:', deadStock._id);

        // 2️⃣ Get user info
        const user = await User.findById(user_id);
        if (!user) {
            console.log('User not found, skipping email send.');
            return res.status(201).json({ message: 'DeadStock created but user not found.', data: deadStock });
        }

        const item = await Item.findById(item_id);

        // 3️⃣ Configure email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 4️⃣ Send email to user
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'DeadStock Report Created',
                text: `Hello ${user.name}, your DeadStock report has been recorded.`,
                html: `
                    <h2>Hello, ${user.name}!</h2>
                    <p>A new <strong>DeadStock report</strong> has been created in the system.</p>
                    <p><strong>Item:</strong> ${item ? item.name : 'N/A'}</p>
                    <p><strong>Quantity:</strong> ${quantity}</p>
                    <p><strong>Reason:</strong> ${reason}</p>
                    <p><strong>Reported At:</strong> ${new Date(deadStock.reported_at).toLocaleDateString()}</p>
                    <p>You can log in to the system to see details.</p>
                    <p style="color: gray; font-size: 12px;">This message was automatically sent by the PSTU Inventory Management System.</p>
                `
            });

            console.log('Email sent successfully to user:', user.email);
        } catch (emailErr) {
            console.error('Error sending email:', emailErr);
        }

        // 5️⃣ Return response
        return res.status(201).json({ message: 'DeadStock entry created (check console for email status).', data: deadStock });

    } catch (err) {
        console.error('Error creating DeadStock entry:', err);
        res.status(400).json({ message: err.message });
    }
});

// ----------------------------
// Other DeadStock routes
// ----------------------------

// Get all
router.get('/get', async (req, res) => {
    try {
        const deadStocks = await DeadStock.find();
        res.status(200).json(deadStocks);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get by ID
router.get('/get/:id', async (req, res) => {
    try {
        const deadStock = await DeadStock.findById(req.params.id);
        if (!deadStock) return res.status(404).json({ message: 'DeadStock entry not found' });
        res.status(200).json(deadStock);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update
router.put('/update/:id', async (req, res) => {
    try {
        const deadStock = await DeadStock.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!deadStock) return res.status(404).json({ message: 'DeadStock entry not found' });
        res.status(200).json(deadStock);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete
router.delete('/delete/:id', async (req, res) => {
    try {
        const deadStock = await DeadStock.findByIdAndDelete(req.params.id);
        if (!deadStock) return res.status(404).json({ message: 'DeadStock entry not found' });
        res.status(200).json({ message: 'DeadStock entry deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get by item
router.get('/item/:item_id', async (req, res) => {
    try {
        const deadStocks = await DeadStock.find({ item_id: req.params.item_id });
        if (deadStocks.length === 0) return res.status(404).json({ message: 'No DeadStock entries found for this item.' });
        res.status(200).json(deadStocks);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/department/:department_id', async (req, res) => {
    try {
        const deadStocks = await DeadStock.find({ department_id: req.params.department_id });

        if (deadStocks.length === 0) {
            return res.status(404).json({ message: 'No DeadStock entries found for this department.' });
        }

        res.status(200).json(deadStocks);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// Get by user
router.get('/user/:user_id', async (req, res) => {
    try {
        const deadStocks = await DeadStock.find({ user_id: req.params.user_id });
        if (deadStocks.length === 0) return res.status(404).json({ message: 'No DeadStock entries found for this user.' });
        res.status(200).json(deadStocks);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get by department
router.get('/department/:department_id', async (req, res) => {
    try {
        const deadStocks = await DeadStock.find({ department_id: req.params.department_id });
        if (deadStocks.length === 0) return res.status(404).json({ message: 'No DeadStock entries found for this department.' });
        res.status(200).json(deadStocks);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get by office
router.get('/office/:office_id', async (req, res) => {
    try {
        const deadStocks = await DeadStock.find({ office_id: req.params.office_id });
        if (deadStocks.length === 0) return res.status(404).json({ message: 'No DeadStock entries found for this office.' });
        res.status(200).json(deadStocks);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
