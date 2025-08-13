import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import GlobalVideoCallHandler from "./components/GlobalVideoCallHandler";
import VideoCallDebug from "./components/VideoCallDebug";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect, useState } from "react";
import { Loader, Bell, X } from "lucide-react";
import { Toaster } from "react-hot-toast";
import useTabTitle from "./hooks/useTabTitle.js";

// ✅ Notification Permission Component
const NotificationPermission = () => {
  const [showRequest, setShowRequest] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    // Check if we should show the notification request
    if (Notification.permission === 'default' && !localStorage.getItem('notification-requested')) {
      // Wait a bit before showing the request
      const timer = setTimeout(() => {
        setShowRequest(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem('notification-requested', 'true');
      setShowRequest(false);
      
      if (result === 'granted') {
        // Show a test notification
        new Notification('Notifications Enabled!', {
          body: 'You will now receive notifications for new messages',
          icon: '/avatar.png',
        });
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  const dismissRequest = () => {
    setShowRequest(false);
    localStorage.setItem('notification-requested', 'true');
  };

  if (!showRequest || permission !== 'default') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start gap-3">
        <Bell className="size-6 text-primary mt-1" />
        <div className="flex-1">
          <h3 className="font-medium text-base">Enable Notifications</h3>
          <p className="text-sm text-base-content/70 mt-1">
            Get notified when you receive new messages, even when the app is not focused.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={requestPermission}
              className="btn btn-primary btn-sm"
            >
              Enable
            </button>
            <button
              onClick={dismissRequest}
              className="btn btn-ghost btn-sm"
            >
              Not Now
            </button>
          </div>
        </div>
        <button
          onClick={dismissRequest}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};

// ✅ Error Boundary Component
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (error, errorInfo) => {
      console.error("🚨 Error caught by boundary:", error, errorInfo);
      setHasError(true);
      setError(error);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-error mb-4">Something went wrong</h2>
          <p className="text-base-content/70 mb-4">
            {error?.message || "An unexpected error occurred"}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return children;
};

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();

  // ✅ Update browser tab title with notification count
  useTabTitle();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <ErrorBoundary>
      <div data-theme={theme}>
        <Navbar />
        <Routes>
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        </Routes>
        <Toaster />
        <NotificationPermission />
        {/* Global Video Call Handler - handles incoming calls anywhere in the app */}
        {authUser && <GlobalVideoCallHandler />}
        {/* Video Call Debug - only show in development */}
        {authUser && process.env.NODE_ENV === "development" && <VideoCallDebug />}
      </div>
    </ErrorBoundary>
  );
};

export default App;
