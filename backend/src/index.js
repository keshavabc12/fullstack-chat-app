import express from "express";
import dotenv from "dotenv";

import path from "path";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import cors from "cors";
import { app, server } from "./lib/socket.js";
dotenv.config();


const PORT = process.env.PORT || 5000;
const__dirname = path.resolve();

// ✅ Must come BEFORE routes!
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
}));

// ✅ Middleware with increased payload size limits
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);


if(process.env.NODE_ENV === "production") {

  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend","dist", "index.html"));

  })

}

// ✅ Start server after DB connection
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
  });
}).catch((err) => {
  console.error("Failed to connect to MongoDB", err);
});
