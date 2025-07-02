import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://your-frontend.onrender.com"], // ✅ Add frontend Render URL here too
  },
});

const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  console.log("👉 userId from frontend:", userId); // ✅ Optional debug

  if (!userId) {
    console.error("❌ No userId provided in socket handshake");
    return;
  }

  userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
