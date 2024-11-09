const mongoose = require("mongoose");

const wishSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);
wishSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Wish", wishSchema);
