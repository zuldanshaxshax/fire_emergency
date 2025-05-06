import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

const Assignment = sequelize.define(
  "Assignment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    emergency_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "emergencies",
        key: "id",
      },
    },
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("assigned", "completed"),
      defaultValue: "assigned",
    },
  },
  {
    tableName: "assignments",
    timestamps: false,
  }
);

export default Assignment;
