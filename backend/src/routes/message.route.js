import express from 'express';
import { protectRoute } from '../middleware/aut.middleware.js';
import { getMessages, getUsersForSidebar, sendMessage } from '../controllers/message.controller.js';

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/user/:id", protectRoute, getMessages);  // ✅ fixed path
router.post("/send/:id", protectRoute, sendMessage);

export default router;
