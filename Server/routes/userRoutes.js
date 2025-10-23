const router = require("express").Router();
const { mapUser, unmapUser ,getAllMappedUsers, SetEmergencyStatus} = require("../controllers/userController");

router.post("/map", mapUser);
router.post("/unmap", unmapUser);
router.get("/mapped-users", getAllMappedUsers);
router.get("/emergency-status", SetEmergencyStatus);


module.exports = router;
