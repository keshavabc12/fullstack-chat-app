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
    this.onCallUserOffline = null;
  }

  // Initialize the service with socket connection
  initialize(socket) {
    this.socket = socket;
    this.setupSocketListeners();
    console.log("✅ Video call service initialized with socket");
  }

  // Setup socket event listeners for video call signaling
  setupSocketListeners() {
    if (!this.socket) {
      console.error("❌ No socket connection available");
      return;
    }

    console.log("🔌 Setting up video call socket listeners...");

    // Handle incoming call requests
    this.socket.on("videoCallRequest", (data) => {
      console.log("📞 Incoming call request received:", data);
      if (this.onCallRequest) {
        this.onCallRequest(data);
      }
    });

    // Handle call acceptance
    this.socket.on("videoCallAccepted", (data) => {
      console.log("✅ Call accepted event received:", data);
      if (this.onCallAccepted) {
        this.onCallAccepted(data);
      }
    });

    // Handle call rejection
    this.socket.on("videoCallRejected", (data) => {
      console.log("❌ Call rejected event received:", data);
      if (this.onCallRejected) {
        this.onCallRejected(data);
      }
    });

    // Handle call ending
    this.socket.on("videoCallEnded", (data) => {
      console.log("📞 Call ended event received:", data);
      if (this.onCallEnded) {
        this.onCallEnded(data);
      }
    });

    // Handle ICE candidates
    this.socket.on("iceCandidate", (data) => {
      console.log("🧊 ICE candidate received:", data);
      if (this.onIceCandidate) {
        this.onIceCandidate(data);
      }
    });

    // Handle WebRTC offers
    this.socket.on("offer", (data) => {
      console.log("📤 Offer received:", data);
      if (this.onOffer) {
        this.onOffer(data);
      }
    });

    // Handle WebRTC answers
    this.socket.on("answer", (data) => {
      console.log("📤 Answer received:", data);
      if (this.onAnswer) {
        this.onAnswer(data);
      }
    });

    // Handle user offline during call
    this.socket.on("callUserOffline", (data) => {
      console.log("❌ User offline event received:", data);
      if (this.onCallUserOffline) {
        this.onCallUserOffline(data);
      }
    });

    console.log("✅ Video call socket listeners setup complete");
  }

  // Request a video call with another user
  requestCall(targetUserId) {
    if (!this.socket) {
      console.error("❌ Socket not connected");
      throw new Error("Socket not connected");
    }

    const { authUser } = useAuthStore.getState();
    
    if (!authUser) {
      console.error("❌ No authenticated user");
      throw new Error("No authenticated user");
    }

    const callData = {
      from: authUser._id,
      to: targetUserId,
      timestamp: Date.now()
    };

    console.log("📞 Requesting video call:", callData);
    
    this.socket.emit("videoCallRequest", callData);
    
    return callData;
  }

  // Accept an incoming call
  acceptCall(callData) {
    if (!this.socket) {
      console.error("❌ Socket not connected");
      return;
    }

    const acceptData = {
      callId: callData.callId,
      from: callData.from,
      to: callData.to,
      timestamp: Date.now()
    };

    console.log("✅ Accepting call:", acceptData);
    
    this.socket.emit("videoCallAccepted", acceptData);
  }

  // Reject an incoming call
  rejectCall(callData) {
    if (!this.socket) {
      console.error("❌ Socket not connected");
      return;
    }

    const rejectData = {
      callId: callData.callId,
      from: callData.from,
      to: callData.to,
      timestamp: Date.now()
    };

    console.log("❌ Rejecting call:", rejectData);
    
    this.socket.emit("videoCallRejected", rejectData);
  }

  // End an active call
  endCall(targetUserId) {
    if (!this.socket) {
      console.error("❌ Socket not connected");
      return;
    }

    const { authUser } = useAuthStore.getState();
    
    if (!authUser) {
      console.error("❌ No authenticated user");
      return;
    }

    const endData = {
      from: authUser._id,
      to: targetUserId,
      timestamp: Date.now()
    };

    console.log("📞 Ending call:", endData);
    
    this.socket.emit("videoCallEnded", endData);
  }

  // Send WebRTC offer
  sendOffer(targetUserId, offer) {
    if (!this.socket) {
      console.error("❌ Socket not connected");
      return;
    }

    const offerData = {
      to: targetUserId,
      offer: offer
    };

    console.log("📤 Sending offer:", offerData);
    
    this.socket.emit("offer", offerData);
  }

  // Send WebRTC answer
  sendAnswer(targetUserId, answer) {
    if (!this.socket) {
      console.error("❌ Socket not connected");
      return;
    }

    const answerData = {
      to: targetUserId,
      answer: answer
    };

    console.log("📤 Sending answer:", answerData);
    
    this.socket.emit("answer", answerData);
  }

  // Send ICE candidate
  sendIceCandidate(targetUserId, candidate) {
    if (!this.socket) {
      console.error("❌ Socket not connected");
      return;
    }

    const candidateData = {
      to: targetUserId,
      candidate: candidate
    };

    console.log("🧊 Sending ICE candidate:", candidateData);
    
    this.socket.emit("iceCandidate", candidateData);
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
      case "callUserOffline":
        this.onCallUserOffline = callback;
        break;
      default:
        console.warn(`⚠️ Unknown event: ${event}`);
    }
  }

  // Check if service is ready
  isReady() {
    return this.socket && this.socket.connected;
  }

  // Get connection status
  getConnectionStatus() {
    if (!this.socket) return "disconnected";
    return this.socket.connected ? "connected" : "disconnected";
  }

  // Cleanup
  cleanup() {
    if (this.socket) {
      console.log("🧹 Cleaning up video call service...");
      
      this.socket.off("videoCallRequest");
      this.socket.off("videoCallAccepted");
      this.socket.off("videoCallRejected");
      this.socket.off("videoCallEnded");
      this.socket.off("iceCandidate");
      this.socket.off("offer");
      this.socket.off("answer");
      this.socket.off("callUserOffline");
      
      console.log("✅ Video call service cleanup complete");
    }
  }
}

// Create singleton instance
const videoCallService = new VideoCallService();

export default videoCallService;
