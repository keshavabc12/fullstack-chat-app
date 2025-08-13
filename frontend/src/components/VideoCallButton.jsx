import { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import VideoCall from "./VideoCall";
import videoCallService from "../lib/videoCallService";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const VideoCallButton = ({ selectedUser, isUserOnline }) => {
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  
  const { socket } = useAuthStore();

  // Initialize video call service when component mounts
  useEffect(() => {
    if (socket) {
      videoCallService.initialize(socket);
      
      // Set up call event handlers
      videoCallService.on("callUserOffline", handleCallUserOffline);
      videoCallService.on("callAccepted", handleCallAccepted);
      videoCallService.on("callRejected", handleCallRejected);
      
      return () => {
        videoCallService.cleanup();
      };
    }
  }, [socket]);

  const handleVideoCall = async () => {
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }
    
    // Check if user is online before initiating call
    if (!isUserOnline) {
      toast.error("User is offline, cannot initiate video call");
      return;
    }

    // Check if we have socket connection
    if (!socket) {
      toast.error("No connection to server. Please refresh the page.");
      return;
    }

    try {
      console.log("📞 Initiating video call with:", selectedUser.fullName);
      
      // Request call through video call service
      videoCallService.requestCall(selectedUser._id);
      
      // Set call in progress
      setIsCallInProgress(true);
      
      // Open video call interface
      setIsVideoCallOpen(true);
      
      toast.success(`Calling ${selectedUser.fullName}...`);
      
    } catch (error) {
      console.error("❌ Failed to initiate call:", error);
      toast.error("Failed to initiate call. Please try again.");
    }
  };

  const handleCallUserOffline = (data) => {
    if (data.userId === selectedUser._id) {
      console.log("❌ User is offline:", data.userId);
      toast.error("User is offline. Please try again later.");
      
      // Close call interface
      setIsVideoCallOpen(false);
      setIsCallInProgress(false);
    }
  };

  const handleCallAccepted = (data) => {
    console.log("✅ Call accepted:", data);
    setIsCallInProgress(false);
    // The call will be established through WebRTC signaling
  };

  const handleCallRejected = (data) => {
    console.log("❌ Call rejected:", data);
    setIsCallInProgress(false);
    
    // Close call interface
    setIsVideoCallOpen(false);
    
    toast.error("Call was rejected by the other user");
  };

  const handleCallEnd = () => {
    console.log("📞 Call ended");
    setIsVideoCallOpen(false);
    setIsCallInProgress(false);
  };

  const handleCloseCall = () => {
    if (isCallInProgress) {
      // If call is in progress, end it properly
      videoCallService.endCall(selectedUser._id);
    }
    setIsVideoCallOpen(false);
    setIsCallInProgress(false);
  };

  if (!selectedUser) return null;

  return (
    <>
      {/* Video Call Button */}
      <button
        onClick={handleVideoCall}
        disabled={!isUserOnline || isCallInProgress}
        className={`btn btn-sm btn-circle ${
          isUserOnline && !isCallInProgress 
            ? 'btn-ghost hover:btn-primary' 
            : 'btn-ghost opacity-50 cursor-not-allowed'
        }`}
        title={
          !isUserOnline 
            ? 'User is offline' 
            : isCallInProgress 
              ? 'Call in progress' 
              : 'Start video call'
        }
      >
        <Phone className="size-5" />
      </button>

      {/* Video Call Modal */}
      <VideoCall
        isOpen={isVideoCallOpen}
        onClose={handleCloseCall}
        selectedUser={selectedUser}
        onCallEnd={handleCallEnd}
        isIncomingCall={false}
      />
    </>
  );
};

export default VideoCallButton;
