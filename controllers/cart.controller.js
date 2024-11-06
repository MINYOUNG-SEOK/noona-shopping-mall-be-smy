const Cart = require("../models/Cart");
const Product = require("../models/Product");
const cartController = {};

// 장바구니 추가
cartController.addToCart = async (req, res) => {
  try {
    const { userId } = req;
    const { productId, size, qty } = req.body;

    // 재고 확인
    const product = await Product.findById(productId);
    const availableStock = product.stock[size];

    if (qty > availableStock) {
      throw new Error(
        `${product.name}(${size})은 ${availableStock}개까지 주문이 가능합니다.`
      );
    }

    let cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      cart = new Cart({ userId });
      await cart.save();
    }

    const existItem = cart.items.find(
      (item) => item.productId.equals(productId) && item.size === size
    );

    if (existItem) {
      throw new Error("이미 장바구니에 있는 아이템입니다.");
    }

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

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new Error("장바구니를 찾을 수 없습니다.");
    }

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

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new Error("장바구니를 찾을 수 없습니다.");
    }

    const cartItem = cart.items.find((item) => item._id.equals(itemId));
    if (!cartItem) {
      throw new Error("상품을 찾을 수 없습니다.");
    }

    // 재고 확인
    const product = await Product.findById(cartItem.productId);
    const availableStock = product.stock[cartItem.size];

    if (qty > availableStock) {
      throw new Error(
        `${product.name}(${cartItem.size})은 ${availableStock}개까지 주문이 가능합니다.`
      );
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

// 장바구니 아이템들의 재고 확인
cartController.validateCartItems = async (req, res) => {
  try {
    const { userId } = req;

    // 장바구니 찾기와 상품 정보 가져오기
    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "name stock",
    });

    if (!cart) {
      return res.status(200).json({ status: "success", isValid: true });
    }

    // 재고 부족한 아이템 찾기
    const invalidItems = [];

    for (const item of cart.items) {
      const product = item.productId;
      const availableStock = product.stock[item.size];

      if (availableStock < item.qty) {
        invalidItems.push({
          name: product.name,
          size: item.size,
          requestedQty: item.qty,
          availableStock: availableStock,
        });
      }
    }

    if (invalidItems.length > 0) {
      // 재고 부족 메시지 생성
      const errorMessage = invalidItems
        .map(
          (item) =>
            `${item.name}(${item.size})은 ${item.availableStock}개까지 주문이 가능합니다.`
        )
        .join("\n");

      return res.status(400).json({
        status: "fail",
        error: errorMessage,
        invalidItems,
      });
    }

    res.status(200).json({ status: "success", isValid: true });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = cartController;
