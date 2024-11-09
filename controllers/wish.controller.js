const Wish = require("../models/Wish");
const Product = require("../models/Product");

const wishController = {};

// 위시리스트 가져오기
wishController.getWishList = async (req, res) => {
  try {
    const wishes = await Wish.find({ userId: req.userId }).populate({
      path: "productId",
      select: "-isDeleted",
      match: { isDeleted: false },
    });

    const products = wishes
      .filter((wish) => wish.productId)
      .map((wish) => wish.productId);

    res.status(200).json({
      status: "success",
      data: products,
    });
  } catch (error) {
    console.error("getWishList 에러:", error);
    res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

// 위시리스트 토글 (추가/제거)
wishController.toggleWish = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId;

    // 상품이 존재하는지 먼저 확인
    const product = await Product.findById(productId);

    if (!product || product.isDeleted) {
      throw new Error("Product not found");
    }

    // 이미 위시리스트에 있는지 확인
    const existingWish = await Wish.findOne({ userId, productId });

    if (existingWish) {
      // 있으면 제거
      await Wish.findByIdAndDelete(existingWish._id);

      // 업데이트된 위시리스트 반환
      const updatedWishes = await Wish.find({ userId }).populate({
        path: "productId",
        select: "-isDeleted",
        match: { isDeleted: false },
      });

      const updatedProducts = updatedWishes
        .filter((wish) => wish.productId)
        .map((wish) => wish.productId);

      res.status(200).json({
        status: "success",
        isWished: false,
        productId,
        data: updatedProducts,
      });
    } else {
      // 없으면 추가
      const newWish = await Wish.create({ userId, productId });

      // 업데이트된 위시리스트 반환
      const updatedWishes = await Wish.find({ userId }).populate({
        path: "productId",
        select: "-isDeleted",
        match: { isDeleted: false },
      });

      const updatedProducts = updatedWishes
        .filter((wish) => wish.productId)
        .map((wish) => wish.productId);

      res.status(200).json({
        status: "success",
        isWished: true,
        productId,
        data: updatedProducts,
      });
    }
  } catch (error) {
    console.error("toggleWish 에러:", error);
    res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

// 위시리스트 상태 확인
wishController.checkWishStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId;

    const wish = await Wish.findOne({ userId, productId });

    res.status(200).json({
      status: "success",
      isWished: !!wish,
    });
  } catch (error) {
    console.error("checkWishStatus 에러:", error);
    res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

module.exports = wishController;
