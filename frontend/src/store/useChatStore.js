import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [], // ✅ Always initialize as empty array
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // Fetch users for sidebar
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      // ✅ Adjusted endpoint
      const res = await axiosInstance.get("/messages/users");
      // ✅ Ensure users is always an array
      const safeUsers = Array.isArray(res.data) ? res.data : [];
      set({ users: safeUsers });
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch users";
      toast.error(message);
      // ✅ Set users to empty array on error
      set({ users: [] });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Fetch messages with selected user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      // ✅ Ensure messages is always an array
      const safeMessages = Array.isArray(res.data) ? res.data : [];
      set({ messages: safeMessages });
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch messages";
      toast.error(message);
      // ✅ Set messages to empty array on error
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      // ✅ Ensure messages is always an array
      const safeMessages = Array.isArray(messages) ? messages : [];
      set({ messages: [...safeMessages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return; // ✅ Check if socket exists

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      const currentMessages = get().messages;
      // ✅ Ensure currentMessages is always an array
      const safeMessages = Array.isArray(currentMessages) ? currentMessages : [];
      
      set({
        messages: [...safeMessages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  // Set selected user for chat
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
