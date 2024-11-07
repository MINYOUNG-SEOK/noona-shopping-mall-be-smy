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

// 아이템 리스트의 재고 확인
productController.checkItemListStock = async (itemList) => {
  const insufficientStockItems = [];
  
  // 상품 ID별로 아이템을 그룹화
  const groupedItems = itemList.reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = [];
    }
    acc[item.productId].push(item);
    return acc;
  }, {});

  // 각 상품별로 재고 확인
  for (const [productId, items] of Object.entries(groupedItems)) {
    const product = await Product.findById(productId);
    if (!product) {
      items.forEach(item => {
        insufficientStockItems.push({
          item,
          message: `상품을 찾을 수 없습니다.`
        });
      });
      continue;
    }

    items.forEach(item => {
      if (product.stock[item.size] < item.qty) {
        insufficientStockItems.push({
          item,
          message: `${product.name}의 ${item.size} 재고가 부족합니다.`
        });
      }
    });
  }

  return insufficientStockItems;
};

// 아이템 리스트의 재고 차감
productController.updateItemListStock = async (itemList) => {
  // 상품 ID별로 아이템을 그룹화
  const groupedItems = itemList.reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = [];
    }
    acc[item.productId].push(item);
    return acc;
  }, {});

  // 각 상품별로 한 번에 재고 업데이트
  for (const [productId, items] of Object.entries(groupedItems)) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`상품 ID ${productId}를 찾을 수 없습니다.`);
    }

    const newStock = { ...product.stock };
    
    // 동일 상품의 모든 사이즈 재고를 한 번에 계산
    items.forEach(item => {
      if (typeof newStock[item.size] !== 'number') {
        throw new Error(`상품 ID ${productId}의 ${item.size} 사이즈가 존재하지 않습니다.`);
      }
      newStock[item.size] -= item.qty;
      if (newStock[item.size] < 0) {
        throw new Error(`${product.name}의 ${item.size} 재고가 부족합니다.`);
      }
    });

    // 재고 업데이트 및 상품 상태 체크
    product.stock = newStock;
    
    // 모든 사이즈의 재고가 0인 경우 상태를 'sold-out'으로 변경
    const hasSomeStock = Object.values(newStock).some(qty => qty > 0);
    if (!hasSomeStock) {
      product.status = 'sold-out';
    }

    await product.save();
  }
};

module.exports = productController;
