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
// const getAllProducts = async (req, res) => {
//   try {
//     const { category } = req.body;

//     // Match stage (filters by category if provided)
//     const matchStage =
//       category && category.trim() !== "" ? { category: category.trim() } : {};

//     // Aggregation pipeline
//     const allProducts = await Product.aggregate([
//       {
//         $match: matchStage,
//       },
//       {
//         $sort: { createdAt: -1 },
//       },
//       {
//         // Lookup user info from the users collection
//         $lookup: {
//           from: "users", // name of your User collection in MongoDB
//           localField: "createdBy", // field in Product schema
//           foreignField: "_id", // field in User schema
//           as: "createdBy", // replace with populated user info
//         },
//       },
//       {
//         // Only take name and email from the joined user array
//         $addFields: {
//           createdBy: {
//             $cond: {
//               if: { $gt: [{ $size: "$createdBy" }, 0] },
//               then: {
//                 // _id: { $arrayElemAt: ["$createdBy._id", 0] },
//                 name: { $arrayElemAt: ["$createdBy.userName", 0] },
//                 email: { $arrayElemAt: ["$createdBy.email", 0] },
//               },
//               else: null,
//             },
//           },
//         },
//       },
//     ]);

//     if (allProducts.length > 0) {
//       res.status(200).json({
//         success: true,
//         message: "Products fetched successfully",
//         total: allProducts.length,
//         data: allProducts,
//       });
//     } else {
//       res.status(404).json({
//         success: false,
//         message: "No products found",
//       });
//     }
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     res.status(500).json({
//       success: false,
//       message: "Something went wrong! Please try again.",
//     });
//   }
// }; // this is the professional way to do it

// controllers/productController.js (or wherever you have it)

// controllers/productController.js
const getAllProducts = async (req, res) => {
  try {
    // NO FILTERING — get ALL products
    const allProducts = await Product.aggregate([
      // 1. Sort newest first
      { $sort: { createdAt: -1 } },
      { $addFields: { price: { $toString: "$price" } } },

      // 2. Lookup creator info (you said you have createdBy: userId)
      {
        $lookup: {
          from: "users", // MongoDB collection name (lowercase + s)
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },

      // 3. Clean up the createdBy field → only name & email
      {
        $addFields: {
          createdBy: {
            $cond: {
              if: { $gt: [{ $size: "$createdBy" }, 0] },
              then: {
                userName: { $arrayElemAt: ["$createdBy.userName", 0] },
                email: { $arrayElemAt: ["$createdBy.email", 0] },
              },
              else: null,
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      total: allProducts.length,
      data: allProducts,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again.",
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
