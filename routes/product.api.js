const express = require("express");
const authController = require("../controllers/auth.controller");
const productController = require("../controllers/product.controller");
const router = express.Router();

// 상품 생성
router.post(
  "/",
  authController.authenticate,
  authController.checkAdminPermission,
  productController.createProduct
);

// 상품 목록 조회
router.get("/", productController.getProduct);

// 상품 수정
router.put(
  "/:id",
  authController.authenticate,
  authController.checkAdminPermission,
  productController.updateProduct
);

// 상품 삭제
router.patch(
  "/:id/delete",
  authController.authenticate,
  authController.checkAdminPermission,
  productController.softDeleteProduct
);

module.exports = router;
