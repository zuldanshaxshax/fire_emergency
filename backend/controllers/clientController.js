import { Client } from "../models/index.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { clientSchema, loginSchema } from "../validators/validator.js";

// Generate JWT token
const generateToken = (client) => {
  return jwt.sign(
    {
      client_id: client.id,
      type: "client",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};
// Client login
export const loginClient = async (req, res, next) => {
  try {
    // Validate login data
    const validatedData = loginSchema.parse(req.body);

    // Find client by phone
    const client = await Client.findOne({
      where: { phone: validatedData.phone },
    });
    if (!client) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    // Check password
    const isPasswordValid = await client.validPassword(validatedData.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    // Generate JWT token
    const authToken = generateToken(client);

    // Return client without password
    const clientWithoutPassword = {
      ...client.get(),
      password: undefined,
    };

    res.json({
      success: true,
      data: {
        client: clientWithoutPassword,
        authToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all clients
export const getAllClients = async (req, res, next) => {
  try {
    const clients = await Client.findAll({
      attributes: { exclude: ["password"] },
      order: [["created_at", "DESC"]],
    });
    res.json({
      success: true,
      data: clients,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single client by ID
export const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }
    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new client
export const createClient = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = clientSchema.parse(req.body);

    // Check if phone number already exists
    const existingClient = await Client.findOne({
      where: { phone: validatedData.phone },
    });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: "Phone number already in use",
      });
    }

    // Create new client
    const newClient = await Client.create(validatedData);

    // Generate JWT token for auto-login
    const authToken = generateToken(newClient);

    // Return client without password
    const clientWithoutPassword = {
      ...newClient.get(),
      password: undefined,
    };

    res.status(201).json({
      success: true,
      data: {
        client: clientWithoutPassword,
        authToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update a client
export const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Validate request body
    const validatedData = clientSchema.partial().parse(req.body);

    // If updating phone, check if it's already in use
    if (validatedData.phone && validatedData.phone !== client.phone) {
      const existingClient = await Client.findOne({
        where: { phone: validatedData.phone },
      });
      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }
    }

    // Update client
    await client.update(validatedData);

    // Return client without password
    const clientWithoutPassword = {
      ...client.get(),
      password: undefined,
    };

    res.json({
      success: true,
      data: clientWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a client
export const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }
    await client.destroy();
    res.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
