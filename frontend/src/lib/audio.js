// Audio utility for chat notifications
class AudioManager {
  constructor() {
    this.audioContext = null;
    this.notificationSound = null;
    this.isEnabled = localStorage.getItem('notification-sound') !== 'disabled';
  }

  // ✅ Initialize audio context
  init() {
    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  // ✅ Play notification sound
  playNotification() {
    if (!this.isEnabled) return;

    try {
      // Try to play a simple beep sound
      this.playBeep();
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  // ✅ Generate a simple beep sound
  playBeep() {
    if (!this.audioContext) {
      this.init();
    }

    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // ✅ Enable/disable notification sounds
  setEnabled(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('notification-sound', enabled ? 'enabled' : 'disabled');
  }

  // ✅ Check if sound is enabled
  isSoundEnabled() {
    return this.isEnabled;
  }

  // ✅ Cleanup
  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Create singleton instance
const audioManager = new AudioManager();

export default audioManager;
