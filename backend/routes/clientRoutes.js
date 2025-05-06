import express from "express";
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  loginClient,
} from "../controllers/clientController.js";
import {
  authenticate,
  restrictTo,
  authenticateClient,
} from "../middlewares/authmiddleware.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { clientSchema, loginSchema } from "../validators/validator.js";

const router = express.Router();

// Public routes
router.post("/login", validate(loginSchema), loginClient);
router.post("/register", validate(clientSchema), createClient);

// Admin routes (requires user authentication with admin role)
router.use("/admin", authenticate, restrictTo("admin"));
router.get("/admin", getAllClients);
router.get("/admin/:id", getClientById);
router.put("/admin/:id", validatePartial(clientSchema), updateClient);
router.delete("/admin/:id", deleteClient);

// Client routes (requires client authentication)
router.use("/profile", authenticateClient);
router.get("/profile", (req, res) => {
  // Return the authenticated client's profile
  res.json({
    success: true,
    data: {
      id: req.client.client_id,
      // Other client details can be added here
    },
  });
});
router.put("/profile", validatePartial(clientSchema), (req, res, next) => {
  // Update the authenticated client's profile
  req.params.id = req.client.client_id;
  updateClient(req, res, next);
});

export default router;
