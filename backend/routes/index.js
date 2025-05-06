import express from "express";
import userRoutes from "./userRoutes.js";
import clientRoutes from "./clientRoutes.js";
import emergencyRoutes from "./emergencyRoutes.js";
import assignmentRoutes from "./assignmentRoutes.js";
import authRoutes from "./auth.routes.js";

const router = express.Router();

// Authentication routes
router.use("/auth", authRoutes);

// Resource routes
router.use("/users", userRoutes);
router.use("/clients", clientRoutes);
router.use("/emergencies", emergencyRoutes);
router.use("/assignments", assignmentRoutes);

export default router;
