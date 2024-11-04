const mongoose = require("mongoose");
const User = require("./User");
const Product = require("./Product");
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
    deliveryMessage: { type: String }, // 추가
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
