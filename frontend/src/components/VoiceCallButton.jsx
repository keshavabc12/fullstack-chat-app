import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import VoiceCall from "./VoiceCall";
import videoCallService from "../lib/videoCallService";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const VoiceCallButton = ({ selectedUser, isUserOnline }) => {
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isIncoming, setIsIncoming] = useState(false);

  const { socket } = useAuthStore();

  useEffect(() => {
    if (!socket) return;
    videoCallService.initialize(socket);
    videoCallService.on("callRequest", onIncomingCall);
    videoCallService.on("callAccepted", onCallAccepted);
    videoCallService.on("callRejected", onCallRejected);
    videoCallService.on("callEnded", onRemoteEnded);
    return () => {
      videoCallService.cleanup();
    };
  }, [socket]);

  const startVoiceCall = () => {
    if (!selectedUser) return toast.error("No user selected");
    if (!isUserOnline) return toast.error("User is offline");
    try {
      videoCallService.requestCall(selectedUser._id, "voice");
      setIsCallInProgress(true);
      setIsIncoming(false);
      setIsVoiceCallOpen(true);
      toast.success(`Calling ${selectedUser.fullName}...`);
    } catch (e) {
      toast.error("Failed to start call");
    }
  };

  const onIncomingCall = (data) => {
    if (selectedUser && data.from === selectedUser._id) {
      if (data.type && data.type !== "voice") return;
      setIncomingCall(data);
      setIsCallInProgress(true);
      toast.success(`${selectedUser.fullName} is calling...`);
    }
  };

  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    videoCallService.acceptCall(incomingCall);
    setIsIncoming(true);
    setIsVoiceCallOpen(true);
    setIncomingCall(null);
  };

  const rejectIncomingCall = () => {
    if (!incomingCall) return;
    videoCallService.rejectCall(incomingCall);
    setIncomingCall(null);
    setIsCallInProgress(false);
  };

  const onCallAccepted = () => setIsCallInProgress(false);
  const onCallRejected = () => { setIsCallInProgress(false); setIsVoiceCallOpen(false); };
  const onRemoteEnded = () => { setIsCallInProgress(false); setIsVoiceCallOpen(false); };

  const handleClose = () => {
    if (isCallInProgress) {
      videoCallService.endCall(selectedUser._id);
    }
    setIsVoiceCallOpen(false); setIsCallInProgress(false); setIsIncoming(false);
  };

  if (!selectedUser) return null;

  return (
    <>
      <button
        onClick={startVoiceCall}
        disabled={!isUserOnline || isCallInProgress}
        className={`btn btn-sm btn-circle ${isUserOnline && !isCallInProgress ? 'btn-ghost hover:btn-secondary' : 'btn-ghost opacity-50 cursor-not-allowed'}`}
        title={!isUserOnline ? 'User is offline' : isCallInProgress ? 'Call in progress' : 'Start voice call'}
      >
        <Phone className="size-5" />
      </button>

      {incomingCall && (
        <div className="mt-2 p-2 bg-base-200 rounded-lg flex items-center gap-2">
          <span className="text-sm">Incoming voice call from {selectedUser?.fullName}</span>
          <button onClick={acceptIncomingCall} className="btn btn-xs btn-primary">Accept</button>
          <button onClick={rejectIncomingCall} className="btn btn-xs btn-ghost">Reject</button>
        </div>
      )}

      <VoiceCall
        isOpen={isVoiceCallOpen}
        onClose={handleClose}
        selectedUser={selectedUser}
        onCallEnd={() => setIsCallInProgress(false)}
        isIncomingCall={isIncoming}
      />
    </>
  );
};

export default VoiceCallButton;


