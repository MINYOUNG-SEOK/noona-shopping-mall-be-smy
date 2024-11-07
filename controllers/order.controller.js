const Order = require("../models/Order.js");
const Cart = require("../models/Cart.js");
const { randomStringGenerator } = require("../utils/randomStringGenerator.js");
const productController = require("./product.controller");

const orderController = {};

orderController.createOrder = async (req, res) => {
  try {
    const { userId } = req;
    const { shipTo, contact, totalPrice, orderList } = req.body;

    // 1. 먼저 모든 상품의 재고를 확인
    const insufficientStockItems = await productController.checkItemListStock(
      orderList
    );

    // 2. 재고가 부족한 상품이 있으면 에러 발생 (재고 차감 없이 종료)
    if (insufficientStockItems.length > 0) {
      const errorMessage = insufficientStockItems.reduce(
        (total, item) => (total += item.message),
        ""
      );
      throw new Error(errorMessage);
    }

    // 3. 재고가 충분하면 주문 생성
    const newOrder = new Order({
      userId,
      totalPrice,
      shipTo,
      contact,
      items: orderList,
      orderNum: randomStringGenerator(),
    });

    // 4. 재고 차감 실행
    await productController.updateItemListStock(orderList);

    // 5. 주문 저장
    await newOrder.save();

    // 주문 후 장바구니 개수 가져오기
    const cart = await Cart.findOne({ userId });
    const remainingCartCount = cart ? cart.items.length : 0;

    res.status(200).json({
      status: "success",
      orderNum: newOrder.orderNum,
      cartItemCount: remainingCartCount,
    });
  } catch (error) {
    console.error("주문 생성 중 에러:", error);
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = orderController;
