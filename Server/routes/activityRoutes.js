const router = require("express").Router();
const { checkInOut, getRealtimeStatus, getUserActivityLog} = require("../controllers/activityController");

router.get("/check", checkInOut);
router.get("/realtime-status", getRealtimeStatus);
router.get("/activity-log", getUserActivityLog);



module.exports = router;
