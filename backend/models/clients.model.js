import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";
import bcrypt from "bcrypt";

const Client = sequelize.define(
  "Client",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "clients",
    timestamps: false,
    hooks: {
      beforeCreate: async (client) => {
        if (client.password) {
          client.password = await bcrypt.hash(client.password, 10);
        }
      },
      beforeUpdate: async (client) => {
        if (client.changed("password")) {
          client.password = await bcrypt.hash(client.password, 10);
        }
      },
    },
  }
);

// Instance method to check password
Client.prototype.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default Client;
