import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// More permissive socket configuration for production
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  allowEIO3: true, // Allow Engine.IO v3 clients
  transports: ["websocket", "polling"], // Support both transport methods
});

const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

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
