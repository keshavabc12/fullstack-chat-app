import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// ✅ Get all users except the logged-in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Get chat messages between two users
export const getMessages = async (req, res) => {
  try {
    console.log("📥 getMessages called with:", { params: req.params, user: req.user });
    
    const { id: userToChatId } = req.params;
    const myId = req.user._id; // ❌ FIXED: was req.User._id (capital U)

    console.log("🔍 Fetching messages between:", { myId, userToChatId });

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }); // ✅ sort by time to show messages in order

    console.log(`✅ Found ${messages.length} messages`);
    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Error in getMessages controller:", error.message);
    console.error("❌ Full error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Send a message
export const sendMessage = async (req, res) => {
  try {
    console.log("📨 sendMessage called with:", { body: req.body, params: req.params, user: req.user });
    
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    console.log("📝 Message details:", { text, image, receiverId, senderId });

    let imageUrl;
    if (image) {
      console.log("🖼️ Processing image upload...");
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
      console.log("✅ Image uploaded:", imageUrl);
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    console.log("💾 Saving message to database:", newMessage);
    await newMessage.save();
    console.log("✅ Message saved successfully:", newMessage._id);

    // ✅ Real-time messaging via Socket.IO
    const receiverSocketId = getReceiverSocketId(receiverId);
    console.log("🔌 Receiver socket ID:", receiverSocketId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      console.log("📡 Message emitted to socket:", receiverSocketId);
    } else {
      console.log("⚠️ Receiver not online, message saved but not delivered in real-time");
    }

    res.status(201).json(newMessage); // ✅ Return full saved message (including _id)
  } catch (error) {
    console.error("❌ Error in sendMessage controller:", error.message);
    console.error("❌ Full error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
