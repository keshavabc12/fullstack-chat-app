import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, User } from "lucide-react";
import videoCallService from "../lib/videoCallService";

const IncomingCallModal = ({ callData, onAccept, onReject, onClose }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRinging, setIsRinging] = useState(true);
  const audioRef = useRef(null);

  // Auto-reject call after 30 seconds
  useEffect(() => {
    if (!callData) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => {
        if (prev >= 30) {
          handleReject();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [callData]);

  // Ringing animation effect
  useEffect(() => {
    if (!isRinging) return;

    const ringInterval = setInterval(() => {
      setIsRinging(prev => !prev);
    }, 500);

    return () => clearInterval(ringInterval);
  }, [isRinging]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!callData) return;
      
      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          if (timeElapsed < 30) {
            handleAccept();
          }
          break;
        case 'Escape':
          event.preventDefault();
          handleReject();
          break;
        default:
          break;
      }
    };

    if (callData) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [callData, timeElapsed]);

  // Play ringing sound and show browser notification
  useEffect(() => {
    if (callData) {
      // Play ringing sound
      if (audioRef.current) {
        audioRef.current.play().catch(error => {
          console.log("Could not play audio:", error);
        });
      }

      // Show browser notification if permission is granted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`Incoming Video Call from ${callData.callerName}`, {
            body: 'Click to answer or reject the call',
            icon: callData.callerAvatar || '/avatar.png',
            tag: `video-call-${callData.from}`,
            requireInteraction: true,
            silent: false,
            badge: '/avatar.png',
          });
        } catch (error) {
          console.error("Failed to show browser notification:", error);
        }
      }

      // Focus the window/tab to make the call more noticeable
      if (document.hidden) {
        window.focus();
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [callData]);

  const handleAccept = () => {
    // Stop ringing sound
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (onAccept) {
      onAccept(callData);
    }
    onClose();
  };

  const handleReject = () => {
    // Stop ringing sound
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (onReject) {
      onReject(callData);
    }
    onClose();
  };

  if (!callData) return null;

  return (
    <>
      {/* Hidden audio element for ringing sound */}
      <audio ref={audioRef} loop>
        <source src="/ringtone.mp3" type="audio/mpeg" />
        <source src="/ringtone.ogg" type="audio/ogg" />
        {/* Fallback: create a simple beep sound using Web Audio API */}
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT" type="audio/wav" />
      </audio>

      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-base-100 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-bounce">
          {/* Caller Avatar */}
          <div className="mb-6">
            <div className="w-24 h-24 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {callData.callerAvatar ? (
                <img 
                  src={callData.callerAvatar} 
                  alt={callData.callerName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-primary-content" />
              )}
            </div>
            
            {/* Ringing animation */}
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              isRinging ? 'bg-green-500 animate-pulse' : 'bg-base-300'
            }`}>
              <Phone className={`w-8 h-8 ${isRinging ? 'text-white' : 'text-base-content'}`} />
            </div>
          </div>

          {/* Caller Info */}
          <h2 className="text-2xl font-bold mb-2">Incoming Video Call</h2>
          <p className="text-lg text-base-content/70 mb-6">
            {callData.callerName || "Unknown User"}
          </p>

          {/* Timer */}
          <div className="text-sm text-base-content/50 mb-6">
            {timeElapsed < 30 ? (
              <span>Call will auto-reject in {30 - timeElapsed} seconds</span>
            ) : (
              <span className="text-error">Call expired</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {/* Accept Call Button */}
            <button
              onClick={handleAccept}
              disabled={timeElapsed >= 30}
              className="btn btn-success btn-lg btn-circle hover:scale-110 transition-transform"
              title="Accept call"
            >
              <Phone className="w-6 h-6" />
            </button>

            {/* Reject Call Button */}
            <button
              onClick={handleReject}
              className="btn btn-error btn-lg btn-circle hover:scale-110 transition-transform"
              title="Reject call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>

          {/* Call Type Indicator */}
          <div className="mt-6 p-3 bg-base-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-base-content/70">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Video Call</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 text-xs text-base-content/50">
            <p>Press <kbd className="kbd kbd-sm">Enter</kbd> to accept, <kbd className="kbd kbd-sm">Escape</kbd> to reject</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default IncomingCallModal;
