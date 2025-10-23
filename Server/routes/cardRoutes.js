const router = require("express").Router();
const { registerCard, deactivateCard, listCards, cardStatus, activateCard } = require("../controllers/cardController");

router.get("/register", registerCard);
router.post("/deactivate", deactivateCard);
router.get("/cards", listCards);
router.get("/status", cardStatus);
router.post("/activate", activateCard);

module.exports = router;
