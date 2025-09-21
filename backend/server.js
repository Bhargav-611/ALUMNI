import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import { connectDB } from "./config.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import chatRoutes from "./routes/chatRoutes.js"; // <-- new chat routes
import path from "path";
import { fileURLToPath } from "url";
import Message from "./models/Message.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: { origin: "http://localhost:5173", credentials: true }
});

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/chat", chatRoutes); // chat routes

// Real-time chat logic
io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);
  
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat ${chatId}`);
    });
  
    socket.on("send_message", async ({ chatId, senderId, text }) => {
      try {
        const newMessage = await Message.create({
          chat: chatId,
          sender: senderId,
          text
        });
  
        io.to(chatId).emit("receive_message", {
          _id: newMessage._id,
          chat: chatId,
          sender: senderId,
          text,
          createdAt: newMessage.createdAt
        });
      } catch (err) {
        console.error("Message save error:", err);
      }
    });
  
    socket.on("disconnect", () => {
      console.log("❌ User disconnected");
    });
  });

// Use server.listen for Socket.IO
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
