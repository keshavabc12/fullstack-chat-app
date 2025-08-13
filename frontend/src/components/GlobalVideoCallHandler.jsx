import { useState, useEffect } from "react";
import IncomingCallModal from "./IncomingCallModal";
import VideoCall from "./VideoCall";
import videoCallService from "../lib/videoCallService";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const GlobalVideoCallHandler = () => {
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [currentCallUser, setCurrentCallUser] = useState(null);
  
  const { socket, authUser } = useAuthStore();
  const { users } = useChatStore();

  // Initialize video call service when component mounts
  useEffect(() => {
    if (socket) {
      videoCallService.initialize(socket);
      
      // Set up incoming call handler
      videoCallService.on("callRequest", handleIncomingCall);
      videoCallService.on("callAccepted", handleCallAccepted);
      videoCallService.on("callRejected", handleCallRejected);
      videoCallService.on("callEnded", handleCallEnded);
      
      return () => {
        videoCallService.cleanup();
      };
    }
  }, [socket]);

  const handleIncomingCall = (callData) => {
    console.log("📞 Global incoming call received:", callData);
    
    // Find the caller's user information
    const caller = users.find(user => user._id === callData.from);
    
    if (caller) {
      setIncomingCallData({
        ...callData,
        callerName: caller.fullName,
        callerAvatar: caller.profilePic
      });
      setIsIncomingCall(true);
    } else {
      console.warn("Caller not found in users list:", callData.from);
    }
  };

  const handleCallAccepted = (callData) => {
    console.log("✅ Call accepted globally:", callData);
    
    // Find the caller's user information
    const caller = users.find(user => user._id === callData.from);
    
    if (caller) {
      setCurrentCallUser(caller);
      setIsIncomingCall(false);
      setIncomingCallData(null);
      setIsVideoCallOpen(true);
    }
  };

  const handleCallRejected = (callData) => {
    console.log("❌ Call rejected globally:", callData);
    
    // Close incoming call modal
    setIsIncomingCall(false);
    setIncomingCallData(null);
  };

  const handleCallEnded = (callData) => {
    console.log("📞 Call ended globally:", callData);
    
    // Close video call interface
    setIsVideoCallOpen(false);
    setCurrentCallUser(null);
  };

  const handleAcceptCall = (callData) => {
    console.log("✅ Accepting call:", callData);
    
    // Accept call through service
    videoCallService.acceptCall(callData);
  };

  const handleRejectCall = (callData) => {
    console.log("❌ Rejecting call:", callData);
    
    // Reject call through service
    videoCallService.rejectCall(callData);
    
    // Close incoming call modal
    setIsIncomingCall(false);
    setIncomingCallData(null);
  };

  const handleCallEnd = () => {
    if (currentCallUser) {
      // End call through service
      videoCallService.endCall(currentCallUser._id);
    }
    
    // Close video call interface
    setIsVideoCallOpen(false);
    setCurrentCallUser(null);
  };

  return (
    <>
      {/* Global Incoming Call Modal */}
      <IncomingCallModal
        callData={incomingCallData}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onClose={() => {
          setIsIncomingCall(false);
          setIncomingCallData(null);
        }}
      />

      {/* Global Video Call Interface */}
      <VideoCall
        isOpen={isVideoCallOpen}
        onClose={() => setIsVideoCallOpen(false)}
        selectedUser={currentCallUser}
        onCallEnd={handleCallEnd}
        isIncomingCall={true}
      />
    </>
  );
};

export default GlobalVideoCallHandler;
