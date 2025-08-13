import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";
import VideoCallButton from "./VideoCallButton";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers = [] } = useAuthStore(); // ✅ Add fallback to empty array
  
  // ✅ Ensure onlineUsers is always an array with multiple safety checks
  const safeOnlineUsers = (() => {
    if (Array.isArray(onlineUsers)) {
      return onlineUsers;
    }
    if (onlineUsers && typeof onlineUsers === 'object') {
      return Object.keys(onlineUsers);
    }
    if (typeof onlineUsers === 'string') {
      return [onlineUsers];
    }
    return [];
  })();

  // ✅ Get last message time for this user
  const getLastSeen = () => {
    const { messages } = useChatStore.getState();
    const safeMessages = Array.isArray(messages) ? messages : [];
    
    const userMessages = safeMessages.filter(
      msg => (msg.senderId === selectedUser._id || msg.receiverId === selectedUser._id)
    );
    
    if (userMessages.length > 0) {
      const lastMessage = userMessages[userMessages.length - 1];
      return lastMessage.createdAt;
    }
    return null;
  };

  const lastSeen = getLastSeen();
  const isOnline = safeOnlineUsers.includes(selectedUser._id);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
                onError={(e) => { e.target.src = "/avatar.png"; }}
              />
              {/* Online indicator */}
              {isOnline && (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
              )}
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {isOnline ? (
                <span className="text-green-500">🟢 Online</span>
              ) : lastSeen ? (
                <span>Last seen {formatMessageTime(lastSeen)}</span>
              ) : (
                <span>Offline</span>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Video Call Button */}
          <VideoCallButton 
            selectedUser={selectedUser} 
            isUserOnline={isOnline} 
          />
          
          {/* Close button */}
          <button 
            onClick={() => setSelectedUser(null)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
