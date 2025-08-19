import { useAuthStore } from "../store/useAuthStore";

class VideoCallService {
  constructor() {
    this.socket = null;
    // Maintain multiple listeners per event
    this.listeners = {
      callRequest: [],
      callAccepted: [],
      callRejected: [],
      callEnded: [],
      iceCandidate: [],
      offer: [],
      answer: [],
      callUserOffline: []
    };
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
      this.listeners.callRequest.forEach(cb => {
        try { cb && cb(data); } catch (e) { console.error(e); }
      });
    });

    // Handle call acceptance
    this.socket.on("videoCallAccepted", (data) => {
      console.log("✅ Call accepted event received:", data);
      this.listeners.callAccepted.forEach(cb => {
        try { cb && cb(data); } catch (e) { console.error(e); }
      });
    });

    // Handle call rejection
    this.socket.on("videoCallRejected", (data) => {
      console.log("❌ Call rejected event received:", data);
      this.listeners.callRejected.forEach(cb => {
        try { cb && cb(data); } catch (e) { console.error(e); }
      });
    });

    // Handle call ending
    this.socket.on("videoCallEnded", (data) => {
      console.log("📞 Call ended event received:", data);
      this.listeners.callEnded.forEach(cb => {
        try { cb && cb(data); } catch (e) { console.error(e); }
      });
    });

    // Handle ICE candidates
    this.socket.on("iceCandidate", (data) => {
      console.log("🧊 ICE candidate received:", data);
      this.listeners.iceCandidate.forEach(cb => {
        try { cb && cb(data); } catch (e) { console.error(e); }
      });
    });

    // Handle WebRTC offers
    this.socket.on("offer", (data) => {
      console.log("📤 Offer received:", data);
      this.listeners.offer.forEach(cb => {
        try { cb && cb(data); } catch (e) { console.error(e); }
      });
    });

    // Handle WebRTC answers
    this.socket.on("answer", (data) => {
      console.log("📤 Answer received:", data);
      this.listeners.answer.forEach(cb => {
        try { cb && cb(data); } catch (e) { console.error(e); }
      });
    });

    // Handle user offline during call
    this.socket.on("callUserOffline", (data) => {
      console.log("❌ User offline event received:", data);
      this.listeners.callUserOffline.forEach(cb => {
        try { cb && cb(data); } catch (e) { console.error(e); }
      });
    });

    console.log("✅ Video call socket listeners setup complete");
  }

  // Request a call with another user
  requestCall(targetUserId, type = "video") {
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
      type,
      timestamp: Date.now()
    };

    console.log("📞 Requesting call:", callData);
    
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
    if (!this.listeners[event]) {
      console.warn(`⚠️ Unknown event: ${event}`);
      return;
    }
    // Allow removing listener by passing null
    if (callback === null) {
      this.listeners[event] = [];
      return;
    }
    this.listeners[event].push(callback);
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
