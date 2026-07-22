const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiceListing"
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index(
  { reviewer: 1, listing: 1 },
  {
    unique: true,
    partialFilterExpression: { listing: { $type: "objectId" } }
  }
);

module.exports = mongoose.model("Review", reviewSchema);
