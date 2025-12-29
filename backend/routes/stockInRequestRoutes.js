import express from "express";
import multer from "multer";
import { StockRequest } from "../models.js";

const router = express.Router();

// ---------------------- Multer Upload Setup ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ---------------------- CREATE REQUEST ----------------------
router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const {
      user_id,
      item_id,
      invoice_no,
      quantity,
      unit_price,
      description,
      supplier_id,
    } = req.body;

    // Check required fields
    if (!user_id || !item_id || !invoice_no || !quantity || !unit_price || !supplier_id) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    // Check for image
    if (!req.file) {
      return res.status(400).json({ message: "Product image is required." });
    }

    const image_url = `uploads/${req.file.filename}`;
    const total_price = Number(quantity) * Number(unit_price);

    const stockRequest = new StockRequest({
      user_id,
      item_id,
      invoice_no,
      quantity,
      unit_price,
      total_price,
      description,
      supplier_id,
      image_url,
    });

    await stockRequest.save();
    res.status(201).json(stockRequest);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------------- GET ALL ----------------------
router.get("/get", async (req, res) => {
  try {
    const stockRequests = await StockRequest.find()
      .populate("user_id", "name email") // populate user info
      .sort({ createdAt: -1 });

    res.status(200).json(stockRequests);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------------- GET BY ID ----------------------
router.get("/get/:id", async (req, res) => {
  try {
    const stockRequest = await StockRequest.findById(req.params.id)
      .populate("user_id", "name email");

    if (!stockRequest) {
      return res.status(404).json({ message: "Stock request not found" });
    }

    res.status(200).json(stockRequest);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------------- UPDATE ----------------------
router.put("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Recalculate total if both quantity and unit_price are provided
    if (updateData.quantity && updateData.unit_price) {
      updateData.total_price = Number(updateData.quantity) * Number(updateData.unit_price);
    }

    if (req.file) {
      updateData.image_url = `uploads/${req.file.filename}`;
    }

    const stockRequest = await StockRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!stockRequest) {
      return res.status(404).json({ message: "Stock request not found" });
    }

    res.status(200).json(stockRequest);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------------- DELETE ----------------------
router.delete("/delete/:id", async (req, res) => {
  try {
    const stockRequest = await StockRequest.findByIdAndDelete(req.params.id);

    if (!stockRequest) {
      return res.status(404).json({ message: "Stock request not found" });
    }

    res.status(200).json({ message: "Stock request deleted successfully" });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
