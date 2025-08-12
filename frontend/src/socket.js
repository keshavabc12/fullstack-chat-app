// socket.js
import { io } from "socket.io-client";

export const connectSocket = (userId) => {
  // Use the same backend URL as the API calls
  const backendUrl = import.meta.env.MODE === "development" 
    ? "http://localhost:5001" 
    : "https://chatapp-u3zb.onrender.com";
    
  return io(backendUrl, {
    query: { userId },
    withCredentials: true,
  });
};
