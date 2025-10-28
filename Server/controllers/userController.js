const UserRegistry = require("../models/UserRegistry");
const CardRegistry = require("../models/CardRegistry");
const UserRealtimeStatus = require("../models/UserRealtimeStatus");

exports.mapUser = async (req, res) => {
  const { RfidNumber, UserId, UserName, UserType } = req.body;
  try {
    const card = await CardRegistry.findOne({ where: { RfidNumber } });
    if (!card) return res.status(404).json({ message: "Card not registered" });

    const mapped = await UserRegistry.findOne({ where: { RfidNumber } });
    if (mapped) return res.status(400).json({ message: "Card already mapped" });

    await UserRegistry.create({ RfidNumber, UserId, UserName, UserType });
    await CardRegistry.update({ RFIDMapping: true }, { where: { RfidNumber } });

    await UserRealtimeStatus.create({
      RfidNumber,
      UserId,
      UserName,
      type: "new",
    });

    res.json({ message: "User mapped successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.unmapUser = async (req, res) => {
  try {
    const { RfidNumber } = req.body;
    const user = await UserRegistry.findOne({ where: { RfidNumber } });
    if (!user) return res.status(404).json({ message: "No user found" });

    await UserRegistry.destroy({ where: { RfidNumber } });
    await CardRegistry.update({ RFIDMapping: false }, { where: { RfidNumber } });
    await UserRealtimeStatus.destroy({ where: { RfidNumber } });
    res.json({ message: "Card unmapped from user successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getAllMappedUsers = async (req, res) => {
  try {
    const { UserId } = req.query;
    const users = await UserRegistry.findOne({ where: { UserId } });
    if (!users) return res.status(404).json({ message: "No users found" });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.SetEmergencyStatus = async (req, res) => {

  try {
    const { UserId } = req.query;
    await UserRegistry.update({ Emergency: true }, { where: { UserId } });
    res.json({ message: "Emergency status set" });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


exports.MakeMasterUser= async (req, res) => {
  try {
    const { UserId } = req.query;
    await UserRegistry.update({ UserType: "master" }, { where: { UserId } });
    res.json({ message: "User promoted to master" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.RemoveMasterUser= async (req, res) => {
  try {
    const { UserId } = req.query;
    await UserRegistry.update({ UserType: "employee" }, { where: { UserId } });
    res.json({ message: "User demoted from master" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


exports.GetAllUsers = async (req, res) => {
  try {
    // Fetch both tables
    const users = await UserRegistry.findAll({ raw: true });
    const realtimeStatuses = await UserRealtimeStatus.findAll({ raw: true });

    // Merge by UserId (combine common data)
    const combined = users.map(user => {
      const status = realtimeStatuses.find(r => r.UserId === user.UserId);

      return {
        ...user,
        type: status ? status.type : null,
        CardCheckInTime: status ? status.CardCheckInTime : null,
        CardCheckOutTime: status ? status.CardCheckOutTime : null,
      };
    });

    res.json(combined);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
};
