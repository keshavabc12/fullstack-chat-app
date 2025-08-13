import { useState, useEffect } from "react";
import { Phone, PhoneOff, User } from "lucide-react";
import videoCallService from "../lib/videoCallService";

const IncomingCallModal = ({ callData, onAccept, onReject, onClose }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRinging, setIsRinging] = useState(true);

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

  const handleAccept = () => {
    if (onAccept) {
      onAccept(callData);
    }
    onClose();
  };

  const handleReject = () => {
    if (onReject) {
      onReject(callData);
    }
    onClose();
  };

  if (!callData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Caller Avatar */}
        <div className="mb-6">
          <div className="w-24 h-24 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
            <User className="w-12 h-12 text-primary-content" />
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
            className="btn btn-success btn-lg btn-circle"
            title="Accept call"
          >
            <Phone className="w-6 h-6" />
          </button>

          {/* Reject Call Button */}
          <button
            onClick={handleReject}
            className="btn btn-error btn-lg btn-circle"
            title="Reject call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

        {/* Call Type Indicator */}
        <div className="mt-6 p-3 bg-base-200 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-sm text-base-content/70">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Video Call</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
