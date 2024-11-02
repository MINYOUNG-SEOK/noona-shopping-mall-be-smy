const Cart = require("../models/Cart");
const cartController = {};

// 장바구니 추가
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

// 장바구니 리스트 가져오기
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

// 장바구니 아이템 삭제
cartController.deleteCartItem = async (req, res) => {
  try {
    const { userId } = req;
    const itemId = req.params.id;

    // 해당 유저의 카트 찾기
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new Error("장바구니를 찾을 수 없습니다.");
    }

    // items 배열에서 해당 아이템 제거
    cart.items = cart.items.filter((item) => !item._id.equals(itemId));
    await cart.save();

    res.status(200).json({
      status: "success",
      message: "상품이 삭제되었습니다.",
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

// 장바구니 수량 업데이트
cartController.updateQty = async (req, res) => {
  try {
    const { userId } = req;
    const itemId = req.params.id;
    const { qty } = req.body;

    if (qty < 1) {
      throw new Error("수량은 1개 이상이어야 합니다.");
    }

    // 해당 유저의 카트 찾기
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new Error("장바구니를 찾을 수 없습니다.");
    }

    // 해당 아이템 찾아서 수량 업데이트
    const cartItem = cart.items.find((item) => item._id.equals(itemId));
    if (!cartItem) {
      throw new Error("상품을 찾을 수 없습니다.");
    }

    cartItem.qty = qty;
    await cart.save();

    res.status(200).json({
      status: "success",
      data: cart,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

module.exports = cartController;
