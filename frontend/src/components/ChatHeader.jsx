import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

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
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {safeOnlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
