const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  addNewProduct,
  getAllProducts,
  getSingleProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/product-controller");

const router = express.Router();

router.post("/add", authMiddleware, addNewProduct);
router.get("/get", getAllProducts);
router.get("/get/:id", authMiddleware, getSingleProductById);
router.put("/update/:id", authMiddleware, updateProduct);
router.delete("/delete/:id", authMiddleware, deleteProduct);
module.exports = router;
