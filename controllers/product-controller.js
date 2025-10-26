const Product = require("../models/product-model");
const upload = require("../middleware/multer-config");
const cloudinary = require("../utils/cloudinary");

const addNewProduct = async (req, res) => {
  const { username, userId, role } = req.userInfo;

  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 4 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: "Error uploading files",
        error: err,
      });
    }

    try {
      const thumbnailUrl =
        req.files?.thumbnail?.[0]?.path ||
        req.files?.thumbnail?.[0]?.url ||
        "https://placehold.co/600x400?text=Cover+Image";

      const thumbnailPublicId = req.files?.thumbnail?.[0]
        ? req.files.thumbnail[0].filename
        : null;

      const imagesUrl = req.files?.images
        ? req.files.images.map((file) => file.path || file.url)
        : [];

      const imagePublicIds = req.files?.images
        ? req.files.images.map((file) => file.filename)
        : [];

      const newProductFormData = {
        ...req.body,
        thumbnailUrl,
        imagesUrl,
        thumbnailPublicId,
        imagePublicIds,
        createdBy: userId,
      };

      const newlyCreatedProduct = await Product.create(newProductFormData);

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
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Something went wrong! Please try again",
      });
    }
  });
};
const getAllProducts = async (req, res) => {
  try {
    /*
      const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 8; // Default to 8 products per page
    const skip = (page - 1) * limit; // Calculate the number of documents to skip when paginating

    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    const sortObj = {};
    sortObj[sortBy] = sortOrder;
    const allProducts = await Product.find()
      .sort(sortObj)
      .skip(skip)
      .limit(limit);
    // const allProducts = await Product.find({});
    if (allProducts?.length > 0) {
      res.status(200).json({
        success: true,
        message: "List of products fetched successfully",
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts,
        data: allProducts,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Bo products found in collection",
      });
    } // for future pagination purpose
    */
    const allProducts = await Product.find({}).populate(
      "createdBy",
      "userName email"
    ); // populate createdBy field with userName and email from User model
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
    const product = await Product.findById(getCurrentProductID);

    //delete the thumbnail and the images first from your cloudinary storage
    await cloudinary.uploader.destroy(product.thumbnailPublicId);
    for (const publicId of product.imagePublicIds) {
      await cloudinary.uploader.destroy(publicId);
    }
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
