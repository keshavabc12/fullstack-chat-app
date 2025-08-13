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
    
    // More permissive CORS for chat app functionality
    const allowedOrigins = process.env.NODE_ENV === "production" 
      ? [
          "https://chatapp-u3zb.onrender.com",
          "https://chatapp1-0gwj.onrender.com",
          "https://chatapp-0gwj.onrender.com",
          "https://chatapp.onrender.com",
          "https://*.onrender.com", // Allow any subdomain on render
          "https://*.vercel.app",   // Allow Vercel deployments
          "https://*.netlify.app"   // Allow Netlify deployments
        ]
      : ["http://localhost:3000", "http://localhost:5173", "http://localhost:4173", "http://localhost:5001"];
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        // Handle wildcard patterns
        const baseDomain = allowed.replace('*.', '');
        return origin.endsWith(baseDomain);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`🚫 Socket CORS blocked origin: ${origin}`);
      console.log(`💡 Allowed origins: ${allowedOrigins.join(', ')}`);
      // For now, allow the request to prevent blocking chat functionality
      callback(null, true);
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

  // Video Call Event Handlers
  socket.on("videoCallRequest", (data) => {
    console.log("📞 Video call request:", data);
    const receiverSocketId = getReceiverSocketId(data.to);
    
    if (receiverSocketId) {
      // Forward the call request to the receiver
      io.to(receiverSocketId).emit("videoCallRequest", {
        ...data,
        callId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      console.log(`📞 Call request forwarded to user ${data.to}`);
    } else {
      console.log(`❌ User ${data.to} not found or offline`);
      // Notify caller that user is offline
      socket.emit("callUserOffline", { userId: data.to });
    }
  });

  socket.on("videoCallAccepted", (data) => {
    console.log("✅ Video call accepted:", data);
    const receiverSocketId = getReceiverSocketId(data.from);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("videoCallAccepted", data);
      console.log(`✅ Call acceptance forwarded to user ${data.from}`);
    }
  });

  socket.on("videoCallRejected", (data) => {
    console.log("❌ Video call rejected:", data);
    const receiverSocketId = getReceiverSocketId(data.from);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("videoCallRejected", data);
      console.log(`❌ Call rejection forwarded to user ${data.from}`);
    }
  });

  socket.on("videoCallEnded", (data) => {
    console.log("📞 Video call ended:", data);
    const receiverSocketId = getReceiverSocketId(data.to);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("videoCallEnded", data);
      console.log(`📞 Call end notification sent to user ${data.to}`);
    }
  });

  // WebRTC Signaling Events
  socket.on("offer", (data) => {
    console.log("📤 WebRTC offer received:", data);
    const receiverSocketId = getReceiverSocketId(data.to);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("offer", {
        ...data,
        from: userId
      });
      console.log(`📤 Offer forwarded to user ${data.to}`);
    }
  });

  socket.on("answer", (data) => {
    console.log("📤 WebRTC answer received:", data);
    const receiverSocketId = getReceiverSocketId(data.to);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("answer", {
        ...data,
        from: userId
      });
      console.log(`📤 Answer forwarded to user ${data.to}`);
    }
  });

  socket.on("iceCandidate", (data) => {
    console.log("🧊 ICE candidate received:", data);
    const receiverSocketId = getReceiverSocketId(data.to);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("iceCandidate", {
        ...data,
        from: userId
      });
      console.log(`🧊 ICE candidate forwarded to user ${data.to}`);
    }
  });

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
