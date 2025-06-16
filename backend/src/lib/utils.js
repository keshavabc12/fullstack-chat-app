
import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return token;
  } catch (error) {
    console.error("Error generating JWT token:", error);
    throw new Error("Token generation failed");
  }
};
