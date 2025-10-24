const CardRegistry = require("../models/CardRegistry");
const UserRegistry = require("../models/UserRegistry");

exports.registerCard = async (req, res) => {
  try {
    const { RN } = req.query;
    if (!RN || RN.length !== 8)
      return res.status(400).json({ message: "RfidNumber must be 8 chars" });

    const exists = await CardRegistry.findOne({ where: { RfidNumber: RN } });
    if (exists) return res.status(400).json({ message: "Card already exists" });

    await CardRegistry.create({
      RfidNumber: RN,
      RFIDSystemCode: "SYS" + RN,
    });

    res.json({ message: "Card registered successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deactivateCard = async (req, res) => {
  try {
    const { RfidNumber } = req.body;
    await CardRegistry.update({ isActive: false }, { where: { RfidNumber } });
    res.json({ message: "Card access temporarily removed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.activateCard= async (req, res) => {
  try {
    const { RfidNumber } = req.body;
    await CardRegistry.update({ isActive: true }, { where: { RfidNumber } });
    res.json({ message: "Card access restored" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.cardStatus = async (req, res) => {
  try {
    const { RfidNumber } = req.query;
    const card = await CardRegistry.findOne({ where: { RfidNumber } });
    const user = await UserRegistry.findOne({ where: { RfidNumber } });
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json({ isActive: card.isActive, userType: user ? user.UserType : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.listCards = async (req, res) => {
  try {
    const cards = await CardRegistry.findAll({
      where: { RFIDMapping: false }
    });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
