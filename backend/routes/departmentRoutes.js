import express from 'express';  // Use 'import' instead of 'require'
import { Department} from '../models.js';  // Adjust import statement to import Product as well

const router = express.Router();  // Import models

// Create a Department
router.post('/create', async (req, res) => {
    try {
        const { name, code, description, faculty } = req.body;

        // Check if a department with the same name already exists
        const existingDepartment = await Department.findOne({ name: name });
        if (existingDepartment) {
            return res.status(400).json({ message: "Department with this name already exists." });
        }

        // Create a new department
        const department = new Department({
            name,
            code,
            description,
            faculty,
        });

        // Save the new department
        await department.save();

        res.status(201).json(department);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// Get all Departments
router.get('/get', async (req, res) => {
    try {
        const departments = await Department.find();
        res.status(200).json(departments);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get a single Department by ID
router.get('/get/:id', async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.status(200).json(department);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a Department
router.put('/update/:id', async (req, res) => {
    try {
        const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.status(200).json(department);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a Department
router.delete('/delete/:id', async (req, res) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.status(200).json({ message: 'Department deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get Products for a Department (Example based on Product Model)
router.get('/:id/products/get', async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        const products = await Product.find({ department_id: req.params.id });
        res.status(200).json(products);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Create a Product for a Department (Example based on Product Model)
router.post('/:id/products/create', async (req, res) => {
    try {
        const { name, description, category_id, unit, price } = req.body;

        const product = new Product({
            name,
            description,
            category_id,
            unit,
            price,
            department_id: req.params.id,  // Associate product with the department
        });

        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;  // Export router as default
