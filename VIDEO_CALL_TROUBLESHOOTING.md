# Video Call Troubleshooting Guide

## 🚨 **CRITICAL: Video Call Notifications Not Working**

If you're not receiving video call notifications, follow this troubleshooting guide step by step.

## 🔍 **Step 1: Check Console Logs**

Open your browser's Developer Tools (F12) and check the Console tab for these log messages:

### ✅ **Expected Logs (Working System):**
```
✅ Video call service initialized with socket
🔌 Setting up video call socket listeners...
✅ Video call socket listeners setup complete
📞 Global incoming call received: [callData]
📞 Incoming call request received: [callData]
```

### ❌ **Error Logs (Problem Indicators):**
```
❌ No socket connection available
❌ Socket not connected
❌ No authenticated user
❌ Failed to initialize call
```

## 🔧 **Step 2: Verify Backend Socket Handler**

The backend must have video call event handlers. Check if `backend/src/lib/socket.js` contains:

```javascript
// Video Call Event Handlers
socket.on("videoCallRequest", (data) => { ... });
socket.on("videoCallAccepted", (data) => { ... });
socket.on("videoCallRejected", (data) => { ... });
socket.on("videoCallEnded", (data) => { ... });
socket.on("offer", (data) => { ... });
socket.on("answer", (data) => { ... });
socket.on("iceCandidate", (data) => { ... });
```

**If missing:** The backend needs to be updated with the video call handlers.

## 🔌 **Step 3: Check Socket Connection**

### **Frontend Socket Status:**
1. Look for the **Video Call Debug** panel (bottom-left corner)
2. Check **Socket Status** - should show "connected"
3. Check **Service Status** - should show "connected"

### **Backend Socket Logs:**
Look for these messages in your backend console:
```
🔌 User connected: [socketId]
✅ User [userId] mapped to socket [socketId]
📡 Emitted online users: [userIds]
```

## 📱 **Step 4: Test Media Permissions**

### **Browser Permissions:**
1. Click the lock icon in your browser's address bar
2. Ensure **Camera** and **Microphone** are set to "Allow"
3. Refresh the page after changing permissions

### **Test Media Access:**
1. Click **"Test Media"** button in the debug panel
2. Should see: "✅ Media access test successful!"
3. If failed: Check device connections and browser settings

## 🧪 **Step 5: Test Call Flow**

### **Test 1: Basic Call Initiation**
1. **User A**: Select a user and click video call button
2. **Check Console**: Should see "📞 Initiating video call with: [name]"
3. **Check Backend**: Should see "📞 Video call request: [data]"

### **Test 2: Call Reception**
1. **User B**: Should see incoming call notification immediately
2. **Check Console**: Should see "📞 Global incoming call received: [data]"
3. **Check UI**: Incoming call modal should appear

### **Test 3: Call Acceptance**
1. **User B**: Click accept button
2. **Check Console**: Should see "✅ Call accepted globally: [data]"
3. **Check UI**: Video call interface should open

## 🚫 **Common Issues & Solutions**

### **Issue 1: No Incoming Call Notifications**

**Symptoms:**
- Call button works but receiver gets no notification
- No console logs for incoming calls

**Causes & Solutions:**

#### **A. Backend Missing Video Call Handlers**
```bash
# Check if backend/src/lib/socket.js has video call events
grep -r "videoCallRequest" backend/src/
```

**Solution:** Update backend socket handler with video call events.

#### **B. Frontend Service Not Initialized**
**Check:** Console shows "❌ No socket connection available"

**Solution:** 
1. Ensure `GlobalVideoCallHandler` is mounted in App.jsx
2. Verify socket connection is established
3. Check authentication state

#### **C. Socket Events Not Forwarded**
**Check:** Backend receives request but frontend doesn't

**Solution:** Verify backend properly forwards events to target user's socket.

### **Issue 2: Call Button Disabled**

**Symptoms:**
- Video call button is grayed out
- Tooltip shows "User is offline"

**Causes & Solutions:**

#### **A. User Not Online**
**Check:** User list shows user as offline

**Solution:** 
1. Ensure both users are logged in
2. Check socket connection status
3. Verify backend emits "getOnlineUsers" event

#### **B. Socket Connection Failed**
**Check:** Debug panel shows "disconnected"

**Solution:**
1. Refresh the page
2. Check network connectivity
3. Verify backend is running

### **Issue 3: Call Connects But No Video**

**Symptoms:**
- Call interface opens
- No video streams visible
- Console shows connection errors

**Causes & Solutions:**

#### **A. Media Permissions Denied**
**Check:** Browser shows camera/microphone blocked

**Solution:**
1. Click lock icon in address bar
2. Allow camera and microphone
3. Refresh page

#### **B. WebRTC Connection Failed**
**Check:** Console shows "❌ Failed to initialize call"

**Solution:**
1. Check STUN server availability
2. Verify firewall settings
3. Test with different network

## 🛠️ **Debug Commands**

### **Frontend Debug:**
```javascript
// Check video call service status
console.log(videoCallService.getConnectionStatus());

// Check socket connection
console.log(socket.connected);

// Test media access
navigator.mediaDevices.getUserMedia({video: true, audio: true})
  .then(stream => console.log("Media OK:", stream))
  .catch(err => console.error("Media Error:", err));
```

### **Backend Debug:**
```javascript
// Check connected users
console.log("Connected users:", Object.keys(userSocketMap));

// Test event emission
io.emit("test", {message: "Test event"});
```

## 📋 **Testing Checklist**

### **Pre-Test Requirements:**
- [ ] Backend running with video call handlers
- [ ] Both users logged in and online
- [ ] Camera and microphone permissions granted
- [ ] Browser supports WebRTC
- [ ] Network allows WebSocket connections

### **Test Sequence:**
1. [ ] **Socket Connection**: Both users show as online
2. [ ] **Call Initiation**: User A can click call button
3. [ ] **Call Request**: Backend receives and forwards request
4. [ ] **Call Notification**: User B sees incoming call modal
5. [ ] **Call Acceptance**: User B can accept call
6. [ ] **Video Connection**: Both users see video streams
7. [ ] **Call Controls**: Mute, video toggle, end call work
8. [ ] **Call Termination**: Call ends properly for both users

## 🆘 **Emergency Fixes**

### **If Nothing Works:**
1. **Restart Backend**: Kill and restart the Node.js server
2. **Clear Browser Data**: Clear cookies, cache, and site data
3. **Check Network**: Ensure no firewall blocking WebSocket/WebRTC
4. **Update Dependencies**: Run `npm install` in both frontend and backend
5. **Check Logs**: Look for any error messages in both consoles

### **Quick Reset:**
```bash
# Backend
cd backend
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

## 📞 **Support Information**

### **Debug Data to Collect:**
1. **Console Logs**: Copy all console messages
2. **Network Tab**: Check WebSocket connections
3. **Backend Logs**: Copy server console output
4. **Browser Info**: Version, OS, device type
5. **Network Info**: Connection type, firewall status

### **Contact Support:**
When reporting issues, include:
- Complete error messages
- Console logs from both frontend and backend
- Steps to reproduce the issue
- Browser and device information
- Network environment details

---

## 🎯 **Quick Fix Summary**

**Most Common Issue:** Backend missing video call event handlers

**Quick Fix:** Update `backend/src/lib/socket.js` with the video call event handlers provided in this implementation.

**Test Command:** Look for "📞 Video call request:" in backend console when initiating a call.

**Success Indicator:** Receiver sees incoming call notification within 1-2 seconds of call initiation.
