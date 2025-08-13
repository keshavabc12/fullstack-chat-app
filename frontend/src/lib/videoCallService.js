import { useAuthStore } from "../store/useAuthStore";

class VideoCallService {
  constructor() {
    this.socket = null;
    this.onCallRequest = null;
    this.onCallAccepted = null;
    this.onCallRejected = null;
    this.onCallEnded = null;
    this.onIceCandidate = null;
    this.onOffer = null;
    this.onAnswer = null;
  }

  // Initialize the service with socket connection
  initialize(socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  // Setup socket event listeners for video call signaling
  setupSocketListeners() {
    if (!this.socket) return;

    // Handle incoming call requests
    this.socket.on("videoCallRequest", (data) => {
      if (this.onCallRequest) {
        this.onCallRequest(data);
      }
    });

    // Handle call acceptance
    this.socket.on("videoCallAccepted", (data) => {
      if (this.onCallAccepted) {
        this.onCallAccepted(data);
      }
    });

    // Handle call rejection
    this.socket.on("videoCallRejected", (data) => {
      if (this.onCallRejected) {
        this.onCallRejected(data);
      }
    });

    // Handle call ending
    this.socket.on("videoCallEnded", (data) => {
      if (this.onCallEnded) {
        this.onCallEnded(data);
      }
    });

    // Handle ICE candidates
    this.socket.on("iceCandidate", (data) => {
      if (this.onIceCandidate) {
        this.onIceCandidate(data);
      }
    });

    // Handle WebRTC offers
    this.socket.on("offer", (data) => {
      if (this.onOffer) {
        this.onOffer(data);
      }
    });

    // Handle WebRTC answers
    this.socket.on("answer", (data) => {
      if (this.onAnswer) {
        this.onAnswer(data);
      }
    });
  }

  // Request a video call with another user
  requestCall(targetUserId) {
    if (!this.socket) {
      console.error("Socket not connected");
      return;
    }

    const { authUser } = useAuthStore.getState();
    
    this.socket.emit("videoCallRequest", {
      from: authUser._id,
      to: targetUserId,
      timestamp: Date.now()
    });
  }

  // Accept an incoming call
  acceptCall(callData) {
    if (!this.socket) return;

    this.socket.emit("videoCallAccepted", {
      callId: callData.callId,
      from: callData.from,
      to: callData.to,
      timestamp: Date.now()
    });
  }

  // Reject an incoming call
  rejectCall(callData) {
    if (!this.socket) return;

    this.socket.emit("videoCallRejected", {
      callId: callData.callId,
      from: callData.from,
      to: callData.to,
      timestamp: Date.now()
    });
  }

  // End an active call
  endCall(targetUserId) {
    if (!this.socket) return;

    const { authUser } = useAuthStore.getState();
    
    this.socket.emit("videoCallEnded", {
      from: authUser._id,
      to: targetUserId,
      timestamp: Date.now()
    });
  }

  // Send WebRTC offer
  sendOffer(targetUserId, offer) {
    if (!this.socket) return;

    this.socket.emit("offer", {
      to: targetUserId,
      offer: offer
    });
  }

  // Send WebRTC answer
  sendAnswer(targetUserId, answer) {
    if (!this.socket) return;

    this.socket.emit("answer", {
      to: targetUserId,
      answer: answer
    });
  }

  // Send ICE candidate
  sendIceCandidate(targetUserId, candidate) {
    if (!this.socket) return;

    this.socket.emit("iceCandidate", {
      to: targetUserId,
      candidate: candidate
    });
  }

  // Set event handlers
  on(event, callback) {
    switch (event) {
      case "callRequest":
        this.onCallRequest = callback;
        break;
      case "callAccepted":
        this.onCallAccepted = callback;
        break;
      case "callRejected":
        this.onCallRejected = callback;
        break;
      case "callEnded":
        this.onCallEnded = callback;
        break;
      case "iceCandidate":
        this.onIceCandidate = callback;
        break;
      case "offer":
        this.onOffer = callback;
        break;
      case "answer":
        this.onAnswer = callback;
        break;
      default:
        console.warn(`Unknown event: ${event}`);
    }
  }

  // Cleanup
  cleanup() {
    if (this.socket) {
      this.socket.off("videoCallRequest");
      this.socket.off("videoCallAccepted");
      this.socket.off("videoCallRejected");
      this.socket.off("videoCallEnded");
      this.socket.off("iceCandidate");
      this.socket.off("offer");
      this.socket.off("answer");
    }
  }
}

// Create singleton instance
const videoCallService = new VideoCallService();

export default videoCallService;
