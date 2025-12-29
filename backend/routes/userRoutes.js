import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { User } from '../models.js';

const router = express.Router();

// TEMPORARY STORE FOR OTP (use Redis or DB in production)
let otpStore = {};

// ----------------------------
// CREATE USER & SEND EMAIL
// ----------------------------
router.post('/create', async (req, res) => {
    try {
        const { name, email, password, role, phone_number, department_id, office_id } = req.body;

        if (role === 'teacher' && !department_id) {
            return res.status(400).json({ message: 'Department ID is required for teachers' });
        }

        if (role === 'staff' && !office_id) {
            return res.status(400).json({ message: 'Office ID is required for staff' });
        }

        if (!phone_number) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            phone_number,
            department_id: role === 'teacher' ? department_id : null,
            office_id: role === 'staff' ? office_id : null,
        });

        await user.save();

        // Send success email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Account Created Successfully",
            text: `Hello ${name}, Your account has been successfully created by PSTU Inventory Management System.`,
            html: `
                <h2>Hello, ${name}</h2>
                <p>Your account has been <strong>successfully created</strong> by <strong>PSTU Inventory Management System</strong>.</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Role:</strong> ${role}</p>
                <br>
                <p>You can now log in and start using the system.</p>
                <br>
                <p style="color: gray; font-size: 12px;">
                    This is an automated message from PSTU Inventory Management System.
                </p>
            `
        });

        res.status(201).json({ message: "Account created and email sent", user });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ----------------------------
// LOGIN
// ----------------------------
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token, user });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ----------------------------
// GET USERS
// ----------------------------
router.get('/get', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/get-teachers', async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' });
        res.status(200).json(teachers);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/get-staff', async (req, res) => {
    try {
        const staffs = await User.find({ role: 'staff' });
        res.status(200).json(staffs);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ----------------------------
// GET USER BY ID OR NAME
// ----------------------------
router.get('/get/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/getByName/:name', async (req, res) => {
    try {
        const user = await User.findOne({ name: new RegExp(`^${req.params.name}$`, 'i') });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ----------------------------
// UPDATE USER
// ----------------------------
router.put('/update/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ----------------------------
// DELETE USER
// ----------------------------
router.delete('/delete/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// =======================================================================
//  PASSWORD RESET SYSTEM USING EMAIL + OTP
// =======================================================================

// 1️⃣ Request OTP
router.post("/request-password-otp", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Email not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expireTime = Date.now() + 5 * 60 * 1000;

        otpStore[email] = { otp, expireTime };

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset OTP",
            text: `Your OTP is ${otp}. Valid for 5 minutes.`,
        });

        res.status(200).json({ message: "OTP sent to email" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2️⃣ Verify OTP
router.post("/verify-password-otp", (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!otpStore[email]) return res.status(400).json({ message: "OTP not requested" });

        const { otp: storedOtp, expireTime } = otpStore[email];

        if (Date.now() > expireTime) return res.status(400).json({ message: "OTP expired" });
        if (otp !== storedOtp) return res.status(400).json({ message: "Invalid OTP" });

        otpStore[email].verified = true;
        res.status(200).json({ message: "OTP verified" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3️⃣ Update Password
router.post("/update-password", async (req, res) => {
    try {
        const { email, new_password } = req.body;
        if (!otpStore[email] || !otpStore[email].verified) return res.status(400).json({ message: "OTP verification required" });

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await User.findOneAndUpdate({ email }, { password: hashedPassword });

        delete otpStore[email];
        res.status(200).json({ message: "Password updated successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
