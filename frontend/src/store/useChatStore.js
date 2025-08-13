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
          
          // ✅ Update user order (sent message - user stays at top)
          get().updateUserOrder(selectedUser._id, true);
          
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
          
          // ✅ Update user order (received message - user moves to top)
          get().updateUserOrder(newMessage.senderId, false);
          
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
                try {
                  new Notification(`New message from ${user.fullName}`, {
                    body: newMessage.text || 'You have a new message',
                    icon: user.profilePic || '/avatar.png',
                    tag: `chat-${newMessage.senderId}`,
                    requireInteraction: false,
                    silent: false,
                    badge: '/avatar.png',
                    image: newMessage.image || undefined,
                  });
                  console.log("🔔 Browser notification sent successfully");
                } catch (error) {
                  console.error("❌ Failed to show browser notification:", error);
                }
              }
            }
            
            // ✅ Show toast notification with enhanced styling
            const { users } = get();
            const user = users.find(u => u._id === newMessage.senderId);
            if (user) {
              toast.success(`New message from ${user.fullName}`, {
                duration: 4000,
                position: 'top-right',
                style: {
                  background: '#10b981',
                  color: '#ffffff',
                  fontWeight: '600',
                },
                icon: '💬',
              });
            }
            
            // ✅ Force immediate UI update for user reordering
            setTimeout(() => {
              const currentUsers = get().users;
              if (Array.isArray(currentUsers)) {
                set({ users: [...currentUsers] });
                console.log("🔄 Forced UI update for immediate user reordering");
              }
            }, 100);
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

      // ✅ Handle user reordering when messages are sent/received
      updateUserOrder: (userId, isMessageSent = false) => {
        console.log(`🔄 Updating user order for ${userId}, message sent: ${isMessageSent}`);
        
        // If it's a sent message, we don't need to reorder since selectedUser stays at top
        if (isMessageSent) {
          console.log("✅ Message sent - user stays at top (no reordering needed)");
          return;
        }
        
        // If it's a received message, the user will automatically move to top
        // due to unread count increase in getSortedUsers
        console.log("📨 Message received - user will move to top due to unread count");
        
        // ✅ Force a re-render by updating the users array
        // This ensures the UI updates immediately when a new message is received
        const currentUsers = get().users;
        if (Array.isArray(currentUsers)) {
          // Create a new array reference to trigger re-render
          set({ users: [...currentUsers] });
          console.log("🔄 Triggered users array update for immediate re-render");
        }
      },

      // ✅ Get sorted users (active conversations first, then by unread count)
      getSortedUsers: () => {
        const { users, notifications, selectedUser } = get();
        const safeUsers = Array.isArray(users) ? users : [];
        const safeNotifications = notifications || {};
        
        const sortedUsers = safeUsers.sort((a, b) => {
          // 1. Selected user (current conversation) always stays at top
          if (selectedUser && a._id === selectedUser._id) return -1;
          if (selectedUser && b._id === selectedUser._id) return 1;
          
          // 2. Sort by unread count (highest first)
          const aNotifications = safeNotifications[a._id] || [];
          const bNotifications = safeNotifications[b._id] || [];
          
          const aUnread = aNotifications.filter(n => !n.read).length;
          const bUnread = bNotifications.filter(n => !n.read).length;
          
          if (aUnread !== bUnread) {
            return bUnread - aUnread;
          }
          
          // 3. If same unread count, sort by last message time (most recent first)
          const aLastMessage = get().getLastMessage(a._id);
          const bLastMessage = get().getLastMessage(b._id);
          
          if (aLastMessage && bLastMessage) {
            return new Date(bLastMessage.createdAt) - new Date(aLastMessage.createdAt);
          }
          
          if (aLastMessage) return -1;
          if (bLastMessage) return 1;
          
          // 4. If no messages, maintain original order
          return 0;
        });
        
        // Log the sorting results for debugging
        if (sortedUsers.length > 0) {
          console.log("📋 User order after sorting:");
          sortedUsers.forEach((user, index) => {
            const unreadCount = (safeNotifications[user._id] || []).filter(n => !n.read).length;
            const isSelected = selectedUser && user._id === selectedUser._id;
            const lastMessage = get().getLastMessage(user._id);
            const lastMessageTime = lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString() : 'No messages';
            console.log(`${index + 1}. ${user.fullName} - Unread: ${unreadCount} ${isSelected ? '(SELECTED - STAYS AT TOP)' : ''} - Last: ${lastMessageTime}`);
          });
        }
        
        return sortedUsers;
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
          
          // ✅ Update user order after marking as read
          console.log(`🔄 User ${userId} messages marked as read - order will update automatically`);
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

      // ✅ Handle real-time message updates with immediate user reordering
      handleRealTimeMessage: (newMessage) => {
        console.log("📨 Handling real-time message:", newMessage);
        
        // Add message to store
        get().addMessage(newMessage);
        
        // ✅ Force immediate user reordering
        const currentUsers = get().users;
        if (Array.isArray(currentUsers)) {
          // Create a new array reference to trigger re-render
          set({ users: [...currentUsers] });
          console.log("🔄 Immediate user reordering triggered");
        }
        
        // ✅ Update notifications for the sender
        const { authUser } = useAuthStore.getState();
        if (newMessage.senderId !== authUser?._id) {
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
          
          // ✅ Show enhanced notification
          get().showEnhancedNotification(newMessage);
        }
      },

      // ✅ Handle global message notifications (for messages not in current conversation)
      handleGlobalMessage: (newMessage) => {
        console.log("🌍 Handling global message:", newMessage);
        
        const { authUser } = useAuthStore.getState();
        if (newMessage.senderId === authUser?._id) {
          console.log("✅ Message from self, skipping global handling");
          return;
        }
        
        // ✅ Update notifications for the sender
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
        
        // ✅ Force immediate user reordering to move sender to top
        const currentUsers = get().users;
        if (Array.isArray(currentUsers)) {
          set({ users: [...currentUsers] });
          console.log("🔄 Global message triggered immediate user reordering");
        }
        
        // ✅ Show enhanced notification
        get().showEnhancedNotification(newMessage);
      },

      // ✅ Show enhanced notification with sound and visual feedback
      showEnhancedNotification: (message) => {
        const { users } = get();
        const user = users.find(u => u._id === message.senderId);
        
        if (!user) return;
        
        // Play notification sound
        audioManager.playNotification();
        
        // Show browser notification if app is not focused
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`New message from ${user.fullName}`, {
              body: message.text || 'You have a new message',
              icon: user.profilePic || '/avatar.png',
              tag: `chat-${message.senderId}`,
              requireInteraction: false,
              silent: false,
              badge: '/avatar.png',
              image: message.image || undefined,
            });
            console.log("🔔 Enhanced browser notification sent");
          } catch (error) {
            console.error("❌ Failed to show enhanced notification:", error);
          }
        }
        
        // Show enhanced toast notification
        toast.success(`New message from ${user.fullName}`, {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#10b981',
            color: '#ffffff',
            fontWeight: '600',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          icon: '💬',
        });
      },

      // ✅ Subscribe to messages for current conversation
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
            // Use enhanced message handling for better real-time updates
            get().handleRealTimeMessage(newMessage);
          } else {
            console.log("⚠️ Message not for current conversation, ignoring");
          }
        });
      },

      // ✅ Unsubscribe from messages
      unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
          socket.off("newMessage");
        }
      },

      // ✅ Subscribe to global messages (for all incoming messages)
      subscribeToGlobalMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) {
          console.log("⚠️ No socket connection, skipping global message subscription");
          return;
        }

        console.log("📡 Subscribing to global messages");

        socket.on("newMessage", (newMessage) => {
          console.log("📨 Received new message:", newMessage);
          
          // ✅ Handle messages for the current conversation
          get().handleRealTimeMessage(newMessage);
          
          // ✅ Handle global messages (messages not in current conversation)
          get().handleGlobalMessage(newMessage);
        });
      },

      unsubscribeFromGlobalMessages: () => {
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
