import express from "express";
import Notification from "../models/Notification.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get current user's notifications
router.get("/", authMiddleware, async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("sender", "username")
    .sort({ createdAt: -1 });
  res.json(notifications);
});


// Mark as read
router.put("/:id/read", authMiddleware, async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;