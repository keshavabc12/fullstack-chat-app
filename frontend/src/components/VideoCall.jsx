import { useState, useRef, useEffect } from "react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import videoCallService from "../lib/videoCallService";
import toast from "react-hot-toast";

const VideoCall = ({ isOpen, onClose, selectedUser, onCallEnd, isIncomingCall = false }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState("connecting"); // connecting, connected, failed, ended
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  const { authUser } = useAuthStore();

  // Initialize WebRTC
  useEffect(() => {
    if (isOpen) {
      initializeCall();
    }
    
    return () => {
      cleanupCall();
    };
  }, [isOpen]);

  // Setup video call service event handlers
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
      console.log("🚀 Initializing video call...");
      
      // Get user media (camera and microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      localStreamRef.current = stream;
      console.log("✅ Media stream obtained:", stream.getTracks().map(t => t.kind));
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Initialize WebRTC peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      
      peerConnectionRef.current = peerConnection;
      console.log("✅ RTCPeerConnection created");
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
        console.log(`✅ Added ${track.kind} track to peer connection`);
      });
      
      // Handle incoming remote stream
      peerConnection.ontrack = (event) => {
        console.log("📹 Remote track received:", event.track.kind);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("🧊 ICE candidate generated:", event.candidate.type);
          // Send ICE candidate to remote peer via signaling server
          videoCallService.sendIceCandidate(selectedUser._id, event.candidate);
        }
      };
      
      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log("🔗 Connection state changed:", peerConnection.connectionState);
        if (peerConnection.connectionState === "connected") {
          setCallStatus("connected");
          setIsInCall(true);
          toast.success("Call connected successfully!");
        } else if (peerConnection.connectionState === "failed") {
          setCallStatus("failed");
          toast.error("Call connection failed");
        } else if (peerConnection.connectionState === "disconnected") {
          setCallStatus("ended");
          toast.error("Call disconnected");
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log("🧊 ICE connection state:", peerConnection.iceConnectionState);
      };

      // If this is an incoming call, wait for offer.
      // If this is an outgoing call, wait for acceptance before creating the offer.
      if (!isIncomingCall) {
        console.log("🔔 Outgoing call: waiting for acceptance before creating offer...");
      }
      
    } catch (error) {
      console.error("❌ Failed to initialize call:", error);
      setCallStatus("failed");
      toast.error(`Failed to initialize call: ${error.message}`);
    }
  };

  const handleIceCandidate = (data) => {
    if (peerConnectionRef.current && data.from === selectedUser._id) {
      console.log("🧊 Adding ICE candidate from remote peer");
      peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
        .then(() => console.log("✅ ICE candidate added successfully"))
        .catch(err => console.error("❌ Failed to add ICE candidate:", err));
    }
  };

  const handleOffer = async (data) => {
    if (peerConnectionRef.current && data.from === selectedUser._id) {
      try {
        console.log("📥 Received offer from remote peer");
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        console.log("✅ Remote description set");
        
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        console.log("✅ Answer created and set");
        
        // Send answer to remote peer
        videoCallService.sendAnswer(selectedUser._id, answer);
        console.log("✅ Answer sent to remote peer");
      } catch (error) {
        console.error("❌ Failed to handle offer:", error);
        toast.error("Failed to establish call connection");
      }
    }
  };

  const handleAnswer = async (data) => {
    if (peerConnectionRef.current && data.from === selectedUser._id) {
      try {
        console.log("📥 Received answer from remote peer");
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log("✅ Remote description updated with answer");
      } catch (error) {
        console.error("❌ Failed to handle answer:", error);
      }
    }
  };

  const handleCallAccepted = async (data) => {
    console.log("✅ Call accepted by remote peer:", data);
    // For outgoing calls, create and send offer after acceptance to avoid race conditions
    try {
      if (!isIncomingCall && peerConnectionRef.current) {
        console.log("📤 Creating and sending offer after acceptance...");
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        videoCallService.sendOffer(selectedUser._id, offer);
        console.log("✅ Offer sent successfully after acceptance");
      }
    } catch (error) {
      console.error("❌ Failed to create/send offer after acceptance:", error);
      toast.error("Failed to start call after acceptance");
    }
  };

  const handleCallRejected = (data) => {
    console.log("❌ Call rejected by remote peer:", data);
    setCallStatus("ended");
    toast.error("Call was rejected by the other user");
    setTimeout(() => {
      cleanupCall();
      onCallEnd?.();
      onClose();
    }, 2000);
  };

  const handleRemoteCallEnd = (data) => {
    if (data.from === selectedUser._id) {
      console.log("📞 Remote peer ended the call");
      setCallStatus("ended");
      toast.error("The other user ended the call");
      setTimeout(() => {
        cleanupCall();
        onCallEnd?.();
        onClose();
      }, 2000);
    }
  };

  const cleanupCall = () => {
    console.log("🧹 Cleaning up call resources...");
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`🛑 Stopped ${track.kind} track`);
      });
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      console.log("🛑 Closed peer connection");
    }
    
    setIsInCall(false);
    setCallStatus("connecting");
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        toast.success(audioTrack.enabled ? "Microphone unmuted" : "Microphone muted");
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        toast.success(videoTrack.enabled ? "Camera turned on" : "Camera turned off");
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    toast.success(isSpeakerOn ? "Speaker turned off" : "Speaker turned on");
  };

  const endCall = () => {
    console.log("📞 Ending call...");
    
    // Notify remote peer that call is ending
    videoCallService.endCall(selectedUser._id);
    
    cleanupCall();
    onCallEnd?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-content font-semibold">
                {selectedUser?.fullName?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">{selectedUser?.fullName || "User"}</h3>
              <p className="text-sm text-base-content/70">
                {callStatus === "connecting" && "Connecting..."}
                {callStatus === "connected" && "Connected"}
                {callStatus === "failed" && "Call failed"}
                {callStatus === "ended" && "Call ended"}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            ×
          </button>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative p-4">
          {/* Remote Video (Main) */}
          <div className="w-full h-full bg-base-200 rounded-lg overflow-hidden relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* No video indicator */}
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-base-300">
                <div className="text-center">
                  <VideoOff className="w-16 h-16 mx-auto text-base-content/50 mb-2" />
                  <p className="text-base-content/70">Video is off</p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-32 h-24 bg-base-200 rounded-lg overflow-hidden border-2 border-base-300">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* Call Status Overlay */}
          {callStatus === "connecting" && (
            <div className="absolute inset-0 flex items-center justify-center bg-base-200 bg-opacity-75">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg font-semibold">Connecting to {selectedUser?.fullName}...</p>
                <p className="text-sm text-base-content/70 mt-2">Please wait while we establish the connection</p>
              </div>
            </div>
          )}

          {callStatus === "failed" && (
            <div className="absolute inset-0 flex items-center justify-center bg-base-200 bg-opacity-75">
              <div className="text-center">
                <div className="w-16 h-16 bg-error rounded-full flex items-center justify-center mx-auto mb-4">
                  <PhoneOff className="w-8 h-8 text-error-content" />
                </div>
                <p className="text-lg font-semibold text-error">Call Failed</p>
                <p className="text-base-content/70 mb-4">Unable to connect to {selectedUser?.fullName}</p>
                <button
                  onClick={initializeCall}
                  className="btn btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {callStatus === "ended" && (
            <div className="absolute inset-0 flex items-center justify-center bg-base-200 bg-opacity-75">
              <div className="text-center">
                <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center mx-auto mb-4">
                  <PhoneOff className="w-8 h-8 text-warning-content" />
                </div>
                <p className="text-lg font-semibold text-warning">Call Ended</p>
                <p className="text-base-content/70 mb-4">The call has been terminated</p>
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4 p-6 border-t border-base-300">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`btn btn-circle ${isMuted ? 'btn-error' : 'btn-ghost'}`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Video Toggle Button */}
          <button
            onClick={toggleVideo}
            className={`btn btn-circle ${isVideoOff ? 'btn-error' : 'btn-ghost'}`}
            title={isVideoOff ? 'Turn on video' : 'Turn off video'}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>

          {/* Speaker Button */}
          <button
            onClick={toggleSpeaker}
            className={`btn btn-circle ${isSpeakerOn ? 'btn-primary' : 'btn-ghost'}`}
            title={isSpeakerOn ? 'Speaker on' : 'Speaker off'}
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="btn btn-circle btn-error"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
