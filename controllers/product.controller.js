const Product = require("../models/Product");

const PAGE_SIZE = 5;
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
    const { page, name } = req.query;
    const cond = name ? { name: { $regex: name, $options: "i" } } : {};

    let query = Product.find(cond);
    const totalItemNum = await Product.find(cond).countDocuments();

    if (page) {
      query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);
      const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);

      const productList = await query.exec();
      res.status(200).json({
        data: productList,
        totalPageNum,
        totalItemNum,
      });
    } else {
      const productList = await query.exec();
      res.status(200).json({
        data: productList,
        totalItemNum,
      });
    }
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = productController;
