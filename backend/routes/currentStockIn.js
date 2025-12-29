import express from "express";
import mongoose from "mongoose";
import { CurrentStockIn } from "../models.js"; // Use CurrentStockIn model

const router = express.Router();

// ----------------------------
// Create or Update CurrentStockIn entry
// ----------------------------
router.post("/create", async (req, res) => {
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
      remarks,
    } = req.body;

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
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    const u_id = new mongoose.Types.ObjectId(user_id);
    const i_id = new mongoose.Types.ObjectId(item_id);

    // Check existing stock
    let existing = await CurrentStockIn.findOne({ user_id: u_id, item_id: i_id });

    if (existing) {
      existing.quantity += quantity;
      existing.total_price = existing.quantity * existing.unit_price;
      await existing.save();

      console.log("Stock updated:", existing);
      return res.status(200).json({
        message: "Stock updated successfully.",
        data: existing,
      });
    }

    // Create new stock
    const newStock = new CurrentStockIn({
      user_id: u_id,
      department_id,
      office_id,
      item_id: i_id,
      supplier_id,
      quantity,
      unit_price,
      total_price,
      purchase_date,
      invoice_no,
      remarks,
    });

    await newStock.save();

    console.log("New stock created:", newStock);
    return res.status(201).json({
      message: "New stock entry created.",
      data: newStock,
    });
  } catch (error) {
    console.error("Error creating/updating CurrentStockIn entry:", error);
    return res.status(500).json({
      message: "Error creating/updating CurrentStockIn entry.",
      error: error.message,
    });
  }
});

// ----------------------------
// Get all CurrentStockIn entries
// ----------------------------
router.get("/get", async (req, res) => {
  try {
    const stockIns = await CurrentStockIn.find();
    res.status(200).json(stockIns);
  } catch (err) {
    console.error("Error fetching all stock-ins:", err);
    res.status(400).json({ message: err.message });
  }
});

// ----------------------------
// Get CurrentStockIn by ID
// ----------------------------
router.get("/get/:id", async (req, res) => {
  try {
    const stockIn = await CurrentStockIn.findById(req.params.id);
    if (!stockIn) return res.status(404).json({ message: "Stock entry not found" });
    res.status(200).json(stockIn);
  } catch (err) {
    console.error("Error fetching stock by ID:", err);
    res.status(400).json({ message: err.message });
  }
});

// ----------------------------
// Get CurrentStockIn by user_id + item_id (quantity only)
// ----------------------------
router.get("/quantity", async (req, res) => {
  try {
    const { user_id, item_id } = req.query;

    if (!user_id || !item_id) {
      return res.status(400).json({ message: "user_id and item_id are required" });
    }

    const u_id = new mongoose.Types.ObjectId(user_id);
    const i_id = new mongoose.Types.ObjectId(item_id);

    const stockIns = await CurrentStockIn.find(
      { user_id: u_id, item_id: i_id },
      { quantity: 1, _id: 0 }
    );

    if (!stockIns.length) {
      return res.status(404).json({ message: "No stock entries found for this user and item." });
    }

    console.log(`Found ${stockIns.length} stock entries for user ${user_id} and item ${item_id}`);
    return res.status(200).json(stockIns);
  } catch (err) {
    console.error("Error retrieving stock-in data:", err);
    return res.status(500).json({ message: "Error retrieving data", error: err.message });
  }
});

// ----------------------------
// Update quantity for CurrentStockIn
// ----------------------------
router.put("/update-quantity", async (req, res) => {
  try {
    const { user_id, item_id, quantity } = req.body;

    if (!user_id || !item_id || quantity == null) {
      return res.status(400).json({ message: "user_id, item_id, and quantity are required" });
    }

    const u_id = new mongoose.Types.ObjectId(user_id);
    const i_id = new mongoose.Types.ObjectId(item_id);

    const stockEntry = await CurrentStockIn.findOne({ user_id: u_id, item_id: i_id });
    if (!stockEntry) {
      return res.status(404).json({ message: "Stock entry not found for this user and item." });
    }

    stockEntry.quantity += quantity;
    stockEntry.total_price = stockEntry.quantity * stockEntry.unit_price;

    await stockEntry.save();

    console.log(`Updated quantity for user ${user_id}, item ${item_id}. New quantity: ${stockEntry.quantity}`);

    return res.status(200).json({
      message: "Stock quantity updated successfully",
      data: stockEntry,
    });
  } catch (err) {
    console.error("Error updating stock quantity:", err);
    return res.status(500).json({ message: "Error updating stock quantity", error: err.message });
  }
});

export default router;
