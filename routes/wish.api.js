const express = require("express");
const router = express.Router();
const wishController = require("../controllers/wish.controller");
const { authenticate } = require("../controllers/auth.controller");

router.use(authenticate);
router.get("/", wishController.getWishList);
router.post("/:productId", wishController.toggleWish);
router.get("/:productId/status", wishController.checkWishStatus);

module.exports = router;
