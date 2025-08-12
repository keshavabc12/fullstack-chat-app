import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Bell, Settings, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const { authUser, logout } = useAuthStore();
  const { notifications } = useChatStore();

  // ✅ Calculate total unread notifications
  const totalUnread = Object.values(notifications || {}).reduce((total, userNotifs) => {
    return total + userNotifs.filter(n => !n.read).length;
  }, 0);

  return (
    <nav className="navbar bg-base-100 border-b border-base-300 fixed top-0 z-40">
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost text-xl">
          💬 ChatApp
        </Link>
      </div>

      <div className="navbar-end">
        <div className="flex items-center gap-2">
          {/* Notification Bell with Badge */}
          <div className="relative">
            <button className="btn btn-ghost btn-circle">
              <Bell className="size-5" />
            </button>
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 badge badge-primary badge-sm">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>

          {/* Profile Menu */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  alt="Profile"
                  src={authUser?.profilePic || "/avatar.png"}
                  onError={(e) => {
                    e.target.src = "/avatar.png";
                  }}
                />
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="size-4" />
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/settings" className="flex items-center gap-2">
                  <Settings className="size-4" />
                  Settings
                </Link>
              </li>
              <li>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-error"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
