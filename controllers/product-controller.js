const Product = require("../models/product-model");

const addNewProduct = async (req, res) => {
  const { username, userId, role } = req.userInfo;

  try {
    const newProductFormData = req.body;
    const newlyCreatedProduct = await Product.create(newProductFormData);
    if (newProductFormData) {
      res.status(201).json({
        success: true,
        message: "Product added successfully",
        data: newlyCreatedProduct,
        user: {
          _id: userId,
          username,
          role,
        },
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};
const getAllProducts = async (req, res) => {
  try {
    const allProducts = await Product.find({});
    if (allProducts?.length > 0) {
      res.status(200).json({
        success: true,
        message: "List of products fetched successfully",
        data: allProducts,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Bo products found in collection",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};
const getSingleProductById = async (req, res) => {
  try {
    const currentProduct = await Product.findById(req.params.id);

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message:
          "Product with the current ID is not found! Please try with a different ID",
      });
    }

    res.status(200).json({
      success: true,
      data: currentProduct,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const updatedProductFormData = req.body;
    const getCurrentProductID = req.params.id;
    const updatedProduct = await Product.findByIdAndUpdate(
      getCurrentProductID,
      updatedProductFormData,
      {
        new: true,
      }
    );

    if (!updatedProduct) {
      res.status(404).json({
        success: false,
        message: "Product is not found with this ID",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const getCurrentProductID = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(getCurrentProductID);

    if (!deletedProduct) {
      res.status(404).json({
        success: false,
        message: "Product is not found with this ID",
      });
    }

    res.status(200).json({
      success: true,
      data: deletedProduct,
      message: "Product deleted successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};

module.exports = {
  getAllProducts,
  getSingleProductById,
  addNewProduct,
  updateProduct,
  deleteProduct,
};
