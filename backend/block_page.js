// ========================== IMPORTS ==========================
import { Block } from "./models.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import cron from "node-cron";
import express from "express";

// ========================== BLOCKCHAIN CORE ==========================
class BlockchainCore {
  constructor(signingKey) {
    this.signingKey = signingKey;
  }

  calculateHash(data) {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  createSignature(hash) {
    return crypto.createHmac("sha256", this.signingKey).update(hash).digest("hex");
  }

  verifySignature(hash, signature) {
    const expectedSig = this.createSignature(hash);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  }

  async createBlock(event_type, event_id, collection_name, payload, user_id, previousHash) {
    try {
      const index = (await Block.countDocuments()) + 1;
      const timestamp = new Date();

      const blockData = JSON.stringify({
        index,
        timestamp,
        event_type,
        event_id,
        collection_name,
        payload,
        previous_hash: previousHash || "GENESIS",
      });

      const hash = this.calculateHash(blockData);
      const hmac_signature = this.createSignature(hash);

      const block = new Block({
        index,
        timestamp,
        event_type,
        event_id,
        collection_name,
        payload,
        user_id,
        previous_hash: previousHash || "GENESIS",
        hash,
        hmac_signature,
        is_verified: true,
      });

      await block.save();
      return block;
    } catch (error) {
      console.error("[Blockchain] Error creating block:", error);
      throw error;
    }
  }

  async verifyChain() {
    try {
      const blocks = await Block.find().sort({ index: 1 });
      const tamperedBlocks = [];

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

        try {
          this.verifySignature(block.hash, block.hmac_signature);
        } catch (err) {
          tamperedBlocks.push({
            index: block.index,
            reason: "Invalid HMAC signature",
            block_id: block._id,
          });
          block.is_verified = false;
          await block.save();
        }

        if (i > 0 && block.previous_hash !== blocks[i - 1].hash) {
          tamperedBlocks.push({
            index: block.index,
            reason: "Previous hash mismatch - chain broken",
            block_id: block._id,
          });
          block.is_verified = false;
          await block.save();
        }
      }

      return { isValid: tamperedBlocks.length === 0, tamperedBlocks };
    } catch (error) {
      console.error("[Blockchain] Error verifying chain:", error);
      throw error;
    }
  }
}

// ========================== INITIALIZE BLOCKCHAIN ==========================
const signingKey = process.env.BLOCKCHAIN_SIGNING_KEY || "default-dev-key-change-in-production";
export const blockchain = new BlockchainCore(signingKey);

// ========================== CAPTURE EVENT ==========================
export async function captureBlockchainEvent(event_type, event_id, collection_name, payload, user_id) {
  try {
    const lastBlock = await Block.findOne().sort({ index: -1 });
    const previousHash = lastBlock?.hash || null;

    await blockchain.createBlock(event_type, event_id, collection_name, payload, user_id, previousHash);

    console.log(`[Blockchain] Event captured: ${event_type} (${event_id})`);
  } catch (error) {
    console.error("[Blockchain] Error capturing event:", error);
  }
}

// ========================== EMAIL CONFIG ==========================
function getEmailConfig() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const alertEmail = process.env.ALERT_EMAIL;

  if (!emailUser || !emailPass || !alertEmail) {
    console.warn("[Email] Missing email configuration - alerts disabled");
    return null;
  }

  return { user: emailUser, pass: emailPass, alertEmail };
}

async function sendTamperAlert(tamperedBlocks) {
  const emailConfig = getEmailConfig();
  if (!emailConfig) return;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailConfig.user, pass: emailConfig.pass },
    });

    const blockDetails = tamperedBlocks
      .map((b) => `Block #${b.index}: ${b.reason} (ID: ${b.block_id})`)
      .join("\n");

    const mailOptions = {
      from: emailConfig.user,
      to: emailConfig.alertEmail,
      subject: `🚨 BLOCKCHAIN TAMPER ALERT - ${tamperedBlocks.length} blocks detected`,
      html: `
        <h2 style="color: red;">Blockchain Integrity Violation Detected</h2>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Tampered Blocks:</strong> ${tamperedBlocks.length}</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px;">
${blockDetails}
        </pre>
        <p style="color: #666; font-size: 12px;">
          This is an automated alert from your inventory blockchain system.
          Please investigate immediately.
        </p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("[Email] Tamper alert sent to", emailConfig.alertEmail);
  } catch (error) {
    console.error("[Email] Error sending tamper alert:", error);
  }
}

// ========================== BLOCKCHAIN VERIFICATION JOB ==========================
let verificationJobActive = false;

export function startBlockchainVerificationJob() {
  if (verificationJobActive) {
    console.log("[Blockchain] Verification job already running");
    return;
  }

  verificationJobActive = true;
  console.log("[Blockchain] Verification job started (runs every hour)");

  cron.schedule("0 * * * *", async () => {
    try {
      console.log("[Blockchain] Running hourly verification...");
      const result = await blockchain.verifyChain();

      if (!result.isValid) {
        console.error("[Blockchain] TAMPERING DETECTED!", result.tamperedBlocks);
        await sendTamperAlert(result.tamperedBlocks);
      } else {
        console.log("[Blockchain] Chain verified - all blocks intact");
      }
    } catch (error) {
      console.error("[Blockchain] Verification job error:", error);
    }
  });

  setTimeout(async () => {
    try {
      const result = await blockchain.verifyChain();
      if (!result.isValid) {
        console.error("[Blockchain] Initial verification found tampering!");
        await sendTamperAlert(result.tamperedBlocks);
      }
    } catch (error) {
      console.error("[Blockchain] Initial verification error:", error);
    }
  }, 5000);
}

// ========================== EXPRESS ROUTES ==========================
export const blockchainRoutes = express.Router();

blockchainRoutes.get("/chain", async (req, res) => {
  try {
    const blocks = await Block.find().sort({ index: 1 });
    res.json({ success: true, totalBlocks: blocks.length, blocks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

blockchainRoutes.get("/block/:index", async (req, res) => {
  try {
    const block = await Block.findOne({ index: Number.parseInt(req.params.index) });
    if (!block) return res.status(404).json({ success: false, error: "Block not found" });
    res.json({ success: true, block });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

blockchainRoutes.get("/chain/verify", async (req, res) => {
  try {
    const result = await blockchain.verifyChain();
    res.json({
      success: true,
      isValid: result.isValid,
      tamperedBlocks: result.tamperedBlocks,
      verification_timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

blockchainRoutes.get("/stats", async (req, res) => {
  try {
    const totalBlocks = await Block.countDocuments();
    const eventTypes = await Block.aggregate([{ $group: { _id: "$event_type", count: { $sum: 1 } } }]);
    const unverifiedBlocks = await Block.countDocuments({ is_verified: false });

    res.json({
      success: true,
      totalBlocks,
      unverifiedBlocks,
      eventTypeBreakdown: eventTypes,
      firstBlockTime: (await Block.findOne().sort({ index: 1 }))?.timestamp,
      lastBlockTime: (await Block.findOne().sort({ index: -1 }))?.timestamp,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

blockchainRoutes.get("/events", async (req, res) => {
  try {
    const { event_type, collection_name, user_id } = req.query;
    const filter = {};

    if (event_type) filter.event_type = event_type;
    if (collection_name) filter.collection_name = collection_name;
    if (user_id) filter.user_id = user_id;

    const events = await Block.find(filter).sort({ index: -1 }).limit(100);
    res.json({ success: true, count: events.length, events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

blockchainRoutes.get("/audit/:event_id", async (req, res) => {
  try {
    const trail = await Block.find({ event_id: req.params.event_id }).sort({ index: 1 });
    res.json({ success: true, itemId: req.params.event_id, auditTrail: trail, count: trail.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

blockchainRoutes.post("/force-verify", async (req, res) => {
  try {
    const result = await blockchain.verifyChain();
    if (!result.isValid) await sendTamperAlert(result.tamperedBlocks);
    res.json({ success: true, isValid: result.isValid, tamperedBlocks: result.tamperedBlocks, alertSent: !result.isValid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

blockchainRoutes.get("/export/csv", async (req, res) => {
  try {
    const blocks = await Block.find().sort({ index: 1 });
    let csv = "Index,Timestamp,EventType,CollectionName,UserId,IsVerified\n";

    blocks.forEach((block) => {
      csv += `${block.index},"${block.timestamp}","${block.event_type}","${block.collection_name}","${block.user_id || "N/A"}",${block.is_verified}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="blockchain-audit.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
