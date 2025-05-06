import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

// Models
import User from "./users.model.js";
import Client from "./clients.model.js";
import Emergency from "./emergencies.model.js";
import Assignment from "./assignments.model.js";

// Define associations
Client.hasMany(Emergency, { foreignKey: "client_id" });
Emergency.belongsTo(Client, { foreignKey: "client_id" });

User.hasMany(Assignment, { foreignKey: "staff_id" });
Assignment.belongsTo(User, { foreignKey: "staff_id" });

Emergency.hasMany(Assignment, { foreignKey: "emergency_id" });
Assignment.belongsTo(Emergency, { foreignKey: "emergency_id" });

export { User, Client, Emergency, Assignment, sequelize };
