import { Assignment, User, Emergency, Client } from "../models/index.js";
import { assignmentSchema } from "../validators/validator.js";
import {
  notifyStaffAssignment,
  notifyClientAssignment,
} from "../services/twilioService.js";

// Get all assignments
export const getAllAssignments = async (req, res, next) => {
  try {
    const assignments = await Assignment.findAll({
      include: [
        { model: User, attributes: ["name", "phone"] },
        {
          model: Emergency,
          include: [{ model: Client, attributes: ["name", "phone"] }],
        },
      ],
      order: [["assigned_at", "DESC"]],
    });
    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single assignment by ID
export const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ["name", "phone"] },
        {
          model: Emergency,
          include: [
            { model: Client, attributes: ["name", "phone", "address"] },
          ],
        },
      ],
    });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }
    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new assignment
export const createAssignment = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = assignmentSchema.parse(req.body);

    // Check if staff exists
    const staff = await User.findByPk(validatedData.staff_id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Check if emergency exists
    const emergency = await Emergency.findByPk(validatedData.emergency_id);
    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    // Check if emergency is already assigned
    const existingAssignment = await Assignment.findOne({
      where: { emergency_id: validatedData.emergency_id },
    });
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "This emergency is already assigned",
      });
    }

    // Check if emergency is in 'pending' status
    if (emergency.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot assign emergency with status '${emergency.status}'`,
      });
    }

    // Create new assignment and update emergency status
    const newAssignment = await Assignment.create(validatedData);
    await emergency.update({ status: "assigned" });

    // Return the created assignment with relations
    const assignmentWithRelations = await Assignment.findByPk(
      newAssignment.id,
      {
        include: [
          { model: User, attributes: ["name", "phone"] },
          {
            model: Emergency,
            include: [{ model: Client, attributes: ["name", "phone"] }],
          },
        ],
      }
    );
    // Send SMS notifications
    try {
      await notifyStaffAssignment(
        staff,
        emergency,
        assignmentWithRelations.Emergency.Client
      );
      await notifyClientAssignment(
        assignmentWithRelations.Emergency.Client,
        staff,
        emergency
      );
    } catch (smsError) {
      console.error("Failed to send SMS notifications:", smsError);
      // Continue with the process even if SMS fails
    }

    // Emit socket events
    const io = req.app.get("io");
    if (io) {
      io.emit("assignment:created", assignmentWithRelations);
      io.emit("emergency:updated", assignmentWithRelations.Emergency);
      io.emit("dashboard:update");
    }

    res.status(201).json({
      success: true,
      data: assignmentWithRelations,
    });
  } catch (error) {
    next(error);
  }
};

// Update an assignment
export const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ["name", "phone"] },
        {
          model: Emergency,
          include: [{ model: Client, attributes: ["name", "phone"] }],
        },
      ],
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Get previous state information
    const previousStaffId = assignment.staff_id;
    const previousStatus = assignment.status;

    // Validate request body
    const validatedData = assignmentSchema.partial().parse(req.body);

    // If staff is being changed, check if new staff exists and is available
    if (
      validatedData.staff_id &&
      validatedData.staff_id !== assignment.staff_id
    ) {
      const staff = await User.findByPk(validatedData.staff_id);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: "Staff not found",
        });
      }

      // Check if staff is already assigned to another emergency
      const existingAssignment = await Assignment.findOne({
        where: {
          staff_id: validatedData.staff_id,
          status: "assigned",
        },
        include: [
          {
            model: Emergency,
            where: { status: "assigned" },
          },
        ],
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: "This staff member is already assigned to another emergency",
        });
      }

      console.log(
        `Changing assignment ${assignment.id} staff from ${assignment.staff_id} to ${validatedData.staff_id}`
      );
    }

    // Handle status change
    if (validatedData.status && validatedData.status !== assignment.status) {
      // If marking as completed, update the emergency status as well
      if (validatedData.status === "completed" && assignment.Emergency) {
        await assignment.Emergency.update({ status: "completed" });
      }
    }

    // Update assignment
    await assignment.update(validatedData);

    // Return the updated assignment with relations
    const updatedAssignment = await Assignment.findByPk(assignment.id, {
      include: [
        { model: User, attributes: ["name", "phone"] },
        {
          model: Emergency,
          include: [{ model: Client, attributes: ["name", "phone"] }],
        },
      ],
    });

    // Handle SMS notifications for staff reassignment
    if (validatedData.staff_id && validatedData.staff_id !== previousStaffId) {
      try {
        const newStaff = await User.findByPk(validatedData.staff_id);
        const client = updatedAssignment.Emergency.Client;
        const emergency = updatedAssignment.Emergency;

        // Notify new staff
        await notifyStaffAssignment(newStaff, emergency, client);

        // Notify client about staff change
        const staffChangeMessage = `Your emergency has been reassigned to ${newStaff.name}. They will contact you shortly. Staff Phone: ${newStaff.phone}`;
        await sendSMS(client.phone, staffChangeMessage);
      } catch (smsError) {
        console.error(
          "Failed to send staff reassignment notifications:",
          smsError
        );
      }
    }

    // Handle SMS notifications for status change to completed
    if (
      validatedData.status === "completed" &&
      previousStatus !== "completed"
    ) {
      try {
        const client = updatedAssignment.Emergency.Client;
        const completionMessage = `Your emergency assistance has been marked as completed. Thank you for using our service.`;
        await sendSMS(client.phone, completionMessage);
      } catch (smsError) {
        console.error("Failed to send completion notification:", smsError);
      }
    }

    // Emit socket events
    const io = req.app.get("io");
    if (io) {
      io.emit("assignment:updated", updatedAssignment);
      if (updatedAssignment.Emergency) {
        io.emit("emergency:updated", updatedAssignment.Emergency);
      }
      io.emit("dashboard:update");
    }

    res.json({
      success: true,
      data: updatedAssignment,
    });
  } catch (error) {
    next(error);
  }
};

// Delete an assignment
export const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [{ model: Emergency }],
    });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Reset emergency status if it's 'assigned'
    if (assignment.Emergency && assignment.Emergency.status === "assigned") {
      await assignment.Emergency.update({ status: "pending" });
    }

    await assignment.destroy();

    // Emit socket events
    const io = req.app.get("io");
    if (io) {
      io.emit("assignment:deleted", req.params.id);
      if (assignment.Emergency) {
        io.emit("emergency:updated", assignment.Emergency);
      }
      io.emit("dashboard:update");
    }

    res.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get assignments for a specific staff member
export const getStaffAssignments = async (req, res, next) => {
  try {
    const staffId = req.user ? req.user.user_id : req.params.staff_id;

    // Check if staff exists
    const staff = await User.findByPk(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Get staff assignments
    const assignments = await Assignment.findAll({
      where: { staff_id: staffId },
      include: [
        {
          model: Emergency,
          include: [
            { model: Client, attributes: ["name", "phone", "address"] },
          ],
        },
      ],
      order: [["assigned_at", "DESC"]],
    });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

// Staff updates their own assignment
export const updateStaffAssignment = async (req, res, next) => {
  try {
    // Only allow staff to update the status to completed
    if (Object.keys(req.body).length !== 1 || req.body.status !== "completed") {
      return res.status(403).json({
        success: false,
        message: "You can only update the status to completed",
      });
    }

    // Find the assignment
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [{ model: Emergency }],
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Check if assignment belongs to the staff member
    if (assignment.staff_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own assignments",
      });
    }

    // Update assignment to completed
    await assignment.update({ status: "completed" });

    // Update emergency status as well
    if (assignment.Emergency) {
      await assignment.Emergency.update({ status: "completed" });
    }

    // Return the updated assignment with relations
    const updatedAssignment = await Assignment.findByPk(assignment.id, {
      include: [
        { model: User, attributes: ["name", "phone"] },
        {
          model: Emergency,
          include: [{ model: Client, attributes: ["name", "phone"] }],
        },
      ],
    });

    // Emit socket events
    const io = req.app.get("io");
    if (io) {
      io.emit("assignment:updated", updatedAssignment);
      if (updatedAssignment.Emergency) {
        io.emit("emergency:updated", updatedAssignment.Emergency);
      }
      io.emit("dashboard:update");
    }

    res.json({
      success: true,
      data: updatedAssignment,
      message: "Assignment marked as completed successfully",
    });
  } catch (error) {
    next(error);
  }
};
