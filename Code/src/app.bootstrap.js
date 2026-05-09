import { port } from "../config/config.service.js";
import { connectDB, redisConnection } from "./DB/index.js";
import { globalErrorHandling } from "./common/utils/response/error.response.js";
import {
  authRouter,
  userRouter,
  messageRouter,
  notificationRouter,
} from "./modules/index.js";
import express from "express";
import cors from "cors";
import { resolve } from "path";
import path from 'path'

async function bootstrap() {
  const app = express();

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

  // Allow all origins in development; tighten in production via env
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Parse JSON bodies
  app.use(express.json());

  // Serve uploaded files statically
  app.use("/uploads", express.static(resolve("../uploads")));

  app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

  // DB connections
  await connectDB();
  await redisConnection();

  // Routes
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/message", messageRouter);
  app.use("/notification", notificationRouter);

  // Health check
  app.get("/health", (req, res) =>
    res.json({ status: "ok", timestamp: new Date().toISOString() }),
  );

  // 404 handler
  app.use("{/*dummy}", (req, res) => {
    return res.status(404).json({ message: "Invalid application routing" });
  });

  // Global async error wrapper – catches unhandled promise rejections in route handlers
  app.use((err, req, res, next) => {
    globalErrorHandling(err, req, res, next);
  });

  app.listen(port, () => console.log(`Server is running on port ${port} 🚀`));
}
export default bootstrap;
