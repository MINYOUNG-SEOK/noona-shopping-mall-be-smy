const Product = require("../models/Product");

const productController = {};

productController.createProduct = async (req, res) => {
  try {
    const {
      sku,
      name,
      size,
      image,
      category,
      description,
      price,
      stock,
      status,
    } = req.body;
    const product = new Product({
      sku,
      name,
      size,
      image,
      category,
      description,
      price,
      stock,
      status,
    });

    await product.save();
    res.status(200).json({ status: "success", product });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.getProduct = async (req, res) => {
  try {
    const { name } = req.query;

    const cond = name ? { name: { $regex: name, $options: "i" } } : {};

    const productList = await Product.find(cond);

    res.status(200).json({
      status: "success",
      data: productList,
      totalPageNum: 1, 
    });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = productController;
