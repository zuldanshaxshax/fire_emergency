import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "dotenv";
import { errorHandler } from "./middlewares/authmiddleware.js";
import routes from "./routes/index.js";
import { connectDB } from "./database/connection.js";
import syncDatabase from "./database/sync.js";
import { createServer } from "http";
import { Server } from "socket.io";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io available globally
app.set("io", io);

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Welcome route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Fire Emergency Response API",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/v1", routes);

// Global error handler
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Database connection and server startup
const startServer = async () => {
  try {
    httpServer.listen(PORT, async () => {
      await connectDB(); // Test the database connection
      await syncDatabase(); // Call the function to sync the database
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO server is running`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

startServer();

export default app;
