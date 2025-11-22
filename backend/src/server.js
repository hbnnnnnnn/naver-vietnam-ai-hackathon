import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import userRoutes from "./routes/user.route.js";
import weatherRoutes from "./routes/weather.route.js";
import productRoutes from "./routes/product.route.js";
import routineRoutes from "./routes/routine.route.js";
import ingredientRoutes from "./routes/ingredient.route.js";
import chatbotRoutes from "./routes/chatbot.route.js";
import imageRoutes from "./routes/image.route.js";

const app = express();

// Increase timeout for long-running requests (5 minutes)
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  next();
});

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Disable helmet and rate limiter for debugging
// app.use(helmet({
//   contentSecurityPolicy: false,
//   crossOriginEmbedderPolicy: false
// }));
// app.use(rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false
// }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/ingredient", ingredientRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api", imageRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend alive", timestamp: new Date().toISOString() });
});

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/skincare-app";

// MongoDB connection with SSL options for Node v24 compatibility
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log("Retrying MongoDB connection in 5 seconds...");
    setTimeout(connectToMongoDB, 5000);
  }
};

connectToMongoDB();

const PORT = process.env.PORT || 5731;
const server = app.listen(PORT, "localhost", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
});

// Handle server errors
server.on("error", (err) => {
  console.error("Server error:", err);
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
  }
});
