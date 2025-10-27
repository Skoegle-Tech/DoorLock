const { DataTypes } = require("sequelize");
const crypto = require("crypto");
const {sequelize} = require("../config/db");

const generateId = () => crypto.randomBytes(12).toString("hex");

const UserActivityLog = sequelize.define(
  "UserActivityLog",
  {
    id: { type: DataTypes.STRING(24), primaryKey: true, defaultValue: generateId },
    RfidNumber: { type: DataTypes.STRING },
    UserId: { type: DataTypes.STRING },
    UserName: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING ,enum: ["in", "out","new"] }, // "in" or "out"
    CardCheckInTime: { type: DataTypes.STRING },
    CardCheckOutTime: { type: DataTypes.STRING },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["RfidNumber"] },
      { fields: ["UserId"] },
      { fields: ["type"] },
      { fields: ["createdAt"] },
    ],
  }
);

UserActivityLog.sync({ alter: true, force: false });

module.exports = UserActivityLog;
