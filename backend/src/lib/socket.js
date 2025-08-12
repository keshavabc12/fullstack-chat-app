import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io CORS configuration for production with credentials
const socketCorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === "production" 
      ? [
          "https://chatapp-u3zb.onrender.com",
          "https://chatapp1-0gwj.onrender.com",
          "https://chatapp-0gwj.onrender.com",
          "https://chatapp.onrender.com"
        ]
      : ["http://localhost:3000", "http://localhost:5173", "http://localhost:4173", "http://localhost:5001"];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`🚫 Socket CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by Socket CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  credentials: true,
};

const io = new Server(server, {
  cors: socketCorsOptions,
  allowEIO3: true, // Allow Engine.IO v3 clients
  transports: ["websocket", "polling"], // Support both transport methods
});

// Handle connection errors
io.engine.on("connection_error", (err) => {
  console.error("❌ Socket.io connection error:", err);
  console.error("🚫 CORS or transport error details:", {
    type: err.type,
    message: err.message,
    context: err.context
  });
});

const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);
  console.log("🌐 Socket origin:", socket.handshake.headers.origin);
  console.log("🔑 Socket query:", socket.handshake.query);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`✅ User ${userId} mapped to socket ${socket.id}`);
    
    // Emit current online users to all clients
    const onlineUserIds = Object.keys(userSocketMap);
    io.emit("getOnlineUsers", onlineUserIds);
    console.log(`📡 Emitted online users: ${onlineUserIds.join(', ')}`);
  }

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      const onlineUserIds = Object.keys(userSocketMap);
      io.emit("getOnlineUsers", onlineUserIds);
      console.log(`📡 Updated online users after disconnect: ${onlineUserIds.join(', ')}`);
    }
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("❌ Socket error:", error);
  });
});

export { io, app, server };
