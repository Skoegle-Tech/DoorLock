const router = require("express").Router();
const { mapUser, unmapUser ,getAllMappedUsers, SetEmergencyStatus,MakeMasterUser,RemoveMasterUser} = require("../controllers/userController");

router.post("/map", mapUser);
router.post("/unmap", unmapUser);
router.get("/mapped-users", getAllMappedUsers);
router.get("/emergency-status", SetEmergencyStatus);
router.get("/makemaster", MakeMasterUser);
router.get("/removeMaster", RemoveMasterUser);

module.exports = router;
