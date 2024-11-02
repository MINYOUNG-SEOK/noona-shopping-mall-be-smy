const Cart = require("../models/Cart");
const cartController = {};

cartController.addToCart = async (req, res) => {
  try {
    const { userId } = req;
    const { productId, size, qty } = req.body;
    console.log("받은 요청 데이터:", {
      userId,
      productId,
      size,
      qty,
    });
    // 유저를 가지고 카트 찾기
    let cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      // 유저가 만든 카트가 없으면 만들어주기
      cart = new Cart({ userId });
      await cart.save();
    }
    // 이미 카트에 들어가있는 아이템인지
    const existItem = cart.items.find(
      (item) => item.productId.equals(productId) && item.size === size
    );
    // 그렇다면 에러 ('이미 아이템이 카트에 있습니다') => 개수를 하나 더 늘려주는 방법도 고려해보기
    if (existItem) {
      throw new Error("이미 장바구니에 있는 아이템입니다.");
    }
    // 카트에 아이템 추가
    cart.items = [...cart.items, { productId, size, qty }];
    await cart.save();

    res
      .status(200)
      .json({ status: "success", data: cart, cartItemQty: cart.items.length });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

cartController.getCart = async (req, res) => {
  try {
    const { userId } = req;

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "name price image description",
    });

    if (!cart) {
      return res.status(200).json({ status: "success", data: [] });
    }

    res.status(200).json({
      status: "success",
      data: cart.items,
    });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = cartController;
