import express from "express";
import multer from "multer";
import { DeadStockRequest } from "../models.js";

const router = express.Router();

// ---------------------- Multer Upload Setup ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// ---------------------- CREATE DEAD STOCK REQUEST ----------------------
router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const { user_id, item_id, quantity, reason, status } = req.body;

    if (!user_id || !item_id || !quantity || !reason) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    const image_url = req.file ? `uploads/${req.file.filename}` : null;

    const deadStockRequest = new DeadStockRequest({
      user_id,
      item_id,
      quantity,
      reason,
      image_url,
      status: status || "pending",
    });

    await deadStockRequest.save();

    res.status(201).json(deadStockRequest);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------------- GET ALL ----------------------
router.get("/get", async (req, res) => {
  try {
    const deadStockRequests = await DeadStockRequest.find()
      .populate("user_id", "name email")
      .populate("item_id", "name code")
      .sort({ reported_at: -1 });

    res.status(200).json(deadStockRequests);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------------- GET BY ID ----------------------
router.get("/get/:id", async (req, res) => {
  try {
    const deadStockRequest = await DeadStockRequest.findById(req.params.id)
      .populate("user_id", "name email")
      .populate("item_id", "name code");

    if (!deadStockRequest) {
      return res.status(404).json({ message: "Dead stock request not found" });
    }

    res.status(200).json(deadStockRequest);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------------- UPDATE REQUEST ----------------------
router.put("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) updateData.image_url = `uploads/${req.file.filename}`;

    const deadStockRequest = await DeadStockRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!deadStockRequest) {
      return res.status(404).json({ message: "Dead stock request not found" });
    }

    res.status(200).json(deadStockRequest);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------------- DELETE REQUEST ----------------------
router.delete("/delete/:id", async (req, res) => {
  try {
    const deadStockRequest = await DeadStockRequest.findByIdAndDelete(req.params.id);

    if (!deadStockRequest) {
      return res.status(404).json({ message: "Dead stock request not found" });
    }

    res.status(200).json({ message: "Dead stock request deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// ===================================================================
// ========================= ADMIN ROUTES ============================
// ===================================================================

// ---------------------- APPROVE REQUEST ----------------------
router.put("/approve/:id", async (req, res) => {
  try {
    const deadStockRequest = await DeadStockRequest.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    if (!deadStockRequest) {
      return res.status(404).json({ message: "Dead stock request not found" });
    }

    res.status(200).json(deadStockRequest);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------------- REJECT REQUEST ----------------------
router.put("/reject/:id", async (req, res) => {
  try {
    const deadStockRequest = await DeadStockRequest.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    if (!deadStockRequest) {
      return res.status(404).json({ message: "Dead stock request not found" });
    }

    res.status(200).json(deadStockRequest);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------------- FILTER BY STATUS ----------------------
router.get("/status/:status", async (req, res) => {
  try {
    const deadStockRequests = await DeadStockRequest.find({
      status: req.params.status.toLowerCase(),
    })
      .populate("user_id", "name email")
      .populate("item_id", "name code");

    res.status(200).json(deadStockRequests);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------------- FILTER BY USER ----------------------
router.get("/user/:user_id", async (req, res) => {
  try {
    const deadStockRequests = await DeadStockRequest.find({
      user_id: req.params.user_id,
    })
      .populate("item_id", "name code")
      .populate("user_id", "name email");

    res.status(200).json(deadStockRequests);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
