import express from "express";
import {
  loginUser,
  loginAdmin,
  loginStaff,
} from "../controllers/userController.js";
import { loginClient, createClient } from "../controllers/clientController.js";

const router = express.Router();

// User authentication (general login - to be deprecated)
router.post("/login", loginUser);

// Role-specific authentication
router.post("/admin/login", loginAdmin);
router.post("/staff/login", loginStaff);

// Client authentication
router.post("/client/login", loginClient);
router.post("/client/register", createClient);

export default router;
