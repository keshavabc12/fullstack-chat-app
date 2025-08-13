import { useState } from "react";
import { Phone } from "lucide-react";
import VideoCall from "./VideoCall";
import videoCallService from "../lib/videoCallService";

const VideoCallButton = ({ selectedUser, isUserOnline }) => {
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);

  const handleVideoCall = () => {
    if (!selectedUser) return;
    
    // Check if user is online before initiating call
    if (!isUserOnline) {
      // You could show a toast notification here
      console.log("User is offline, cannot initiate video call");
      return;
    }
    
    // Request call through video call service
    videoCallService.requestCall(selectedUser._id);
    setIsVideoCallOpen(true);
  };

  const handleCallEnd = () => {
    setIsVideoCallOpen(false);
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
        isIncomingCall={false}
      />
    </>
  );
};

export default VideoCallButton;
