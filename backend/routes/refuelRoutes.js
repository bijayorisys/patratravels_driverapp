import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { fileURLToPath } from "url";
import db from "../config/database.js";

// --- 1. SETUP PATHS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- 2. CONFIGURATION ---
const uploadDir = path.join(__dirname, "../uploads/refuel_receipt");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

// Updated upload config to handle multiple fields
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images are allowed!"));
  },
}).fields([
  { name: 'receipt_image', maxCount: 1 },
  { name: 'fuel_meter_image', maxCount: 1 },
  { name: 'oil_meter_image', maxCount: 1 }
]);

// --- 3. MAIN CONTROLLER LOGIC ---

router.post("/add", (req, res) => {
  // Wrap multer in a promise or use it directly, but for express router handler:
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });

    try {
      // A. Validate Input
      const {
        driver_id,
        station_name,
        liters,
        price_per_liter,
        total_amount,
        payment_mode,
        transaction_id,
      } = req.body;

      const paymentModeInt = payment_mode === "Company" ? 1 : 2;

      // Note: Frontend sends 'receipt_image' mandatory.
      if (!driver_id || !req.files['receipt_image']) {
        return res.status(400).json({ success: false, message: "Driver ID and Bill Receipt are required" });
      }

      // --- B. IMAGE PROCESSING HELPER ---
      const processImage = async (fileBuffer, prefix) => {
        const filename = `${prefix}_${driver_id}_${Date.now()}.jpeg`;
        const outputPath = path.join(uploadDir, filename);
        
        await sharp(fileBuffer)
          .resize({ width: 800, withoutEnlargement: true })
          .toFormat("jpeg")
          .jpeg({ quality: 60 })
          .toFile(outputPath);
          
        return filename;
      };

      // Process Receipt (Mandatory)
      const receiptFilename = await processImage(req.files['receipt_image'][0].buffer, 'receipt');
      
      // Process Fuel Meter (Optional but expected)
      let fuelMeterFilename = null;
      if (req.files['fuel_meter_image']) {
        fuelMeterFilename = await processImage(req.files['fuel_meter_image'][0].buffer, 'fuel_meter');
      }

      // Process Oil Meter (Optional)
      let oilMeterFilename = null;
      if (req.files['oil_meter_image']) {
        oilMeterFilename = await processImage(req.files['oil_meter_image'][0].buffer, 'oil_meter');
      }

      // --- C. DATABASE INSERT ---
      const insertSql = `
        INSERT INTO drv_fuel_expenses 
        (driver_id, station_name, liters, price_per_liter, total_amount, payment_mode, transaction_id, receipt_image, fuel_meter_image, oil_meter_image, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const initialStatus = "Pending";
      const values = [
        driver_id,
        station_name,
        liters,
        price_per_liter,
        total_amount,
        paymentModeInt,
        transaction_id || null,
        receiptFilename,
        fuelMeterFilename,
        oilMeterFilename,
        initialStatus,
      ];

      const [result] = await db.execute(insertSql, values);

      return res.status(201).json({
        success: true,
        message: "Refuel added successfully",
        id: result.insertId,
        status: initialStatus,
      });

    } catch (error) {
      console.error("Server Error:", error);
      return res.status(500).json({ success: false, message: "Server Error: " + error.message });
    }
  });
});

// --- GET HISTORY ---
router.get("/fuelloghistory/:driver_id", async (req, res) => {
  try {
    const { driver_id } = req.params;

    if (!driver_id) {
      return res.status(400).json({ success: false, message: "Driver ID is required" });
    }

    const sql = `
      SELECT 
        id, station_name, liters, price_per_liter, total_amount, 
        status, created_at, receipt_image, fuel_meter_image, oil_meter_image 
      FROM drv_fuel_expenses 
      WHERE driver_id = ? 
      ORDER BY created_at DESC LIMIT 5
    `;

    const [rows] = await db.execute(sql, [driver_id]);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;