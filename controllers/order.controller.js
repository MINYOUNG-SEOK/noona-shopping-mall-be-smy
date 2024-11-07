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

orderController.getMyOrders = async (req, res) => {
  try {
    const { userId } = req;

    const orders = await Order.find({ userId })
      .populate("items.productId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      orders,
    });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

orderController.getOrderList = async (req, res) => {
  try {
    const { page = 1, limit = 3, ordernum = "" } = req.query;
    const skip = (page - 1) * limit;

    // 검색 조건 설정
    const searchCondition = {};
    if (ordernum) {
      searchCondition.orderNum = new RegExp(ordernum, "i");
    }

    // 총 주문 수 계산
    const totalOrders = await Order.countDocuments(searchCondition);
    const totalPageNum = Math.ceil(totalOrders / limit);

    // 주문 목록 조회
    const orders = await Order.find(searchCondition)
      .populate("userId", "email")
      .populate("items.productId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      status: "success",
      orders,
      totalPageNum,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

orderController.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      throw new Error("주문을 찾을 수 없습니다.");
    }

    order.status = status;
    await order.save();

    // 업데이트된 주문 정보를 반환하기 위해 populate
    const updatedOrder = await Order.findById(id)
      .populate("userId", "email")
      .populate("items.productId");

    res.status(200).json({
      status: "success",
      order: updatedOrder,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

module.exports = orderController;
