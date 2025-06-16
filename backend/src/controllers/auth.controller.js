import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js"; // correct path and extension
 // adjust path as needed


export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    generateToken(newUser._id, res);

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
    });
  } catch (error) {
    console.error("Error in signup controller:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in login controller:", error.message);
    res.status(500).json({ msg: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try{
res.cookie("jwt"," ",{maxAge:0})
res.status(200).json({msg:"Logged out successfully"});
  }catch(error){
    console.log("error in logout controller",error.message);
    res.status(500).json({ msg: "Internal server error" });
  }
};



export const updateProfile = async (req, res) => {
  try {
    console.log("🟡 req.body:", req.body);
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      console.log("🚫 No profilePic in body");
      return res.status(400).json({ msg: "Please add a profile picture" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    console.log("✅ Cloudinary upload success:", uploadResponse);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    console.log("✅ User updated:", updatedUser);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("❌ Error in updateProfile:", error);
    res.status(500).json({ msg: "Server error" });
  }
};



export const checkAuth = async (req, res) => {
  try {
    const userId = req.user._id;

    const userData = await User.findById(userId).select("-password"); // exclude password, but keep createdAt

    if (!userData) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json(userData); // this will include createdAt
  } catch (error) {
    console.error("❌ Error in checkAuth:", error);
    res.status(500).json({ msg: "Server error" });
  }
}