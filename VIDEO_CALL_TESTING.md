# Video Call Testing Guide

## Overview
This guide explains how to test the video call functionality in the chat application. The system now includes comprehensive incoming call notifications that work globally throughout the application.

## Prerequisites

### Browser Requirements
- **Modern browser** with WebRTC support (Chrome, Firefox, Safari, Edge)
- **Camera and microphone permissions** granted
- **HTTPS connection** (required for WebRTC in production)

### User Setup
- **Two user accounts** logged in simultaneously
- **Both users online** (socket connection established)
- **Camera and microphone** available on both devices

## Testing Steps

### 1. Basic Video Call Test

#### Step 1: Prepare Both Users
1. **User A**: Log in and navigate to any page in the app
2. **User B**: Log in and navigate to any page in the app
3. **Verify**: Both users show as "online" in the user list

#### Step 2: Initiate Call
1. **User A**: Select User B from the user list
2. **User A**: Click the video call button (📞) in the chat header
3. **Verify**: Call request is sent via socket

#### Step 3: Receive Call
1. **User B**: Should see incoming call notification immediately
2. **User B**: Should hear ringing sound
3. **User B**: Should see browser notification (if permissions granted)
4. **User B**: Should see incoming call modal with caller info

#### Step 4: Accept Call
1. **User B**: Click the green accept button or press Enter
2. **Verify**: Video call interface opens for both users
3. **Verify**: Local and remote video streams are visible

#### Step 5: Test Call Controls
1. **Mute/Unmute**: Test microphone toggle
2. **Video Toggle**: Test camera on/off
3. **Speaker Control**: Test audio output
4. **End Call**: Test call termination

### 2. Call Rejection Test

#### Step 1: Initiate Call
1. **User A**: Start video call with User B

#### Step 2: Reject Call
1. **User B**: Click the red reject button or press Escape
2. **Verify**: Call is rejected
3. **Verify**: Both users return to normal chat interface

### 3. Auto-Reject Test

#### Step 1: Initiate Call
1. **User A**: Start video call with User B

#### Step 2: Wait for Auto-Reject
1. **User B**: Do not interact with the call
2. **Wait**: 30 seconds for auto-reject
3. **Verify**: Call automatically rejected after timeout

### 4. Global Call Handling Test

#### Step 1: Navigate Away
1. **User B**: Navigate to a different page (e.g., Settings, Profile)
2. **User A**: Start video call with User B

#### Step 2: Verify Global Notification
1. **User B**: Should receive call notification regardless of current page
2. **Verify**: Incoming call modal appears over any page
3. **Verify**: Call can be accepted/rejected from any location

### 5. Offline User Test

#### Step 1: Check Offline Status
1. **User A**: Verify User B shows as "offline" in user list
2. **User A**: Try to click video call button

#### Step 2: Verify Disabled State
1. **Verify**: Video call button is disabled (grayed out)
2. **Verify**: Button shows "User is offline" tooltip

## Expected Behaviors

### Incoming Call Notifications
- ✅ **Immediate display** of incoming call modal
- ✅ **Ringing sound** plays continuously
- ✅ **Browser notification** appears (if permissions granted)
- ✅ **Window focus** when app is in background
- ✅ **30-second timer** with auto-reject
- ✅ **Keyboard shortcuts** (Enter to accept, Escape to reject)

### Video Call Interface
- ✅ **Full-screen modal** with video streams
- ✅ **Local video preview** in corner
- ✅ **Remote video** as main display
- ✅ **Call controls** (mute, video, speaker, end)
- ✅ **Connection status** indicators
- ✅ **Responsive design** for all screen sizes

### Call Management
- ✅ **Real-time signaling** via WebSocket
- ✅ **Call acceptance/rejection** handling
- ✅ **Proper cleanup** of media streams
- ✅ **Error handling** for failed connections
- ✅ **Call termination** for both users

## Troubleshooting

### Common Issues

#### 1. Camera/Microphone Not Working
- **Check**: Browser permissions for camera/microphone
- **Solution**: Grant permissions when prompted
- **Verify**: Device has working camera/microphone

#### 2. No Incoming Call Notifications
- **Check**: Socket connection status
- **Check**: Browser notification permissions
- **Check**: Console for error messages
- **Solution**: Refresh page and check network

#### 3. Call Connection Fails
- **Check**: Both users are online
- **Check**: Network connectivity
- **Check**: STUN server availability
- **Solution**: Try again or check network settings

#### 4. Audio/Video Quality Issues
- **Check**: Internet connection speed
- **Check**: Device performance
- **Check**: Browser WebRTC support
- **Solution**: Close other apps, check bandwidth

### Debug Information

#### Console Logs
Look for these log messages:
- `📞 Global incoming call received: [callData]`
- `✅ Call accepted globally: [callData]`
- `❌ Call rejected globally: [callData]`
- `📞 Call ended globally: [callData]`

#### Network Tab
Check for WebSocket connections and WebRTC signaling:
- Socket.IO connection status
- ICE candidate exchange
- SDP offer/answer exchange

## Performance Testing

### Load Testing
- **Multiple simultaneous calls**: Test with 3+ users
- **Bandwidth usage**: Monitor network consumption
- **CPU usage**: Check device performance during calls
- **Memory usage**: Verify proper cleanup after calls

### Cross-Device Testing
- **Desktop to Mobile**: Test different device combinations
- **Browser compatibility**: Test across different browsers
- **Network conditions**: Test with various connection speeds

## Security Testing

### Permission Testing
- **Camera access**: Verify permission requests
- **Microphone access**: Verify permission requests
- **Notification access**: Verify browser notification permissions

### Data Privacy
- **No server storage**: Verify media streams are peer-to-peer
- **Encrypted communication**: Verify WebRTC encryption
- **User authentication**: Verify only authenticated users can call

## Future Testing

### Planned Features
- **Group video calls**: Multiple participants
- **Screen sharing**: Share screen during calls
- **Call recording**: Record video calls
- **Background effects**: AI-powered background blur

### Advanced Scenarios
- **Network switching**: Test during network changes
- **Device switching**: Test camera/microphone switching
- **Call transfer**: Test call handoff between devices
- **Quality adaptation**: Test automatic quality adjustment

## Support

If you encounter issues during testing:
1. **Check console logs** for error messages
2. **Verify browser compatibility** and permissions
3. **Test with different browsers** and devices
4. **Check network connectivity** and firewall settings
5. **Report issues** with detailed error information
