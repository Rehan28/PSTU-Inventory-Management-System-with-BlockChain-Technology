import express from "express";
import mongoose from "mongoose";
import { CurrentStockOut } from "../models.js"; // Make sure model is exported

const router = express.Router();


// ----------------------------------------
// Create or Update CurrentStockOut entry
// ----------------------------------------
router.post("/create", async (req, res) => {
  try {
    const {
      user_id,
      department_id,
      office_id,
      item_id,
      issue_type,
      issue_by,
      issue_date,
      quantity,
      remarks,
    } = req.body;

    if (
      !user_id ||
      (!department_id && !office_id) ||
      !item_id ||
      !issue_type ||
      !issue_by ||
      !issue_date ||
      !quantity
    ) {
      return res.status(400).json({
        message: "All required fields must be provided.",
      });
    }

    const u_id = new mongoose.Types.ObjectId(user_id);
    const i_id = new mongoose.Types.ObjectId(item_id);

    // Check existing stock-out for same user & item (optional logic)
    let existing = await CurrentStockOut.findOne({
      user_id: u_id,
      item_id: i_id,
    });

    if (existing) {
      existing.quantity += quantity;
      await existing.save();

      console.log("Stock-out updated:", existing);
      return res.status(200).json({
        message: "Stock-out updated successfully.",
        data: existing,
      });
    }

    // Create new stock-out entry
    const newStockOut = new CurrentStockOut({
      user_id: u_id,
      department_id,
      office_id,
      item_id: i_id,
      issue_type,
      issue_by,
      issue_date,
      quantity,
      remarks,
    });

    await newStockOut.save();

    console.log("New stock-out created:", newStockOut);
    return res.status(201).json({
      message: "New stock-out entry created.",
      data: newStockOut,
    });
  } catch (error) {
    console.error("Error creating/updating CurrentStockOut entry:", error);
    return res.status(500).json({
      message: "Error creating/updating CurrentStockOut entry.",
      error: error.message,
    });
  }
});


// ----------------------------------------
// Get all CurrentStockOut entries
// ----------------------------------------
router.get("/get", async (req, res) => {
  try {
    const stockOuts = await CurrentStockOut.find();
    res.status(200).json(stockOuts);
  } catch (err) {
    console.error("Error fetching all stock-outs:", err);
    res.status(400).json({ message: err.message });
  }
});


// ----------------------------------------
// Get CurrentStockOut by ID
// ----------------------------------------
router.get("/get/:id", async (req, res) => {
  try {
    const stockOut = await CurrentStockOut.findById(req.params.id);
    if (!stockOut)
      return res.status(404).json({ message: "Stock-out entry not found" });

    res.status(200).json(stockOut);
  } catch (err) {
    console.error("Error fetching stock-out by ID:", err);
    res.status(400).json({ message: err.message });
  }
});


// ----------------------------------------
// Get stock-out quantity by user_id + item_id
// ----------------------------------------
router.get("/quantity", async (req, res) => {
  try {
    const { user_id, item_id } = req.query;

    if (!user_id || !item_id) {
      return res.status(400).json({
        message: "user_id and item_id are required",
      });
    }

    const u_id = new mongoose.Types.ObjectId(user_id);
    const i_id = new mongoose.Types.ObjectId(item_id);

    const stockOuts = await CurrentStockOut.find(
      { user_id: u_id, item_id: i_id },
      { quantity: 1, _id: 0 }
    );

    if (!stockOuts.length) {
      return res.status(404).json({
        message: "No stock-out entries found for this user and item.",
      });
    }

    console.log(
      `Found ${stockOuts.length} stock-out entries for user ${user_id} and item ${item_id}`
    );

    return res.status(200).json(stockOuts);
  } catch (err) {
    console.error("Error retrieving stock-out data:", err);
    return res.status(500).json({
      message: "Error retrieving data",
      error: err.message,
    });
  }
});


// ----------------------------------------
// Update quantity for CurrentStockOut
// ----------------------------------------
router.put("/update-quantity", async (req, res) => {
  try {
    const { user_id, item_id, quantity } = req.body;

    if (!user_id || !item_id || quantity == null) {
      return res.status(400).json({
        message: "user_id, item_id, and quantity are required",
      });
    }

    const u_id = new mongoose.Types.ObjectId(user_id);
    const i_id = new mongoose.Types.ObjectId(item_id);

    const stockEntry = await CurrentStockOut.findOne({
      user_id: u_id,
      item_id: i_id,
    });

    if (!stockEntry) {
      return res.status(404).json({
        message: "Stock-out entry not found for this user and item.",
      });
    }

    // 🔥 Key logic: new = old - stockout quantity
    stockEntry.quantity = stockEntry.quantity - quantity;

    await stockEntry.save();

    console.log(
      `Updated stock-out quantity for user ${user_id}, item ${item_id}. New quantity: ${stockEntry.quantity}`
    );

    return res.status(200).json({
      message: "Stock-out quantity updated successfully",
      data: stockEntry,
    });
  } catch (err) {
    console.error("Error updating stock-out quantity:", err);
    return res.status(500).json({
      message: "Error updating stock-out quantity",
      error: err.message,
    });
  }
});


export default router;
