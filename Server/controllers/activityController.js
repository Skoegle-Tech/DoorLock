const moment = require("moment-timezone");
const UserRegistry = require("../models/UserRegistry");
const UserActivityLog = require("../models/UserActivityLog");
const UserRealtimeStatus = require("../models/UserRealtimeStatus");
const CardRegistry = require("../models/CardRegistry");
const { time } = require("console");

exports.checkInOut = async (req, res) => {
  const { RN, type } = req.query;

  try {
    const indianTime = moment().tz("Asia/Kolkata");
    const formattedTime = indianTime.format("YYYY-MM-DD HH:mm:ss");
    const hour = indianTime.hour();

    const user = await UserRegistry.findOne({ where: { RfidNumber: RN } });
    const card = await CardRegistry.findOne({ where: { RfidNumber: RN } });

    if (!user || !card)
      return res.status(404).json({ message: "Card Not Found", time: formattedTime });

    if (!card.isActive)
      return res.status(403).json({ message: "Card access removed", time: formattedTime });

    let responseMessage = "";

    // ---------------- RESTRICTIONS ----------------
    if (user.UserType !== "master" && user.Emergency !== true) {
      // STRICT restriction from 10 AM to 1 PM for both check-in/out
      if ((type === "in" || type === "out") && hour >= 10 && hour < 13)
        return res.status(403).json({
          message: "Access restricted between 10 AM and 1 PM.",
            time: formattedTime,
        });

      // Allow lunch check-in/out between 1–2 PM
      if ((type === "out" || type === "in") && hour >= 13 && hour < 14)
        responseMessage = "Lunchtime check-in-out allowed";

      // Restrict check-in/out between 2 PM and 6 PM
      if ((type === "in" || type === "out") && hour >= 14 && hour < 18)
        return res.status(403).json({
          message: "Cannot check in-out between 2 PM and 6 PM.",
            time: formattedTime,
        });

      // Restrict early checkout before 6 PM (except lunch)
      if (type === "out" && hour < 18 && hour < 13)
        return res.status(403).json({
          message: "Cannot check out before 6 PM. Complete shift.",
            time: formattedTime,
        });
    }

    // ---------------- EMERGENCY HANDLING ----------------
    if (user.Emergency === true) {
      responseMessage = `${user.UserName}, using emergency access. ${
        type === "in" ? "Check-In successful" : "Check-Out successful"
      }`;
      await UserRegistry.update({ Emergency: false }, { where: { RfidNumber: RN } });
    }

    // ---------------- FRIENDLY MESSAGES ----------------
    if (!responseMessage) {
      if (type === "in") {
        if (hour >= 6 && hour < 10)
          responseMessage = `Good morning, ${user.UserName}! Welcome`;
        else if (hour >= 12 && hour < 14)
          responseMessage = `Welcome back, ${user.UserName}! Lunch`;
        else if (hour >= 18 && hour < 22)
          responseMessage = `Evening check-in, ${user.UserName}`;
        else
          responseMessage = `Check-In, ${user.UserName}`;
      } else if (type === "out") {
        if (hour >= 18 && hour < 20)
          responseMessage = `Thank you, ${user.UserName}! Goodbye`;
        else if (hour >= 13 && hour < 14)
          responseMessage = `${user.UserName}, heading out for lunch?`;
        else
          responseMessage = `${user.UserName} checked out successfully`;
      }
    }

    // ---------------- NEXT CHECK SUGGESTION ----------------
    if (type === "in") {
      responseMessage += " Next checkout at 6 PM";
    } else if (type === "out" && hour >= 13 && hour < 14) {
      responseMessage += " Next checkout after lunch";
    }

    // Truncate to 40 characters
    if (responseMessage.length > 40) {
      responseMessage = responseMessage.slice(0, 37) + "...";
    }

    // ---------------- DATABASE UPDATES ----------------
    await UserActivityLog.create({
      RfidNumber: RN,
      UserId: user.UserId,
      UserName: user.UserName,
      type,
      CardCheckInTime: type === "in" ? formattedTime : null,
      CardCheckOutTime: type === "out" ? formattedTime : null,
    });

    await UserRealtimeStatus.update(
      {
        type,
        CardCheckInTime: type === "in" ? formattedTime : null,
        CardCheckOutTime: type === "out" ? formattedTime : null,
      },
      { where: { RfidNumber: RN } }
    );

    res.json({
      message: responseMessage,
      time: formattedTime,
      valid: true,
    });
  } catch (e) {
    console.error("Error in checkInOut:", e);
    res.status(500).json({ error: e.message });
  }
};



exports.getRealtimeStatus = async (req, res) => {
  try {
    const { UserId } = req.query;
    const status = await UserRealtimeStatus.findOne({ where: { UserId } });
    if (!status) return res.status(404).json({ message: "No status found" });
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getUserActivityLog = async (req, res) => {
  try {
    const { UserId } = req.query;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    if (!UserId) {
      return res.status(400).json({ message: "UserId is required" });
    }

    const offset = (page - 1) * limit;

    const logs = await UserActivityLog.findAll({
      where: { UserId },
      order: [["createdAt", "DESC"]], // sort by createdAt latest first
      limit,
      offset,
      attributes: ["id", "RfidNumber", "UserId", "UserName", "type", "CardCheckInTime", "CardCheckOutTime", "createdAt"]
    });

    if (!logs.length) {
      return res.status(404).json({ message: "No activity logs found" });
    }

    const totalLogs = await UserActivityLog.count({ where: { UserId } });

    res.json({
      page,
      limit,
      totalLogs,
      totalPages: Math.ceil(totalLogs / limit),
      logs,
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error.message);
    res.status(500).json({ error: error.message });
  }
};