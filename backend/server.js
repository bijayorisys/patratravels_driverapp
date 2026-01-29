import express from "express";
import dotenv from "dotenv";

// STEP 1: LOAD CONFIG & TIMEZONE FIRST (Before other imports)
dotenv.config({ path: "./.env" });
process.env.TZ = process.env.TZ || "Asia/Kolkata";

import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

// STEP 2: NOW IMPORT DATABASE & ROUTES
// This ensures 'db' connects using the correct Asia/Kolkata time
import db from "./config/database.js";
import locationRoutes from "./routes/locationRoutes.js"; 
import authRoutes from "./routes/authRoutes.js";
import SOS from "./routes/adminsos.js";
import adminRoutes from "./routes/adminRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import dutyRoutes from "./routes/dutyRoutes.js";
import attendanceHistoryRoutes from "./routes/attendanceHistoryRoutes.js";
import DriverTriproutes from "./routes/DrivertripRoutes.js";
import refuelRoutes from "./routes/refuelRoutes.js";
import contactRoutes from "./routes/contactpageroutes.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import util from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 8081;

const logFile = fs.createWriteStream(path.join(__dirname, "server_error.log"), {
  flags: "a",
});
const logStdout = process.stdout;

// Helper function to get India Time
const getISTTime = () => {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // Returns like "07:30:05 pm"
  });
};

console.log = function (d) {
  logFile.write(util.format(d) + "\n");
  logStdout.write(util.format(d) + "\n");
};

console.error = function (d) {
  // FIX: Use the custom IST function instead of toISOString()
  const timestamp = getISTTime();
  const message = `[${timestamp}] ERROR: ${util.format(d)}\n`;

  logFile.write(message);
  logStdout.write(util.format(d) + "\n");
};

// --- 1. SETUP SOCKET.IO ---
// ##############  new #############
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000","http://192.168.0.37:3000","https://app.patratravels.com","https://appadmin.patratravels.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- 2. CREATE UPLOAD DIRECTORIES ---
const uploadDirs = [
  path.join(__dirname, "uploads", "selfies"),
  path.join(__dirname, "uploads", "profile"),
  path.join(__dirname, "uploads", "documents"),
  path.join(__dirname, "uploads", "odometer"),
  path.join(__dirname, "uploads", "chklist_img"),
  path.join(__dirname, "uploads", "refuel_receipt"), 
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ##############  new #############
app.use(cors({
  origin: ["http://localhost:3000", "https://app.patratravels.com", "https://appadmin.patratravels.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 3. SERVE STATIC UPLOADS ---
// app.use(
//   "/uploads/selfies",
//   express.static(path.join(__dirname, "uploads", "selfies"))
// );
// app.use(
//   "/uploads/profile",
//   express.static(path.join(__dirname, "uploads", "profile"))
// );
// app.use(
//   "/uploads/documents",
//   express.static(path.join(__dirname, "uploads", "documents"))
// );
// app.use(
//   "/uploads/odometer",
//   express.static(path.join(__dirname, "uploads", "odometer"))
// );
// app.use(
//   "/uploads/chklist_img",
//   express.static(path.join(__dirname, "uploads", "chklist_img"))
// );
// app.use(
//   "/uploads/refuel_receipt",
//   express.static(path.join(__dirname, "uploads", "refuel_receipt"))
// );
// ##############  new #############
// --- 3. SERVE STATIC UPLOADS (REPLACE YOUR OLD SECTION 3) ---
const staticOptions = {
  setHeaders: (res) => {
    res.set("Access-Control-Allow-Origin", "https://appadmin.patratravels.com");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
  }
};

app.use("/uploads/selfies", express.static(path.join(__dirname, "uploads", "selfies"), staticOptions));
app.use("/uploads/profile", express.static(path.join(__dirname, "uploads", "profile"), staticOptions));
app.use("/uploads/documents", express.static(path.join(__dirname, "uploads", "documents"), staticOptions));
app.use("/uploads/odometer", express.static(path.join(__dirname, "uploads", "odometer"), staticOptions));
app.use("/uploads/chklist_img", express.static(path.join(__dirname, "uploads", "chklist_img"), staticOptions));
app.use("/uploads/refuel_receipt", express.static(path.join(__dirname, "uploads", "refuel_receipt"), staticOptions));

// --- 4. SOCKET LOGIC ---
io.on("connection", (socket) => {
  // console.log(`New connection: ${socket.id}`);
  socket.on("join_app_session", (driverRegNo) => {
    socket.join(driverRegNo);
    console.log(`Driver ${driverRegNo} is now active.`);
  });
  socket.on("disconnect", () => {
    console.log("A driver went inactive.");
  });
});

async function startServer() {
  try {
    await db.testConnection();

    // --- 5. API ROUTES ---
    app.use("/api/v1/location", locationRoutes);
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/sos", SOS);
    app.use("/api/v1/attendance", attendanceRoutes);
    app.use("/api/v1/duty", dutyRoutes);
    app.use("/api/v1/", attendanceHistoryRoutes);
    app.use("/api/v1/admin", adminRoutes);
    app.use("/api/v1/driver", DriverTriproutes);
    app.use("/api/v1/refuel", refuelRoutes);
    app.use("/api/v1/contact", contactRoutes);

    // --- 6. SERVE REACT BUILD FILES (FROM 'public') ---

    // const buildPath = path.join(__dirname, "public");

    // app.use(express.static(buildPath));

    // app.get("*", (req, res) => {
    //   res.sendFile(path.join(buildPath, "index.html"));
    // });

    // --- 7. ERROR HANDLER ---
    app.use((err, req, res, next) => {
      console.error("Server Error:", err.stack);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    });

    httpServer.listen(PORT, () => {
      console.log(`Your Server running on Port: ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}
startServer();
