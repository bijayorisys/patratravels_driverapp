import express from "express";
import db from "../config/database.js";
import axios from "axios"; 
import dotenv from "dotenv";
import { sendEmail } from "../utils/emailService.js";

dotenv.config();
const router = express.Router();

const fetchGoogleAddress = async (latitude, longitude) => {
  // console.log("📍 Fetching address from Google...");
  
  const API_KEY = process.env.GOOGLE_MAPS_KEY;
  if (!API_KEY) {
    console.error("❌ ERROR: API Key missing in .env");
    return "Location unavailable (Config Error)";
  }

  const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`;

  try {
    const response = await axios.get(googleUrl, { timeout: 5000 });
    const data = response.data;

    if (data.status === "OK" && data.results.length > 0) {
      // console.log("✅ Address Found:", data.results[0].formatted_address);
      return data.results[0].formatted_address;
    } else {
      console.error("❌ Google Error:", data.status);
      return `Lat: ${latitude}, Lng: ${longitude}`;
    }
  } catch (error) {
    console.error("🔥 Google Maps Network Error:", error.message);
    return `Lat: ${latitude}, Lng: ${longitude}`;
  }
};

// --- 2. FAST SOS ROUTE ---
router.post("/trigger", async (req, res) => {
  try {
    const { driverId, latitude, longitude } = req.body;

    // A. Fetch Driver (Fast DB Call)
    const [driverRows] = await db.execute(
      `SELECT driver_id, driver_fstname, driver_lstname, driver_phno, driver_regno 
       FROM tbl_drivers WHERE driver_regno = ?`,
      [driverId]
    );

    if (driverRows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const driver = driverRows[0];
    const fullName = `${driver.driver_fstname} ${driver.driver_lstname}`;

    res.json({ success: true, message: "SOS Triggered Successfully" });

    setImmediate(async () => {
      try {
        const locationName = await fetchGoogleAddress(latitude, longitude);

        // 2. Insert into Database
        await db.execute(
          `INSERT INTO tbl_sos_alerts (driver_id, latitude, longitude, location_name) VALUES (?, ?, ?, ?)`,
          [driver.driver_id, latitude, longitude, locationName]
        );

        // 3. Prepare Email Content
        const timeString = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        const googleMapLink = `https://www.google.com/maps?q=${latitude},${longitude}`; 

           const emailHtml = `
            <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:16px;">
              <div style="
                max-width:520px;
                margin:auto;
                background:#ffffff;
                border-radius:12px;
                overflow:hidden;
                box-shadow:0 6px 18px rgba(0,0,0,0.08);
              ">

                <!-- HEADER -->
                <div style="
                  background:#dc2626;
                  color:#ffffff;
                  padding:16px;
                  text-align:center;
                ">
                  <h2 style="margin:0; font-size:20px;">🚨 SOS ALERT</h2>
                  <p style="margin:4px 0 0; font-size:13px; opacity:0.9;">
                    Immediate attention required
                  </p>
                </div>

                <!-- BODY -->
                <div style="padding:16px; color:#111827; font-size:14px; line-height:1.5;">

                  <!-- DRIVER INFO -->
                  <div style="margin-bottom:12px;">
                    <p style="margin:0 0 6px;">
                      <strong>Driver</strong><br />
                      ${fullName} <span style="color:#6b7280;">(${driver.driver_regno})</span>
                    </p>

                    <p style="margin:0;">
                      <strong>Phone</strong><br />
                      <a href="tel:${driver.driver_phno}" style="color:#2563eb; text-decoration:none;">
                        ${driver.driver_phno}
                      </a>
                    </p>
                  </div>

                  <hr style="border:none; border-top:1px solid #e5e7eb; margin:14px 0;" />

                  <!-- LOCATION -->
                  <div style="margin-bottom:12px;">
                    <p style="margin:0 0 6px;">
                      <strong>Location</strong><br />
                      ${locationName}
                    </p>

                    <p style="margin:0; color:#6b7280; font-size:13px;">
                      Coordinates: ${latitude}, ${longitude}
                    </p>
                  </div>

                  <!-- MAP BUTTON -->
                  <div style="text-align:center; margin:16px 0;">
                    <a href="${googleMapLink}" target="_blank" style="
                      display:inline-block;
                      background:#dc2626;
                      color:#ffffff;
                      padding:10px 18px;
                      font-size:14px;
                      font-weight:bold;
                      border-radius:999px;
                      text-decoration:none;
                    ">
                      📍 View on Google Maps
                    </a>
                  </div>

                  <!-- TIME -->
                  <div style="
                    background:#f9fafb;
                    padding:10px;
                    border-radius:8px;
                    text-align:center;
                    font-size:13px;
                    color:#374151;
                  ">
                    <strong>Alert Time</strong><br />
                    ${timeString}
                  </div>

                </div>

                <!-- FOOTER -->
                <div style="
                  background:#f3f4f6;
                  padding:10px;
                  text-align:center;
                  font-size:12px;
                  color:#6b7280;
                ">
                  This is an automated emergency alert. Please respond immediately.
                </div>

              </div>
            </div>
            `;

        // 4. Send Email
        await sendEmail({
          to: process.env.ADMIN_EMAIL,
          subject: `🚨 SOS ALERT: ${fullName}`,
          html: emailHtml,
        });

      } catch (backgroundErr) {
        console.error("⚠️ SOS Background Task Error:", backgroundErr);
      }
    });

  } catch (err) {
    console.error("🔥 SOS Route Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Server busy" });
    }
  }
});

export default router;