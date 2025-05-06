import express from "express";
import {
  getAllEmergencies,
  getEmergencyById,
  createEmergency,
  updateEmergency,
  deleteEmergency,
  getClientEmergencies,
  getFilteredEmergencies,
} from "../controllers/emergencyController.js";
import {
  authenticate,
  restrictTo,
  authenticateClient,
} from "../middlewares/authmiddleware.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { emergencySchema } from "../validators/validator.js";

const router = express.Router();

// Client routes
// Create emergency (public route for now, can be changed to require client authentication)
router.post("/report", validate(emergencySchema), createEmergency);

// Get client's emergencies (requires client authentication)
router.get("/my", authenticateClient, getClientEmergencies);

// Admin and staff routes (requires authentication)
router.use(authenticate);

// Routes accessible by both admin and staff
router.get("/", getFilteredEmergencies);
router.get("/:id", getEmergencyById);

// Admin-only routes
router.post(
  "/",
  restrictTo("admin"),
  validate(emergencySchema),
  createEmergency
);
router.put(
  "/:id",
  restrictTo("admin"),
  validatePartial(emergencySchema),
  updateEmergency
);
router.delete("/:id", restrictTo("admin"), deleteEmergency);

export default router;
