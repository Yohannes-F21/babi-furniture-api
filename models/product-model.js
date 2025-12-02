const mongoose = require("mongoose");
const Decimal = mongoose.Schema.Types.Decimal128;

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    imagesUrl: {
      type: [String], // Array of image URLs
      default: [],
    },
    thumbnailPublicId: {
      type: String,
      required: true,
    },
    imagePublicIds: {
      type: [String], // Array of image URLs
      default: [],
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
    isFeatured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
