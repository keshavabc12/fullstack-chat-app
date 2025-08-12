import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import audioManager from "../lib/audio.js";

export const useChatStore = create(
  persist(
    (set, get) => ({
      messages: [],
      users: [], // ✅ Always initialize as empty array
      selectedUser: null,
      isUsersLoading: false,
      isMessagesLoading: false,
      notifications: {}, // ✅ Track notifications for each user

      // ✅ Load messages from localStorage or fetch from API
      getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
          // First try to get messages from localStorage
          const storedMessages = get().messages.filter(
            msg => (msg.senderId === userId || msg.receiverId === userId)
          );
          
          if (storedMessages.length > 0) {
            // Use stored messages first for instant display
            set({ messages: storedMessages });
          }
          
          // Then fetch fresh messages from API
          const res = await axiosInstance.get(`/messages/${userId}`);
          const freshMessages = Array.isArray(res.data) ? res.data : [];
          
          // Merge with existing messages, avoiding duplicates
          const existingMessages = get().messages.filter(
            msg => !(msg.senderId === userId || msg.receiverId === userId)
          );
          const allMessages = [...existingMessages, ...freshMessages];
          
          set({ messages: allMessages });
        } catch (error) {
          const message = error.response?.data?.message || "Failed to fetch messages";
          toast.error(message);
          // ✅ Set messages to empty array on error
          set({ messages: [] });
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      // ✅ Fetch users for sidebar
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

      sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
          const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
          // ✅ Ensure messages is always an array
          const safeMessages = Array.isArray(messages) ? messages : [];
          const newMessages = [...safeMessages, res.data];
          set({ messages: newMessages });
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send message");
        }
      },

      // ✅ Add message to store (for real-time updates)
      addMessage: (newMessage) => {
        const currentMessages = get().messages;
        const safeMessages = Array.isArray(currentMessages) ? currentMessages : [];
        
        // Check if message already exists to avoid duplicates
        const messageExists = safeMessages.some(msg => msg._id === newMessage._id);
        if (!messageExists) {
          const updatedMessages = [...safeMessages, newMessage];
          set({ messages: updatedMessages });
          
          // ✅ Add notification for new message
          const { authUser } = useAuthStore.getState();
          if (newMessage.senderId !== authUser?._id) {
            get().addNotification(newMessage.senderId, newMessage);
          }
        }
      },

      // ✅ Add notification for a user
      addNotification: (userId, message) => {
        const currentNotifications = get().notifications;
        const userNotifications = currentNotifications[userId] || [];
        
        set({
          notifications: {
            ...currentNotifications,
            [userId]: [...userNotifications, {
              id: message._id,
              text: message.text || 'New message',
              timestamp: new Date().toISOString(),
              read: false
            }]
          }
        });
        
        // ✅ Play notification sound
        audioManager.playNotification();
        
        // ✅ Show browser notification if app is not focused
        if (document.hidden) {
          get().showBrowserNotification(userId, message);
        }
        
        // ✅ Show toast notification
        const { users } = get();
        const user = users.find(u => u._id === userId);
        if (user) {
          toast.success(`New message from ${user.fullName}`, {
            duration: 4000,
            position: 'top-right',
          });
        }
      },

      // ✅ Show browser notification
      showBrowserNotification: (userId, message) => {
        if ('Notification' in window && Notification.permission === 'granted') {
          const { users } = get();
          const user = users.find(u => u._id === userId);
          if (user) {
            new Notification(`New message from ${user.fullName}`, {
              body: message.text || 'You have a new message',
              icon: user.profilePic || '/avatar.png',
              tag: `chat-${userId}`,
            });
          }
        }
      },

      // ✅ Mark notifications as read for a user
      markNotificationsAsRead: (userId) => {
        const currentNotifications = get().notifications;
        if (currentNotifications[userId]) {
          set({
            notifications: {
              ...currentNotifications,
              [userId]: currentNotifications[userId].map(notif => ({
                ...notif,
                read: true
              }))
            }
          });
        }
      },

      // ✅ Get sorted users (new messages first)
      getSortedUsers: () => {
        const { users, notifications } = get();
        const safeUsers = Array.isArray(users) ? users : [];
        const safeNotifications = notifications || {};
        
        return safeUsers.sort((a, b) => {
          const aNotifications = safeNotifications[a._id] || [];
          const bNotifications = safeNotifications[b._id] || [];
          
          const aUnread = aNotifications.filter(n => !n.read).length;
          const bUnread = bNotifications.filter(n => !n.read).length;
          
          // Sort by unread count (highest first)
          if (aUnread !== bUnread) {
            return bUnread - aUnread;
          }
          
          // If same unread count, sort by last message time
          const aLastMessage = get().getLastMessage(a._id);
          const bLastMessage = get().getLastMessage(b._id);
          
          if (aLastMessage && bLastMessage) {
            return new Date(bLastMessage.createdAt) - new Date(aLastMessage.createdAt);
          }
          
          if (aLastMessage) return -1;
          if (bLastMessage) return 1;
          
          return 0;
        });
      },

      // ✅ Get last message for a user
      getLastMessage: (userId) => {
        const { messages } = get();
        const safeMessages = Array.isArray(messages) ? messages : [];
        
        const userMessages = safeMessages.filter(
          msg => (msg.senderId === userId || msg.receiverId === userId)
        );
        return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
      },

      // ✅ Mark messages as read for a specific user
      markMessagesAsRead: (userId) => {
        const currentMessages = get().messages;
        const safeMessages = Array.isArray(currentMessages) ? currentMessages : [];
        
        const updatedMessages = safeMessages.map(msg => {
          if (msg.receiverId === userId && !msg.read) {
            return { ...msg, read: true };
          }
          return msg;
        });
        
        set({ messages: updatedMessages });
        
        // ✅ Also mark notifications as read
        get().markNotificationsAsRead(userId);
      },

      // ✅ Clear messages for a specific user
      clearUserMessages: (userId) => {
        const currentMessages = get().messages;
        const safeMessages = Array.isArray(currentMessages) ? currentMessages : [];
        const filteredMessages = safeMessages.filter(
          msg => !(msg.senderId === userId || msg.receiverId === userId)
        );
        set({ messages: filteredMessages });
      },

      // ✅ Clear all chat data (for logout)
      clearAllChatData: () => {
        set({ messages: [], users: [], selectedUser: null, notifications: {} });
      },

      subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) return; // ✅ Check if socket exists

        socket.on("newMessage", (newMessage) => {
          const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
          if (!isMessageSentFromSelectedUser) return;

          // Use the new addMessage method
          get().addMessage(newMessage);
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
    }),
    {
      name: "chat-storage", // unique name for localStorage key
      partialize: (state) => ({
        // Only persist these fields
        messages: state.messages,
        users: state.users,
        selectedUser: state.selectedUser,
        notifications: state.notifications, // ✅ Persist notifications
      }),
      // ✅ Custom serialization to handle dates and complex objects
      serialize: (state) => JSON.stringify(state, (key, value) => {
        if (key === 'createdAt' && value) {
          return new Date(value).toISOString();
        }
        return value;
      }),
      deserialize: (str) => JSON.parse(str, (key, value) => {
        if (key === 'createdAt' && value) {
          return new Date(value);
        }
        return value;
      }),
    }
  )
);
