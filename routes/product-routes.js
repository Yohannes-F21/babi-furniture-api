const express = require("express");
const {
  addNewProduct,
  getAllProducts,
  getSingleProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/product-controller");

const router = express.Router();

router.post("/add", addNewProduct);
router.get("/get", getAllProducts);
router.get("/get/:id", getSingleProductById);
router.put("/update/:id", updateProduct);
router.delete("/delete/:id", deleteProduct);
module.exports = router;
