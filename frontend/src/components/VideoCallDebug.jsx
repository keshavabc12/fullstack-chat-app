import { useState, useEffect } from "react";
import { Phone, Wifi, WifiOff, Camera, Mic, AlertCircle } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import videoCallService from "../lib/videoCallService";

const VideoCallDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    socketStatus: "unknown",
    videoCallServiceStatus: "unknown",
    mediaDevices: [],
    permissions: {},
    errors: []
  });

  const { socket, authUser } = useAuthStore();

  useEffect(() => {
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    return () => clearInterval(interval);
  }, [socket]);

  const updateDebugInfo = async () => {
    const newDebugInfo = {
      socketStatus: "unknown",
      videoCallServiceStatus: "unknown",
      mediaDevices: [],
      permissions: {},
      errors: []
    };

    // Check socket status
    if (socket) {
      newDebugInfo.socketStatus = socket.connected ? "connected" : "disconnected";
    } else {
      newDebugInfo.socketStatus = "not_initialized";
    }

    // Check video call service status
    if (videoCallService) {
      newDebugInfo.videoCallServiceStatus = videoCallService.getConnectionStatus();
    }

    // Check media devices
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        newDebugInfo.mediaDevices = devices.map(device => ({
          kind: device.kind,
          label: device.label || "No label",
          deviceId: device.deviceId
        }));
      }
    } catch (error) {
      newDebugInfo.errors.push(`Media devices error: ${error.message}`);
    }

    // Check permissions
    try {
      if (navigator.permissions) {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' });
        const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
        
        newDebugInfo.permissions = {
          camera: cameraPermission.state,
          microphone: microphonePermission.state
        };
      }
    } catch (error) {
      newDebugInfo.errors.push(`Permissions error: ${error.message}`);
    }

    setDebugInfo(newDebugInfo);
  };

  const testMediaAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      alert("✅ Media access test successful! Camera and microphone are working.");
    } catch (error) {
      alert(`❌ Media access test failed: ${error.message}`);
    }
  };

  const testSocketConnection = () => {
    if (socket && socket.connected) {
      alert("✅ Socket is connected and working!");
    } else {
      alert("❌ Socket is not connected. Please refresh the page.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "text-success";
      case "disconnected":
        return "text-error";
      case "not_initialized":
        return "text-warning";
      default:
        return "text-base-content";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
        return <Wifi className="w-4 h-4" />;
      case "disconnected":
        return <WifiOff className="w-4 h-4" />;
      case "not_initialized":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 max-w-md z-40">
      <div className="flex items-center gap-2 mb-3">
        <Phone className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">Video Call Debug</h3>
      </div>

      {/* Socket Status */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          {getStatusIcon(debugInfo.socketStatus)}
          <span className="text-xs font-medium">Socket Status:</span>
        </div>
        <span className={`text-xs ${getStatusColor(debugInfo.socketStatus)}`}>
          {debugInfo.socketStatus}
        </span>
      </div>

      {/* Video Call Service Status */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          {getStatusIcon(debugInfo.videoCallServiceStatus)}
          <span className="text-xs font-medium">Service Status:</span>
        </div>
        <span className={`text-xs ${getStatusColor(debugInfo.videoCallServiceStatus)}`}>
          {debugInfo.videoCallServiceStatus}
        </span>
      </div>

      {/* Media Devices */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Camera className="w-4 h-4" />
          <span className="text-xs font-medium">Media Devices:</span>
        </div>
        <div className="text-xs text-base-content/70">
          {debugInfo.mediaDevices.length > 0 ? (
            debugInfo.mediaDevices.map((device, index) => (
              <div key={index} className="ml-2">
                {device.kind}: {device.label}
              </div>
            ))
          ) : (
            <span className="text-warning">No media devices found</span>
          )}
        </div>
      </div>

      {/* Permissions */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Mic className="w-4 h-4" />
          <span className="text-xs font-medium">Permissions:</span>
        </div>
        <div className="text-xs text-base-content/70">
          <div>Camera: {debugInfo.permissions.camera || "unknown"}</div>
          <div>Microphone: {debugInfo.permissions.microphone || "unknown"}</div>
        </div>
      </div>

      {/* Errors */}
      {debugInfo.errors.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-error" />
            <span className="text-xs font-medium text-error">Errors:</span>
          </div>
          <div className="text-xs text-error">
            {debugInfo.errors.map((error, index) => (
              <div key={index} className="ml-2">{error}</div>
            ))}
          </div>
        </div>
      )}

      {/* Test Buttons */}
      <div className="flex gap-2">
        <button
          onClick={testMediaAccess}
          className="btn btn-xs btn-primary"
        >
          Test Media
        </button>
        <button
          onClick={testSocketConnection}
          className="btn btn-xs btn-secondary"
        >
          Test Socket
        </button>
        <button
          onClick={updateDebugInfo}
          className="btn btn-xs btn-ghost"
        >
          Refresh
        </button>
      </div>

      {/* User Info */}
      <div className="mt-3 pt-3 border-t border-base-300">
        <div className="text-xs text-base-content/70">
          <div>User: {authUser?.fullName || "Not logged in"}</div>
          <div>ID: {authUser?._id || "N/A"}</div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallDebug;
