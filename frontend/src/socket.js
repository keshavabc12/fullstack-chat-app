// socket.js
import { io } from "socket.io-client";

export const connectSocket = (userId) => {
  return io("https://your-backend.onrender.com", {
    query: { userId },
    withCredentials: true,
  });
};
