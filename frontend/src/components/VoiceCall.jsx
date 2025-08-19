import { useEffect, useRef, useState } from "react";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import videoCallService from "../lib/videoCallService";
import toast from "react-hot-toast";

const VoiceCall = ({ isOpen, onClose, selectedUser, onCallEnd, isIncomingCall = false }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState("connecting");

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const audioRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const pendingOfferRef = useRef(null);
  const pendingAnswerRef = useRef(null);

  useEffect(() => {
    if (isOpen) initializeCall();
    return () => cleanupCall();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    videoCallService.on("iceCandidate", handleIceCandidate);
    videoCallService.on("offer", handleOffer);
    videoCallService.on("answer", handleAnswer);
    videoCallService.on("callEnded", handleRemoteCallEnd);
    videoCallService.on("callAccepted", handleCallAccepted);
    videoCallService.on("callRejected", handleCallRejected);
    return () => {
      videoCallService.on("iceCandidate", null);
      videoCallService.on("offer", null);
      videoCallService.on("answer", null);
      videoCallService.on("callEnded", null);
      videoCallService.on("callAccepted", null);
      videoCallService.on("callRejected", null);
    };
  }, [isOpen]);

  const initializeCall = async () => {
    try {
      setCallStatus("connecting");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      localStreamRef.current = stream;

      const peer = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = peer;

      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      peer.ontrack = (event) => {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        remoteStreamRef.current.addTrack(event.track);
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStreamRef.current;
        }
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          videoCallService.sendIceCandidate(selectedUser._id, event.candidate);
        }
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") {
          setCallStatus("connected");
          setIsInCall(true);
          toast.success("Voice call connected");
        } else if (peer.connectionState === "failed") {
          setCallStatus("failed");
          toast.error("Voice call failed");
        } else if (peer.connectionState === "disconnected") {
          setCallStatus("ended");
        }
      };

      if (pendingOfferRef.current) {
        const earlyOffer = pendingOfferRef.current; pendingOfferRef.current = null; await handleOffer(earlyOffer);
      }
      if (pendingAnswerRef.current) {
        const earlyAnswer = pendingAnswerRef.current; pendingAnswerRef.current = null; await handleAnswer(earlyAnswer);
      }

      if (!isIncomingCall) {
        // Wait for acceptance; offer is created after accept
      }
    } catch (error) {
      setCallStatus("failed");
      toast.error(`Failed to start voice call: ${error.message}`);
    }
  };

  const handleIceCandidate = (data) => {
    const peer = peerConnectionRef.current; if (!peer) return;
    if (data?.from && data.from !== selectedUser._id) return;
    const candidatePayload = data?.candidate ?? data;
    if (!peer.remoteDescription || !peer.remoteDescription.type) {
      pendingIceCandidatesRef.current.push(candidatePayload);
      return;
    }
    peer.addIceCandidate(new RTCIceCandidate(candidatePayload)).catch(() => {});
  };

  const flushPendingIceCandidates = async () => {
    const peer = peerConnectionRef.current; if (!peer) return;
    const queued = [...pendingIceCandidatesRef.current]; pendingIceCandidatesRef.current = [];
    for (const c of queued) {
      try { await peer.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
    }
  };

  const handleOffer = async (data) => {
    if (!peerConnectionRef.current) { pendingOfferRef.current = data; return; }
    if (data?.from && data.from !== selectedUser._id) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      videoCallService.sendAnswer(selectedUser._id, answer);
      await flushPendingIceCandidates();
    } catch (_) {}
  };

  const handleAnswer = async (data) => {
    if (!peerConnectionRef.current) { pendingAnswerRef.current = data; return; }
    if (data?.from && data.from !== selectedUser._id) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      await flushPendingIceCandidates();
    } catch (_) {}
  };

  const handleCallAccepted = async () => {
    try {
      if (!isIncomingCall && peerConnectionRef.current) {
        const offer = await peerConnectionRef.current.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
        await peerConnectionRef.current.setLocalDescription(offer);
        videoCallService.sendOffer(selectedUser._id, offer);
      }
    } catch (error) {
      toast.error("Failed to start voice call after acceptance");
    }
  };

  const handleCallRejected = () => {
    setCallStatus("ended");
    setTimeout(() => { cleanupCall(); onCallEnd?.(); onClose(); }, 1000);
  };

  const handleRemoteCallEnd = () => {
    setCallStatus("ended");
    setTimeout(() => { cleanupCall(); onCallEnd?.(); onClose(); }, 1000);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    if (audioRef.current) audioRef.current.muted = !isSpeakerOn;
  };

  const endCall = () => {
    videoCallService.endCall(selectedUser._id);
    cleanupCall(); onCallEnd?.(); onClose();
  };

  const cleanupCall = () => {
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
    pendingIceCandidatesRef.current = []; pendingOfferRef.current = null; pendingAnswerRef.current = null;
    setIsInCall(false); setCallStatus("connecting");
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg shadow-2xl w-full max-w-md h-full max-h-[60vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <div>
            <h3 className="font-semibold">{selectedUser?.fullName || "User"}</h3>
            <p className="text-sm text-base-content/70">
              {callStatus === "connecting" && "Connecting..."}
              {callStatus === "connected" && "Connected"}
              {callStatus === "failed" && "Call failed"}
              {callStatus === "ended" && "Call ended"}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">×</button>
        </div>

        <div className="flex-1 p-6 flex items-center justify-center">
          <audio ref={audioRef} autoPlay playsInline />
        </div>

        <div className="flex items-center justify-center gap-4 p-4 border-t border-base-300">
          <button onClick={toggleMute} className={`btn btn-circle ${isMuted ? 'btn-error' : 'btn-ghost'}`} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button onClick={toggleSpeaker} className={`btn btn-circle ${isSpeakerOn ? 'btn-primary' : 'btn-ghost'}`} title={isSpeakerOn ? 'Speaker on' : 'Speaker off'}>
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
          <button onClick={endCall} className="btn btn-circle btn-error" title="End call">
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceCall;


