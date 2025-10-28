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
    const realtime = await UserRealtimeStatus.findOne({ where: { RfidNumber: RN } });

    // console.log("Realtime Status:", realtime?.dataValues || "No Realtime Record");

    // -------- IF CARD OR USER NOT FOUND --------
    if (!user || !card) {
      return res.status(404).json({
        message: "Card not found or not assigned",
        time: formattedTime,
        valid: false,
      });
    }

    // -------- IF CARD INACTIVE --------
    if (!card.isActive) {
      return res.status(403).json({
        message: "Card access removed",
        time: formattedTime,
        valid: false,
      });
    }

    // -------- RESTRICTIONS FOR TIME WINDOW --------
    if (user.UserType !== "master" && user.Emergency !== true) {
      if ((type === "in" || type === "out") && hour >= 10 && hour < 13) {
        return res.status(403).json({
          message: "Access restricted between 10 AM and 1 PM.",
          time: formattedTime,
          valid: false,
        });
      }

      if ((type === "in" || type === "out") && hour >= 14 && hour < 18) {
        return res.status(403).json({
          message: "Cannot check in-out between 2 PM and 6 PM.",
          time: formattedTime,
          valid: false,
        });
      }

      if (type === "out" && hour < 18 && hour < 13) {
        return res.status(403).json({
          message: "Cannot check out before 6 PM. Complete shift.",
          time: formattedTime,
          valid: false,
        });
      }
    }

    // -------- NEW RESTRICTION: Prevent double IN or OUT --------
    if (realtime && user.UserType !== "master" && user.Emergency !== true) {
      if (type === "in" && realtime.type === "in" && !realtime.CardCheckOutTime) {
        return res.status(403).json({
          message: "Already checked in. Please check out first.",
          time: formattedTime,
          valid: false,
        });
      }

      if (type === "out" && (!realtime.type || realtime.type !== "in" || !realtime.CardCheckInTime)) {
        return res.status(403).json({
          message: "Cannot check out without checking in first.",
          time: formattedTime,
          valid: false,
        });
      }
    }

    // -------- EMERGENCY ACCESS --------
    let responseMessage = "";
    let normalMode = true;

    if (user.Emergency === true) {
      responseMessage = `${user.UserName.split(" ")[0]} used emergency access.`;
      normalMode = false;
      await UserRegistry.update({ Emergency: false }, { where: { RfidNumber: RN } });
    }

    // -------- DATABASE UPDATES --------
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
        CardCheckInTime: type === "in" ? formattedTime : realtime.CardCheckInTime,
        CardCheckOutTime: type === "out" ? formattedTime : null,
      },
      { where: { RfidNumber: RN } }
    );

    // -------- RESPONSE --------
    const firstName = user.UserName.split(" ")[0];
    if (normalMode) {
      return res.json({
        message: firstName,
        time: formattedTime,
        valid: true,
      });
    } else {
      return res.json({
        message: responseMessage,
        time: formattedTime,
        valid: true,
      });
    }
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