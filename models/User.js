const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        passwordHash: {
            type: String,
            required: true
        },

        profileImageUrl: {
            type: String,
            default: ""
        },

        bio: {
            type: String,
            default: "",
            maxlength: 500
        },

        location: {
            type: String,
            default: ""
        },

        completedTradeCount: {
            type: Number,
            default: 0
        },

        averageRating: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);