const mongoose = require("mongoose");

const tradeRequestSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiceListing",
      required: true
    },

    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    offeredListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiceListing"
    },

    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Declined", "Canceled", "Completed"],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("TradeRequest", tradeRequestSchema);
