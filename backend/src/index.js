import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import cors from "cors";
import { app, server } from "./lib/socket.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

// Debug: Log current directory structure
console.log("🔍 Current directory:", __dirname);
console.log("🔍 Process cwd:", process.cwd());

// Simple CORS configuration
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
}));

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    backendDir: __dirname,
    cwd: process.cwd()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  try {
    console.log("🚀 Setting up static file serving for production...");
    
    // List possible paths and check what exists
    const possiblePaths = [
      path.join(__dirname, "../frontend/dist"),
      path.join(__dirname, "../../frontend/dist"),
      path.join(__dirname, "../../../frontend/dist"),
      path.join(process.cwd(), "frontend/dist"),
      path.join(process.cwd(), "../frontend/dist")
    ];
    
    console.log("🔍 Checking possible frontend paths:");
    possiblePaths.forEach((testPath, index) => {
      try {
        const exists = fs.existsSync(testPath);
        console.log(`  ${index + 1}. ${testPath} - ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        if (exists) {
          try {
            const files = fs.readdirSync(testPath);
            console.log(`     Contents: ${files.join(', ')}`);
          } catch (e) {
            console.log(`     Error reading contents: ${e.message}`);
          }
        }
      } catch (e) {
        console.log(`  ${index + 1}. ${testPath} - ❌ ERROR: ${e.message}`);
      }
    });
    
    // Find the correct path
    let staticPath = null;
    for (const testPath of possiblePaths) {
      try {
        if (fs.existsSync(testPath) && fs.existsSync(path.join(testPath, "index.html"))) {
          staticPath = testPath;
          console.log(`✅ Found frontend dist at: ${testPath}`);
          break;
        }
      } catch (e) {
        console.log(`❌ Error checking path: ${testPath} - ${e.message}`);
      }
    }
    
    if (staticPath) {
      app.use(express.static(staticPath));
      
      app.get("*", (req, res) => {
        res.sendFile(path.join(staticPath, "index.html"));
      });
      console.log("✅ Static files configured successfully");
    } else {
      console.log("⚠️ Frontend dist folder not found, skipping static file serving");
      console.log("💡 This means the frontend build may not have completed successfully");
    }
  } catch (error) {
    console.error("❌ Error setting up static files:", error);
  }
}

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
