import express from 'express';
import { Category,Item } from '../models.js';  // Import the Category model

const router = express.Router();

// Create a new Category
router.post('/create', async (req, res) => {
    try {
        const { name, description } = req.body;

        const category = new Category({
            name,
            description,
        });

        await category.save();
        res.status(201).json(category);  // Return the newly created category
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Get all Categories
router.get('/get', async (req, res) => {
    try {
        const categories = await Category.find();  // Retrieve all categories
        res.status(200).json(categories);  // Return all categories
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Get a single Category by ID
router.get('/get/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);  // Retrieve category by ID
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });  // Category not found
        }
        res.status(200).json(category);  // Return the found category
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Update a Category
router.put('/update/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });  // Update category by ID
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });  // Category not found
        }
        res.status(200).json(category);  // Return updated category
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
});

// Delete a Category
router.delete('/delete/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);  // Delete category by ID
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });  // Category not found
        }
        res.status(200).json({ message: 'Category deleted successfully' });  // Return success message
    } catch (err) {
        res.status(400).json({ message: err.message });  // Handle errors
    }
}); 


// Get Category Name by Item ID
// ami category id string hishebe rakhsi tai ei rokom korechi
router.get('/category/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    // Find the item
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Find the category by converting ObjectId to string
    const category = await Category.findOne({
      $expr: { $eq: [{ $toString: "$_id" }, item.category_id] }
    });

    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.status(200).json({
      item_id: item._id,
      item_name: item.name,
      category_id: category._id,
      category_name: category.name,
    });
  } catch (err) {
    console.error('Error fetching category name:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export the router
export default router;
