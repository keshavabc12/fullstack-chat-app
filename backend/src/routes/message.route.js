import express from 'express';
import { protectRoute } from '../middleware/aut.middleware.js';
import { getMessages, getUsersForSidebar, sendMessage } from '../controllers/message.controller.js';

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);  // ✅ Fixed: matches frontend call /messages/${userId}
router.post("/send/:id", protectRoute, sendMessage);

export default router;
