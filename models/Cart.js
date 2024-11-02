const mongoose = require("mongoose");
const User = require("./User");
const Product = require("./Product");
const Schema = mongoose.Schema;
const cartSchema = Schema(
  {
    userId: { type: mongoose.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: mongoose.ObjectId, ref: "Product", required: true },
        size: {
          type: String,
          required: true,
        },
        qty: {
          type: Number,
          default: 1,
          required: true,
          min: [1, "수량은 1개 이상이어야 합니다."],
        },
      },
    ],
  },
  { timestamps: true }
);

cartSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.updatedAt;
  return obj;
};

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
