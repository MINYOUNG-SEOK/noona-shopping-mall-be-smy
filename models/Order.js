const mongoose = require("mongoose");
const User = require("./User");
const Product = require("./Product");
const Cart = require("./Cart");
const Schema = mongoose.Schema;

const orderSchema = Schema(
  {
    userId: { type: mongoose.ObjectId, ref: "User", required: true },
    shipTo: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    contact: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: false },
    },
    totalPrice: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      default: "preparing",
      enum: ["preparing", "shipping", "delivered", "cancelled"],
    },
    items: [
      {
        productId: { type: mongoose.ObjectId, ref: "Product", required: true },
        price: {
          type: Number,
          required: true,
          min: [0, "가격은 0보다 커야 합니다."],
        },
        qty: {
          type: Number,
          required: true,
          default: 1,
          min: [1, "수량은 1개 이상이어야 합니다."],
        },
        size: {
          type: String,
          required: true,
        },
      },
    ],
    deliveryMessage: { type: String },
  },
  { timestamps: true }
);

orderSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.__v;
  delete obj.updatedAt;
  return obj;
};

orderSchema.post("save", async function () {
  // 카트를 비워주자
  const cart = await Cart.findOne({ userId: this.userId });
  if (!cart) return;

  // 주문한 상품의 productId와 size 목록 생성
  const orderedItems = this.items.map((item) => ({
    productId: item.productId.toString(),
    size: item.size,
  }));

  // 장바구니에서 주문한 상품만 제거
  cart.items = cart.items.filter((cartItem) => {
    return !orderedItems.some(
      (orderedItems) =>
        orderedItems.productId === cartItem.productId.toString() &&
        orderedItems.size === cartItem.size
    );
  });
  await cart.save();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
