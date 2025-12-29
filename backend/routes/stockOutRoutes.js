import express from 'express';
import mongoose from "mongoose";   
import nodemailer from 'nodemailer';
import { StockOut, User, Item } from '../models.js';

const router = express.Router();

// ----------------------------
// Create a new StockOut entry
// ----------------------------
router.post('/create', async (req, res) => {
    try {
        let { user_id, role, department_id, office_id, item_id, issue_type, issue_by, issue_date, quantity, remarks } = req.body;

        if (role === 'teacher') {
            if (!department_id) return res.status(400).json({ message: 'Department ID is required for teachers' });
            office_id = null;
        }

        if (role === 'staff') {
            if (!office_id) return res.status(400).json({ message: 'Office ID is required for staff' });
            department_id = null;
        }

        // 1️⃣ Create StockOut entry
        const stockOut = new StockOut({
            user_id,
            department_id,
            office_id,
            item_id,
            issue_type,
            issue_by,
            issue_date,
            quantity,
            remarks
        });

        await stockOut.save();
        console.log('StockOut entry created:', stockOut._id);

        // 2️⃣ Get users for email
        const issuedToUser = await User.findById(user_id);
        const issuedByUser = await User.findById(issue_by);

        if (!issuedToUser || !issuedByUser) {
            console.log('Issued To or Issued By user not found, skipping email send.');
            return res.status(201).json({ message: 'StockOut created but one or both users not found.', data: stockOut });
        }

        const item = await Item.findById(item_id);

        // 3️⃣ Configure transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 4️⃣ Send email to Issued To user
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: issuedToUser.email,
                subject: 'You have received a StockOut entry',
                text: `Hello ${issuedToUser.name}, a StockOut entry has been issued to you by ${issuedByUser.name}.`,
                html: `
                    <h2>Hello, ${issuedToUser.name}!</h2>
                    <p>A new <strong>StockOut entry</strong> has been issued to you.</p>
                    <p><strong>Item:</strong> ${item ? item.name : 'N/A'}</p>
                    <p><strong>Quantity:</strong> ${quantity}</p>
                    <p><strong>Issue Date:</strong> ${new Date(issue_date).toLocaleDateString()}</p>
                    <p><strong>Issued To:</strong> ${issuedToUser.name}</p>
                    <p><strong>Issued By:</strong> ${issuedByUser.name}</p>
                    <p><strong>Remarks:</strong> ${remarks || 'N/A'}</p>
                    <p>You can log in to the system to see details.</p>
                `
            });
            console.log('Email sent successfully to Issued To user:', issuedToUser.email);
        } catch (err) {
            console.error('Error sending email to Issued To user:', err);
        }

        // 5️⃣ Send email to Issued By user
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: issuedByUser.email,
                subject: 'You issued a StockOut entry',
                text: `Hello ${issuedByUser.name}, you have issued a StockOut entry to ${issuedToUser.name}.`,
                html: `
                    <h2>Hello, ${issuedByUser.name}!</h2>
                    <p>You have issued a new <strong>StockOut entry</strong>.</p>
                    <p><strong>Item:</strong> ${item ? item.name : 'N/A'}</p>
                    <p><strong>Quantity:</strong> ${quantity}</p>
                    <p><strong>Issue Date:</strong> ${new Date(issue_date).toLocaleDateString()}</p>
                    <p><strong>Issued To:</strong> ${issuedToUser.name}</p>
                    <p><strong>Issued By:</strong> ${issuedByUser.name}</p>
                    <p><strong>Remarks:</strong> ${remarks || 'N/A'}</p>
                    <p>You can log in to the system to see details.</p>
                `
            });
            console.log('Email sent successfully to Issued By user:', issuedByUser.email);
        } catch (err) {
            console.error('Error sending email to Issued By user:', err);
        }

        return res.status(201).json({ message: 'StockOut entry created (check console for email status).', data: stockOut });

    } catch (err) {
        console.error('Error creating StockOut entry:', err);
        res.status(400).json({ message: err.message });
    }
});
// ----------------------------
// Existing StockOut routes
// ----------------------------
router.get('/get', async (req, res) => {
    try {
        const stockOuts = await StockOut.find();
        res.status(200).json(stockOuts);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/get/:id', async (req, res) => {
    try {
        const stockOut = await StockOut.findById(req.params.id);
        if (!stockOut) return res.status(404).json({ message: 'StockOut entry not found' });
        res.status(200).json(stockOut);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/item/:item_id', async (req, res) => {
    try {
        const stockOuts = await StockOut.find({ item_id: req.params.item_id });
        if (stockOuts.length === 0) return res.status(404).json({ message: 'No StockOut entries found for this item.' });
        res.status(200).json(stockOuts);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/department/:department_id', async (req, res) => {
    try {
        const stockOuts = await StockOut.find({ department_id: req.params.department_id });

        if (stockOuts.length === 0) {
            return res.status(404).json({ message: 'No StockOut entries found for this department.' });
        }

        res.status(200).json(stockOuts);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/office/:office_id', async (req, res) => {
    try {
        const stockOuts = await StockOut.find({ office_id: req.params.office_id });

        if (stockOuts.length === 0) {
            return res.status(404).json({ message: 'No StockOut entries found for this office.' });
        }

        res.status(200).json(stockOuts);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



router.get('/user/:user_id', async (req, res) => {
    try {
        const stockOuts = await StockOut.find({ user_id: req.params.user_id });
        if (stockOuts.length === 0) return res.status(404).json({ message: 'No StockOut entries found for this user.' });
        res.status(200).json(stockOuts);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/update/:id', async (req, res) => {
    try {
        const stockOut = await StockOut.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!stockOut) return res.status(404).json({ message: 'StockOut entry not found' });
        res.status(200).json(stockOut);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const stockOut = await StockOut.findByIdAndDelete(req.params.id);
        if (!stockOut) return res.status(404).json({ message: 'StockOut entry not found' });
        res.status(200).json({ message: 'StockOut entry deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
