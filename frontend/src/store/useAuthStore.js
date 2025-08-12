import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// ✅ Middleware to ensure onlineUsers is always an array
const ensureArrayMiddleware = (config) => (set, get, api) => {
  const originalSetState = api.setState;
  
  api.setState = (partial, replace) => {
    // If setting onlineUsers, ensure it's always an array
    if (partial && typeof partial === 'object' && 'onlineUsers' in partial) {
      const onlineUsers = partial.onlineUsers;
      if (!Array.isArray(onlineUsers)) {
        console.warn("⚠️ onlineUsers is not an array, converting:", onlineUsers);
        partial.onlineUsers = Array.isArray(onlineUsers) ? onlineUsers : [];
      }
    }
    
    originalSetState(partial, replace);
  };
  
  return config(set, get, api);
};

export const useAuthStore = create(
  ensureArrayMiddleware((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [], // ✅ Always initialize as empty array
    socket: null,
    
    checkAuth: async () => {
      try {
        const res = await axiosInstance.get("/auth/check");
        set({ authUser: res.data, onlineUsers: [] }); // ✅ Reset onlineUsers
        get().connectSocket();
      } catch (error) {
        console.log("Error in checkAuth:", error);
        set({ authUser: null, onlineUsers: [] }); // ✅ Reset onlineUsers on error
      } finally {
        set({ isCheckingAuth: false });
      }
    },

    signup: async (data) => {
      set({ isSigningUp: true });
      try {
        const res = await axiosInstance.post("/auth/signup", data);
        set({ authUser: res.data, onlineUsers: [] }); // ✅ Reset onlineUsers
        toast.success("Account created successfully");
        get().connectSocket();
      } catch (error) {
        toast.error(error.response?.data?.message || "Signup failed");
      } finally {
        set({ isSigningUp: false });
      }
    },

    login: async (data) => {
      set({ isLoggingIn: true });
      try {
        const res = await axiosInstance.post("/auth/login", data);
        set({ authUser: res.data, onlineUsers: [] }); // ✅ Reset onlineUsers
        toast.success("Logged in successfully");
        get().connectSocket();
      } catch (error) {
        const message = error.response?.data?.msg || "Login failed";
        toast.error(message);
      } finally {
        set({ isLoggingIn: false });
      }
    },
    
    logout: async () => {
      try {
        await axiosInstance.post("/auth/logout");
        
        // ✅ Clear all chat data when logging out
        const { clearAllChatData } = await import('./useChatStore');
        if (clearAllChatData) {
          clearAllChatData();
        }
        
        set({ authUser: null, onlineUsers: [] }); // ✅ Reset onlineUsers
        toast.success("Logged out successfully");
        get().disconnectSocket();
      } catch (error) {
        toast.error(error.response?.data?.message || "Logout failed");
      }
    },

    updateProfile: async (data) => {
      set({ isUpdatingProfile: true });
      try {
        const res = await axiosInstance.put("/auth/update-profile", data);
        set({ authUser: res.data });
        toast.success("Profile updated successfully");
      } catch (error) {
        console.error("Error in updateProfile:", error);
        const message = error.response?.data?.msg || "Failed to update profile";
        toast.error(message);
      } finally {
        set({ isUpdatingProfile: false });
      }
    },

    connectSocket: () => {
      const { authUser } = get();
      if (!authUser || get().socket?.connected) return;

      // Use the same backend URL logic as socket.js
      const backendUrl = import.meta.env.MODE === "development" 
        ? "http://localhost:5001" 
        : "https://chatapp-u3zb.onrender.com";

      const socket = io(backendUrl, {
        query: {
          userId: authUser._id,
        },
        withCredentials: true,
      });

      socket.connect();
      set({ socket: socket });

      socket.on("getOnlineUsers", (userIds) => {
        // ✅ Ensure userIds is always an array with multiple safety checks
        let safeUserIds = [];
        
        if (userIds) {
          if (Array.isArray(userIds)) {
            safeUserIds = userIds;
          } else if (typeof userIds === 'string') {
            safeUserIds = [userIds];
          } else if (typeof userIds === 'object' && userIds !== null) {
            safeUserIds = Object.keys(userIds);
          }
        }
        
        console.log("📡 Received onlineUsers:", userIds, "Converted to:", safeUserIds);
        set({ onlineUsers: safeUserIds });
      });

      socket.on("connect", () => {
        console.log("✅ Socket connected successfully");
        // ✅ Initialize onlineUsers as empty array when socket connects
        set({ onlineUsers: [] });
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        // ✅ Reset onlineUsers on connection error
        set({ onlineUsers: [] });
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
        // ✅ Reset onlineUsers on disconnect
        set({ onlineUsers: [] });
      });
    },

    disconnectSocket: () => {
      const { socket } = get();
      if (socket?.connected) {
        socket.disconnect();
        set({ socket: null, onlineUsers: [] }); // ✅ Reset onlineUsers
      }
    },
  }))
);
