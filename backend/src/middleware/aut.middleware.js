import jwt from "jsonwebtoken";
import User from '../models/user.model.js';

export const protectRoute=async (req,res,next)=>{
    try{
        console.log("🔐 protectRoute called for:", req.path);
        console.log("🍪 Cookies:", req.cookies);
        
        const token =req.cookies.jwt;
        if(!token){
            console.log("❌ No JWT token found in cookies");
            return res.status(401).json({message:"unauthorized -No token provided"});
        }
        
        console.log("✅ JWT token found, verifying...");
        const decoded=jwt.verify (token,process.env.JWT_SECRET);
        if(!decoded){
            console.log("❌ Invalid JWT token");
            return res.status(401).json({message:"unauthorized-invalid token"});
        }
        
        console.log("✅ JWT token verified, finding user:", decoded.userId);
        const user=await User.findById(decoded.userId).select("-password");
        if(!user){
            console.log("❌ User not found in database");
            return res.status(404).json({message:"user not found"});
        }
        
        console.log("✅ User authenticated:", user._id);
        req.user=user
        next()
    }
catch(error){
    console.error("❌ Error in protectRoute middleware:", error.message);
    console.error("❌ Full error:", error);
   res.status(500).json({message:"internal server error"});

    }
}