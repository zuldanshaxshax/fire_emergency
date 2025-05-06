import { User, Assignment, Emergency } from "../models/index.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { userSchema, loginSchema } from "../validators/validator.js";
import { Op } from "sequelize";

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.id,
      role: user.role,
      type: "user",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Get all users
export const getAllUsers = async (req, res, next) => {
  try {
    // Get all users with their basic info
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["created_at", "DESC"]],
    });

    // For staff members, check if they are assigned to any active emergencies
    const staffIds = users
      .filter((user) => user.role === "staff")
      .map((user) => user.id);

    // Find active assignments for all staff members
    const activeAssignments = await Assignment.findAll({
      where: {
        staff_id: { [Op.in]: staffIds },
        status: "assigned", // Only active assignments
      },
      include: [
        {
          model: Emergency,
          where: {
            status: "assigned", // Only active emergencies
          },
          required: true,
        },
      ],
    });

    // Create a map of staff IDs to their active status
    const activeStaffMap = {};
    activeAssignments.forEach((assignment) => {
      activeStaffMap[assignment.staff_id] = true;
    });

    // Enhance user objects with active status
    const enhancedUsers = users.map((user) => {
      const userData = user.get({ plain: true });

      // Only add active_status for staff members
      if (userData.role === "staff") {
        userData.active_status = activeStaffMap[userData.id]
          ? "in_work"
          : "available";
      }

      return userData;
    });

    res.json({
      success: true,
      data: enhancedUsers,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single user by ID
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If the user is a staff member, check if they have active assignments
    const userData = user.get({ plain: true });

    if (userData.role === "staff") {
      const activeAssignment = await Assignment.findOne({
        where: {
          staff_id: userData.id,
          status: "assigned",
        },
        include: [
          {
            model: Emergency,
            where: {
              status: "assigned",
            },
            required: true,
          },
        ],
      });

      userData.active_status = activeAssignment ? "in_work" : "available";
    }

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new user
export const createUser = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = userSchema.parse(req.body);

    // Check if phone number already exists
    const existingUser = await User.findOne({
      where: { phone: validatedData.phone },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already in use",
      });
    }

    // Create new user
    const newUser = await User.create(validatedData);

    // Return user without password
    const userWithoutPassword = {
      ...newUser.get(),
      password: undefined,
    };

    res.status(201).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

// Update a user
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate request body
    const validatedData = userSchema.partial().parse(req.body);

    // If updating phone, check if it's already in use
    if (validatedData.phone && validatedData.phone !== user.phone) {
      const existingUser = await User.findOne({
        where: { phone: validatedData.phone },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }
    }

    // Update user
    await user.update(validatedData);

    // Return user without password
    const userWithoutPassword = {
      ...user.get(),
      password: undefined,
    };

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a user
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    await user.destroy();
    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// User login
export const loginUser = async (req, res, next) => {
  try {
    // Validate login data
    const validatedData = loginSchema.parse(req.body);

    // Find user by phone
    const user = await User.findOne({ where: { phone: validatedData.phone } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    // Check password
    const isPasswordValid = await user.validPassword(validatedData.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    // Generate JWT token
    const authToken = generateToken(user);

    // Return user without password
    const userWithoutPassword = {
      ...user.get(),
      password: undefined,
    };

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        authToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin login
export const loginAdmin = async (req, res, next) => {
  try {
    // Validate login data
    const validatedData = loginSchema.parse(req.body);

    // Find user by phone
    const user = await User.findOne({ where: { phone: validatedData.phone } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.validPassword(validatedData.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin accounts can access this system.",
      });
    }

    // Generate JWT token
    const authToken = generateToken(user);

    // Return user without password
    const userWithoutPassword = {
      ...user.get(),
      password: undefined,
    };

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        authToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Staff login
export const loginStaff = async (req, res, next) => {
  try {
    // Validate login data
    const validatedData = loginSchema.parse(req.body);

    // Find user by phone
    const user = await User.findOne({ where: { phone: validatedData.phone } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.validPassword(validatedData.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is staff
    if (user.role !== "staff") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only staff accounts can access this system.",
      });
    }

    // Generate JWT token
    const authToken = generateToken(user);

    // Return user without password
    const userWithoutPassword = {
      ...user.get(),
      password: undefined,
    };

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        authToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
// Update a user
export const updateUserProfile = async (req, res, next) => {
  try {
    // Get user ID from authenticated user in middleware
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate request body - only allow name, phone, and current password
    const { name, phone, currentPassword, newPassword } = req.body;

    // If trying to update password, validate current password
    if (currentPassword) {
      const isPasswordValid = await user.validPassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    // If updating phone, check if it's already in use
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({
        where: { phone },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (newPassword) updateData.password = newPassword;

    // Update user
    await user.update(updateData);

    // Return user without password
    const userWithoutPassword = {
      ...user.get(),
      password: undefined,
    };

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};
