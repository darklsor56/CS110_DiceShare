const mongoose = require("mongoose");

const diceListingSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },

        diceType: {
            type: String,
            required: true,
            enum: ["Full Set", "D20", "D12", "D10", "D8", "D6", "D4", "Percentile", "Mixed Lot", "D100", "Misc"]
        },

        material: {
            type: String,
            required: true,
            enum: ["Plastic", "Resin", "Metal", "Quartz", "Glass", "Wood", "Gem", "Misc"]
        },

        color: {
            type: String,
            required: true,
            trim: true
        },

        condition: {
            type: String,
            required: true,
            enum: ["New", "Like New", "Used", "Worn", "Broken"]
        },

        numberOfDice: {
            type: Number,
            required: true,
            min: 1
        },

        preferredTrade: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },

        location: {
            type: String,
            required: true,
            trim: true,
        },

        imageUrl: {
            type: String,
            default: ""
        },

        tags: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            enum: ["Available", "Pending", "Traded"],
            default: "Available"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("DiceListing", diceListingSchema);