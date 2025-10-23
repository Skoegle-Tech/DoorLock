const { DataTypes } = require("sequelize");
const crypto = require("crypto");
const sequelize = require("../config/db");

const generateId = () => crypto.randomBytes(12).toString("hex");

const UserRealtimeStatus = sequelize.define("UserRealtimeStatus", {
  id: { type: DataTypes.STRING(24), primaryKey: true, defaultValue: generateId },
  RfidNumber: DataTypes.STRING,
  UserId: DataTypes.STRING,
  UserName: DataTypes.STRING,
  type: DataTypes.STRING,
  CardCheckInTime: DataTypes.STRING,
  CardCheckOutTime: DataTypes.STRING,
});

module.exports = UserRealtimeStatus;
