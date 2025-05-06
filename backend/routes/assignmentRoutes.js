import express from "express";
import {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getStaffAssignments,
  updateStaffAssignment,
} from "../controllers/assignmentController.js";
import { authenticate, restrictTo } from "../middlewares/authmiddleware.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { assignmentSchema } from "../validators/validator.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes accessible by both admin and staff
router.get("/my", getStaffAssignments);

// Staff can update their own assignments (mark as completed)
router.put("/my/:id", validatePartial(assignmentSchema), updateStaffAssignment);

// Admin-only routes
router
  .route("/")
  .get(restrictTo("admin"), getAllAssignments)
  .post(restrictTo("admin"), validate(assignmentSchema), createAssignment);

router
  .route("/:id")
  .get(restrictTo("admin"), getAssignmentById)
  .put(restrictTo("admin"), validatePartial(assignmentSchema), updateAssignment)
  .delete(restrictTo("admin"), deleteAssignment);

// Get assignments for a specific staff member (admin only)
router.get("/staff/:staff_id", restrictTo("admin"), getStaffAssignments);

export default router;
