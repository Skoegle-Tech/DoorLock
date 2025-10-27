const { DataTypes } = require("sequelize");
const crypto = require("crypto");
const {sequelize} = require("../config/db");

const generateId = () => crypto.randomBytes(12).toString("hex");

const CardRegistry = sequelize.define(
  "CardRegistry",
  {
    id: { type: DataTypes.STRING(24), primaryKey: true, defaultValue: generateId },
    RfidNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    RFIDMapping: { type: DataTypes.BOOLEAN, defaultValue: false },
    RFIDSystemCode: { type: DataTypes.STRING, allowNull: false, unique: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    indexes: [
      { fields: ["RfidNumber"] },
      { fields: ["RFIDSystemCode"] },
      { fields: ["isActive"] },
    ],
  }
);

CardRegistry.sync({ alter: true, force: false });

module.exports = CardRegistry;
