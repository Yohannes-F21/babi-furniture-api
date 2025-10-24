const mongoose = require("mongoose");
const Decimal = mongoose.Schema.Types.Decimal128;

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Decimal,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: "https://via.placeholder.com/150",
    },
    category: {
      enum: [
        "sofa",
        "bed",
        "dining table",
        "dressing table",
        "cabinet",
        "closet",
      ],
      required: true,
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
