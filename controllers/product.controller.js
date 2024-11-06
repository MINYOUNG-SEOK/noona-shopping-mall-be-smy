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
    const cond = { isDeleted: false };
    if (name) cond.name = { $regex: name, $options: "i" };

    let query = Product.find(cond).sort({ createdAt: -1 });
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

productController.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      sku,
      name,
      size,
      image,
      price,
      description,
      category,
      stock,
      status,
    } = req.body;

    const product = await Product.findByIdAndUpdate(
      { _id: productId },
      { sku, name, size, image, price, description, category, stock, status },
      { new: true }
    );

    if (!product) throw new Error("Item doesn't exist");
    res.status(200).json({ status: "success", data: product });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.softDeleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdAndUpdate(
      productId,
      { isDeleted: true },
      { new: true }
    );
    if (!product) throw new Error("Product not found");

    res
      .status(200)
      .json({ status: "success", message: "Product deleted successful" });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.getProductDetail = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findOne({ _id: productId, isDeleted: false });

    if (!product) {
      return res
        .status(404)
        .json({ status: "fail", message: "Product not found" });
    }

    res.status(200).json({ status: "success", data: product });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

// 재고 확인만 하는 함수
productController.verifyStock = async (item) => {
  const product = await Product.findById(item.productId);
  if (product.stock[item.size] < item.qty) {
    return {
      isVerify: false,
      message: `${product.name}의 ${item.size} 재고가 부족합니다.`,
    };
  }
  return { isVerify: true };
};

// 재고 차감만 하는 함수
productController.updateStock = async (item) => {
  const product = await Product.findById(item.productId);
  const newStock = { ...product.stock };
  newStock[item.size] -= item.qty;
  product.stock = newStock;
  await product.save();
};

// 아이템 리스트의 재고 확인
productController.checkItemListStock = async (itemList) => {
  const insufficientStockItems = [];
  
  // 모든 아이템의 재고를 먼저 확인
  await Promise.all(
    itemList.map(async (item) => {
      const stockCheck = await productController.verifyStock(item);
      if (!stockCheck.isVerify) {
        insufficientStockItems.push({ item, message: stockCheck.message });
      }
      return stockCheck;
    })
  );

  return insufficientStockItems;
};

// 아이템 리스트의 재고 차감
productController.updateItemListStock = async (itemList) => {
  // 모든 아이템의 재고를 차감
  await Promise.all(
    itemList.map(async (item) => {
      await productController.updateStock(item);
    })
  );
};

module.exports = productController;
