const { DataTypes } = require("sequelize");
const crypto = require("crypto");
const sequelize = require("../config/db");

const generateId = () => crypto.randomBytes(12).toString("hex");

const UserActivityLog = sequelize.define("UserActivityLog", {
  id: { type: DataTypes.STRING(24), primaryKey: true, defaultValue: generateId },
  RfidNumber: DataTypes.STRING,
  UserId: DataTypes.STRING,
  UserName: DataTypes.STRING,
  type: DataTypes.STRING, // "in" or "out"
  CardCheckInTime: DataTypes.STRING,
  CardCheckOutTime: DataTypes.STRING,
},{
  timestamps: true,
});

// UserActivityLog.sync({ alter: true, force: true });
module.exports = UserActivityLog;
