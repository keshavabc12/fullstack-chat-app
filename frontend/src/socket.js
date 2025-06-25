// socket.js
import { io } from "socket.io-client";

export const connectSocket = (userId) => {
  return io("https://fullstack-chat-app.onrender.com", {
    query: { userId },
    withCredentials: true,
  });
};
