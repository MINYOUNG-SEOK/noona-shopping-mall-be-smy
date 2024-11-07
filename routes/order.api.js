const express = require("express");
const authController = require("../controllers/auth.controller");
const orderController = require("../controllers/order.controller");
const router = express.Router();

router.post("/", authController.authenticate, orderController.createOrder);
router.get(
  "/my-orders",
  authController.authenticate,
  orderController.getMyOrders
);
router.get(
  "/admin/orders",
  authController.authenticate,
  authController.checkAdminPermission,
  orderController.getOrderList
);

router.put(
  "/admin/orders/:id",
  authController.authenticate,
  authController.checkAdminPermission,
  orderController.updateOrderStatus
);

module.exports = router;
