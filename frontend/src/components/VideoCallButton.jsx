import { useState } from "react";
import { Phone, PhoneOff } from "lucide-react";
import VideoCall from "./VideoCall";

const VideoCallButton = ({ selectedUser, isUserOnline }) => {
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);

  const handleVideoCall = () => {
    if (!selectedUser) return;
    
    // Check if user is online before initiating call
    if (!isUserOnline) {
      // You could show a toast notification here
      console.log("User is offline, cannot initiate video call");
      return;
    }
    
    setIsVideoCallOpen(true);
  };

  const handleCallEnd = () => {
    setIsVideoCallOpen(false);
    setIsIncomingCall(false);
  };

  const handleIncomingCall = () => {
    setIsIncomingCall(true);
    setIsVideoCallOpen(true);
  };

  if (!selectedUser) return null;

  return (
    <>
      {/* Video Call Button */}
      <button
        onClick={handleVideoCall}
        className={`btn btn-sm btn-circle ${
          isUserOnline ? 'btn-ghost hover:btn-primary' : 'btn-ghost opacity-50 cursor-not-allowed'
        }`}
        title={isUserOnline ? 'Start video call' : 'User is offline'}
        disabled={!isUserOnline}
      >
        <Phone className="size-5" />
      </button>

      {/* Video Call Modal */}
      <VideoCall
        isOpen={isVideoCallOpen}
        onClose={() => setIsVideoCallOpen(false)}
        selectedUser={selectedUser}
        onCallEnd={handleCallEnd}
        isIncomingCall={isIncomingCall}
      />
    </>
  );
};

export default VideoCallButton;
