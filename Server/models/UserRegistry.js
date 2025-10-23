const { DataTypes } = require("sequelize");
const crypto = require("crypto");
const sequelize = require("../config/db");

const generateId = () => crypto.randomBytes(12).toString("hex");

const UserRegistry = sequelize.define("UserRegistry", {
  id: { type: DataTypes.STRING(24), primaryKey: true, defaultValue: generateId },
  UserName: { type: DataTypes.STRING, allowNull: false },
  UserId: { type: DataTypes.STRING, allowNull: false, unique: true },
  UserType: { type: DataTypes.STRING, allowNull: false, defaultValue: "employee" }, // employee | master
  RfidNumber: { type: DataTypes.STRING, allowNull: true, unique: true },
  Emergency: { type: DataTypes.BOOLEAN, defaultValue: false },
});

UserRegistry.sync({ alter: true, force: false });

module.exports = UserRegistry;
