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
        console.log("📥 getMessages called for userId:", userId);
        set({ isMessagesLoading: true });
        try {
          // First try to get messages from localStorage for this specific conversation
          const allStoredMessages = get().messages;
          const conversationMessages = allStoredMessages.filter(
            msg => (msg.senderId === userId || msg.receiverId === userId)
          );
          console.log("💾 Found stored messages for this conversation:", conversationMessages.length);
          
          if (conversationMessages.length > 0) {
            // Use stored messages for this conversation first for instant display
            set({ messages: conversationMessages });
            console.log("✅ Using stored messages for instant display");
          }
          
          // Then fetch fresh messages from API for this specific conversation
          console.log("🌐 Fetching fresh messages from API for user:", userId);
          const res = await axiosInstance.get(`/messages/${userId}`);
          const freshMessages = Array.isArray(res.data) ? res.data : [];
          console.log("📡 Received fresh messages:", freshMessages.length);
          
          // Replace the messages with only the conversation messages
          // Don't merge with other conversations - each chat should be separate
          set({ messages: freshMessages });
          console.log("🔄 Set messages for this conversation:", freshMessages.length);
          
        } catch (error) {
          console.error("❌ Error in getMessages:", error);
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
        console.log("📤 sendMessage called with:", { messageData, selectedUser, currentMessages: messages });
        
        try {
          const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
          console.log("✅ Message sent successfully:", res.data);
          
          // ✅ Add the new message to the current conversation
          const safeMessages = Array.isArray(messages) ? messages : [];
          const newMessages = [...safeMessages, res.data];
          console.log("📝 Updated messages array for this conversation:", newMessages);
          
          set({ messages: newMessages });
        } catch (error) {
          console.error("❌ Failed to send message:", error);
          toast.error(error.response?.data?.message || "Failed to send message");
        }
      },

      // ✅ Add message to store (for real-time updates)
      addMessage: (newMessage) => {
        const currentMessages = get().messages;
        const { selectedUser } = get();
        
        // Only add message if it belongs to the current conversation
        if (!selectedUser) {
          console.log("⚠️ No selected user, skipping message add");
          return;
        }
        
        const isMessageForCurrentConversation = 
          (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id);
        
        if (!isMessageForCurrentConversation) {
          console.log("⚠️ Message not for current conversation, skipping:", {
            messageSender: newMessage.senderId,
            messageReceiver: newMessage.receiverId,
            selectedUser: selectedUser._id
          });
          return;
        }
        
        const safeMessages = Array.isArray(currentMessages) ? currentMessages : [];
        
        // Check if message already exists to avoid duplicates
        const messageExists = safeMessages.some(msg => msg._id === newMessage._id);
        if (!messageExists) {
          const updatedMessages = [...safeMessages, newMessage];
          set({ messages: updatedMessages });
          console.log("✅ Added new message to current conversation:", newMessage._id);
          
          // ✅ Add notification for new message (call directly to avoid recursion)
          const { authUser } = useAuthStore.getState();
          if (newMessage.senderId !== authUser?._id) {
            // Add notification directly
            const currentNotifications = get().notifications;
            const userNotifications = currentNotifications[newMessage.senderId] || [];
            
            set({
              notifications: {
                ...currentNotifications,
                [newMessage.senderId]: [...userNotifications, {
                  id: newMessage._id,
                  text: newMessage.text || 'New message',
                  timestamp: new Date().toISOString(),
                  read: false
                }]
              }
            });
            
            // ✅ Play notification sound
            audioManager.playNotification();
            
            // ✅ Show browser notification if app is not focused
            if (document.hidden) {
              const { users } = get();
              const user = users.find(u => u._id === newMessage.senderId);
              if (user && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(`New message from ${user.fullName}`, {
                  body: newMessage.text || 'You have a new message',
                  icon: user.profilePic || '/avatar.png',
                  tag: `chat-${newMessage.senderId}`,
                });
              }
            }
            
            // ✅ Show toast notification
            const { users } = get();
            const user = users.find(u => u._id === newMessage.senderId);
            if (user) {
              toast.success(`New message from ${user.fullName}`, {
                duration: 4000,
                position: 'top-right',
              });
            }
          }
        } else {
          console.log("⚠️ Message already exists, skipping duplicate:", newMessage._id);
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
        
        // Filter messages for this specific conversation
        const userMessages = safeMessages.filter(
          msg => (msg.senderId === userId || msg.receiverId === userId)
        );
        
        const lastMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
        console.log(`📝 Last message for user ${userId}:`, lastMessage ? lastMessage.text : 'None');
        
        return lastMessage;
      },

      // ✅ Mark messages as read for a specific user
      markMessagesAsRead: (userId) => {
        const currentMessages = get().messages;
        const safeMessages = Array.isArray(currentMessages) ? currentMessages : [];
        
        // Only mark messages as read for the current conversation
        const updatedMessages = safeMessages.map(msg => {
          if (msg.receiverId === userId && !msg.read) {
            return { ...msg, read: true };
          }
          return msg;
        });
        
        set({ messages: updatedMessages });
        console.log(`✅ Marked messages as read for user: ${userId}`);
        
        // ✅ Also mark notifications as read (call directly to avoid recursion)
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

      // ✅ Clear messages for a specific user
      clearUserMessages: (userId) => {
        const currentMessages = get().messages;
        const safeMessages = Array.isArray(currentMessages) ? currentMessages : [];
        
        // Only clear messages for this specific conversation
        const filteredMessages = safeMessages.filter(
          msg => !(msg.senderId === userId || msg.receiverId === userId)
        );
        
        set({ messages: filteredMessages });
        console.log(`🗑️ Cleared messages for user: ${userId}`);
      },

      // ✅ Clear all chat data (for logout)
      clearAllChatData: () => {
        set({ messages: [], users: [], selectedUser: null, notifications: {} });
      },

      subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) {
          console.log("⚠️ No selected user, skipping message subscription");
          return;
        }

        const socket = useAuthStore.getState().socket;
        if (!socket) {
          console.log("⚠️ No socket connection, skipping message subscription");
          return;
        }

        console.log("📡 Subscribing to messages for user:", selectedUser._id);

        socket.on("newMessage", (newMessage) => {
          console.log("📨 Received new message:", newMessage);
          
          // Only handle messages for the current conversation
          const isMessageForCurrentConversation = 
            (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id);
          
          if (isMessageForCurrentConversation) {
            console.log("✅ Message is for current conversation, adding it");
            get().addMessage(newMessage);
          } else {
            console.log("⚠️ Message not for current conversation, ignoring");
          }
        });
      },

      unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
          socket.off("newMessage");
        }
      },

      // Set selected user for chat
      setSelectedUser: (selectedUser) => {
        console.log("👤 Setting selected user:", selectedUser?._id);
        
        // Clear current messages when switching users to ensure clean separation
        if (selectedUser) {
          set({ selectedUser, messages: [] });
          console.log("🧹 Cleared messages for new conversation");
        } else {
          set({ selectedUser: null, messages: [] });
          console.log("🧹 Cleared messages and selected user");
        }
      },
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
      // ✅ Add version to handle storage updates
      version: 1,
      // ✅ Migrate old storage format if needed
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Clear old message format
          return { ...persistedState, messages: [] };
        }
        return persistedState;
      },
    }
  )
);
