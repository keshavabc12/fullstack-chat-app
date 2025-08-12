import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Send, Bell, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";
import audioManager from "../lib/audio.js";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const [notificationSound, setNotificationSound] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);

  useEffect(() => {
    // Load current notification settings
    setNotificationSound(audioManager.isSoundEnabled());
    setBrowserNotifications(Notification.permission === 'granted');
  }, []);

  const handleNotificationSoundToggle = () => {
    const newValue = !notificationSound;
    setNotificationSound(newValue);
    audioManager.setEnabled(newValue);
    
    // Test the sound if enabling
    if (newValue) {
      audioManager.playNotification();
    }
  };

  const requestBrowserNotifications = async () => {
    try {
      const result = await Notification.requestPermission();
      setBrowserNotifications(result === 'granted');
      
      if (result === 'granted') {
        // Show a test notification
        new Notification('Notifications Enabled!', {
          body: 'You will now receive browser notifications for new messages',
          icon: '/avatar.png',
        });
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-8">
        {/* Theme Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold">Theme</h2>
            <p className="text-base-content/70">Choose a theme for your chat interface</p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  console.log("Changing theme to:", t);
                  setTheme(t);
                }}
                className={`
                  group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                  ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}
                `}
              >
                <div className="relative h-8 w-full rounded-md overflow-hidden" data-theme={t}>
                  <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                    <div className="rounded bg-primary"></div>
                    <div className="rounded bg-secondary"></div>
                    <div className="rounded bg-accent"></div>
                    <div className="rounded bg-neutral"></div>
                  </div>
                </div>
                <span className="text-[11px] font-medium truncate w-full text-center">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold">Notifications</h2>
            <p className="text-base-content/70">Configure how you want to be notified about new messages</p>
          </div>

          <div className="space-y-4">
            {/* Notification Sound Toggle */}
            <div className="flex items-center justify-between p-4 bg-base-100 rounded-lg border border-base-300">
              <div className="flex items-center gap-3">
                {notificationSound ? (
                  <Volume2 className="size-6 text-primary" />
                ) : (
                  <VolumeX className="size-6 text-base-content/50" />
                )}
                <div>
                  <h3 className="font-medium">Notification Sounds</h3>
                  <p className="text-sm text-base-content/70">
                    Play a sound when you receive new messages
                  </p>
                </div>
              </div>
              <label className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSound}
                  onChange={handleNotificationSoundToggle}
                  className="toggle toggle-primary"
                />
              </label>
            </div>

            {/* Browser Notifications */}
            <div className="flex items-center justify-between p-4 bg-base-100 rounded-lg border border-base-300">
              <div className="flex items-center gap-3">
                <Bell className="size-6 text-primary" />
                <div>
                  <h3 className="font-medium">Browser Notifications</h3>
                  <p className="text-sm text-base-content/70">
                    Show notifications even when the app is not focused
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {browserNotifications ? (
                  <span className="badge badge-success">Enabled</span>
                ) : (
                  <button
                    onClick={requestBrowserNotifications}
                    className="btn btn-primary btn-sm"
                  >
                    Enable
                  </button>
                )}
              </div>
            </div>

            {/* Notification Preview */}
            <div className="p-4 bg-base-100 rounded-lg border border-base-300">
              <h3 className="font-medium mb-3">Notification Preview</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-base-content/70">Sound:</span>
                  <span className={`badge ${notificationSound ? 'badge-success' : 'badge-error'}`}>
                    {notificationSound ? 'On' : 'Off'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-base-content/70">Browser:</span>
                  <span className={`badge ${browserNotifications ? 'badge-success' : 'badge-error'}`}>
                    {browserNotifications ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Theme Preview</h3>
          <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
            <div className="p-4 bg-base-200">
              <div className="max-w-lg mx-auto">
                {/* Mock Chat UI */}
                <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                  {/* Chat Header */}
                  <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                        J
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">John Doe</h3>
                        <p className="text-xs text-base-content/70">Online</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="p-4 space-y-3">
                    {PREVIEW_MESSAGES.map((message) => (
                      <div
                        key={message.id}
                        className={`chat ${message.isSent ? "chat-end" : "chat-start"}`}
                      >
                        <div className="chat-bubble">
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="px-4 py-3 border-t border-base-300 bg-base-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 input input-bordered input-sm"
                        disabled
                      />
                      <button className="btn btn-primary btn-sm btn-circle" disabled>
                        <Send className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
