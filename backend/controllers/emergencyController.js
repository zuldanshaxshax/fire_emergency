import { Emergency, Client, User, Assignment } from "../models/index.js";
import { emergencySchema } from "../validators/validator.js";
import { Op } from "sequelize";

// Get all emergencies
export const getAllEmergencies = async (req, res, next) => {
  try {
    const emergencies = await Emergency.findAll({
      include: [
        { model: Client, attributes: ["name", "phone"] },
        {
          model: Assignment,
          include: [{ model: User, attributes: ["name", "phone"] }],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json({
      success: true,
      data: emergencies,
    });
  } catch (error) {
    next(error);
  }
};

// Get emergencies with filtering options
export const getFilteredEmergencies = async (req, res, next) => {
  try {
    const { status, level, client_id, start_date, end_date } = req.query;

    // Build where clause
    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (level) {
      whereClause.level = level;
    }

    if (client_id) {
      whereClause.client_id = client_id;
    }

    // Date range filter
    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)],
      };
    } else if (start_date) {
      whereClause.created_at = {
        [Op.gte]: new Date(start_date),
      };
    } else if (end_date) {
      whereClause.created_at = {
        [Op.lte]: new Date(end_date),
      };
    }

    // Get filtered emergencies
    const emergencies = await Emergency.findAll({
      where: whereClause,
      include: [
        { model: Client, attributes: ["name", "phone"] },
        {
          model: Assignment,
          include: [{ model: User, attributes: ["name", "phone"] }],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: emergencies,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single emergency by ID
export const getEmergencyById = async (req, res, next) => {
  try {
    const emergency = await Emergency.findByPk(req.params.id, {
      include: [
        { model: Client, attributes: ["name", "phone", "address"] },
        {
          model: Assignment,
          include: [{ model: User, attributes: ["name", "phone"] }],
        },
      ],
    });
    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    // Debug assignments
    console.log(
      `Emergency #${req.params.id} assignments:`,
      emergency.Assignments
        ? emergency.Assignments.map((a) => ({
            id: a.id,
            staff_id: a.staff_id,
            has_user: !!a.User,
            user_name: a.User?.name,
          }))
        : "No assignments"
    );

    res.json({
      success: true,
      data: emergency,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new emergency
export const createEmergency = async (req, res, next) => {
  try {
    // Parse and validate request body
    const rawData = req.body;

    // Ensure numeric fields are properly converted
    const dataToValidate = {
      ...rawData,
      client_id: rawData.client_id
        ? parseInt(rawData.client_id, 10)
        : undefined,
      lat: rawData.lat ? parseFloat(rawData.lat) : undefined,
      lng: rawData.lng ? parseFloat(rawData.lng) : undefined,
    };

    // Validate with Zod schema
    const validatedData = emergencySchema.parse(dataToValidate);

    // If client is authenticated, use their ID
    if (req.client && !validatedData.client_id) {
      validatedData.client_id = req.client.client_id;
    }

    // Check if client exists
    const client = await Client.findByPk(validatedData.client_id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // If location not provided, use client's default location
    if (
      (!validatedData.lat || !validatedData.lng || !validatedData.address) &&
      (client.lat || client.lng || client.address)
    ) {
      if (!validatedData.lat && client.lat) validatedData.lat = client.lat;
      if (!validatedData.lng && client.lng) validatedData.lng = client.lng;
      if (!validatedData.address && client.address)
        validatedData.address = client.address;
    }

    // Create new emergency
    const newEmergency = await Emergency.create(validatedData);

    // Return the created emergency with client details
    const emergencyWithClient = await Emergency.findByPk(newEmergency.id, {
      include: [{ model: Client, attributes: ["name", "phone"] }],
    });

    // Emit socket event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.emit("emergency:created", emergencyWithClient);
      io.emit("dashboard:update"); // Trigger dashboard refresh
    }

    res.status(201).json({
      success: true,
      data: emergencyWithClient,
    });
  } catch (error) {
    next(error);
  }
};

// Update an emergency
export const updateEmergency = async (req, res, next) => {
  try {
    const emergency = await Emergency.findByPk(req.params.id);
    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    // Parse raw data and ensure proper type conversion
    const rawData = req.body;

    // Ensure numeric fields are properly converted
    const dataToValidate = {
      ...rawData,
      client_id: rawData.client_id
        ? parseInt(rawData.client_id, 10)
        : undefined,
      lat: rawData.lat ? parseFloat(rawData.lat) : undefined,
      lng: rawData.lng ? parseFloat(rawData.lng) : undefined,
    };

    // Validate request body
    const validatedData = emergencySchema.partial().parse(dataToValidate);

    // If client is being changed, check if new client exists
    if (
      validatedData.client_id &&
      validatedData.client_id !== emergency.client_id
    ) {
      const client = await Client.findByPk(validatedData.client_id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found",
        });
      }
    }

    // Update emergency
    await emergency.update(validatedData);

    // Return the updated emergency with all details
    const updatedEmergency = await Emergency.findByPk(emergency.id, {
      include: [
        { model: Client, attributes: ["name", "phone"] },
        {
          model: Assignment,
          include: [{ model: User, attributes: ["name", "phone"] }],
        },
      ],
    });

    // Emit socket event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.emit("emergency:updated", updatedEmergency);
      io.emit("dashboard:update"); // Trigger dashboard refresh
    }

    res.json({
      success: true,
      data: updatedEmergency,
    });
  } catch (error) {
    next(error);
  }
};

// Delete an emergency
export const deleteEmergency = async (req, res, next) => {
  try {
    const emergency = await Emergency.findByPk(req.params.id, {
      include: [{ model: Assignment }],
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    // Prevent deletion of assigned emergencies
    if (emergency.status === "assigned") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete an emergency that is currently assigned. Unassign it first.",
      });
    }

    // Prevent deletion of completed emergencies
    if (emergency.status === "completed") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete a completed emergency due to record-keeping requirements.",
      });
    }

    // Check if emergency has assignments
    if (emergency.Assignments && emergency.Assignments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete an emergency with existing assignments.",
      });
    }

    await emergency.destroy();

    // Emit socket event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.emit("emergency:deleted", req.params.id);
      io.emit("dashboard:update"); // Trigger dashboard refresh
    }

    res.json({
      success: true,
      message: "Emergency deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get emergencies for a specific client
export const getClientEmergencies = async (req, res, next) => {
  try {
    const clientId = req.client ? req.client.client_id : req.params.client_id;

    // Check if client exists
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Get client emergencies
    const emergencies = await Emergency.findAll({
      where: { client_id: clientId },
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: emergencies,
    });
  } catch (error) {
    next(error);
  }
};
