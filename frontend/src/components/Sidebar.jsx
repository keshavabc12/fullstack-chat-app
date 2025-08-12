import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers = [] } = useAuthStore(); // ✅ fallback to empty array
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  
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
  
  // ✅ Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];
  
  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? safeUsers.filter((user) => user?._id && safeOnlineUsers.includes(user._id))
    : safeUsers;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        {/* TODO: Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({safeOnlineUsers.length - 1} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) =>
          user && user._id ? (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""
              }`}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic && user.profilePic.trim() !== "" ? user.profilePic : "/avatar.png"}
                  alt={user.fullName || "User avatar"}
                  className="size-12 object-cover rounded-full"
                />
                {safeOnlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
              </div>

              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                  {safeOnlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ) : null
        )}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
