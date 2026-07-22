require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const connectDB = require("../config/db");
const User = require("../models/User");
const DiceListing = require("../models/DiceListings");

async function seedDatabase() {
  try {
    await connectDB();

    console.log("Clearing old demo data...");

    // Only remove demo accounts/listings, not every user in the database
    const demoEmails = [
      "mira@example.com",
      "garrick@example.com",
      "selene@example.com",
      "test@example.com"
    ];

    const demoUsers = await User.find({ email: { $in: demoEmails } });
    const demoUserIds = demoUsers.map(user => user._id);

    await DiceListing.deleteMany({ owner: { $in: demoUserIds } });
    await User.deleteMany({ email: { $in: demoEmails } });

    console.log("Creating demo users...");

    const passwordHash = await bcrypt.hash("password123", 10);

    const users = await User.insertMany([
      {
        username: "MiraMoon",
        email: "mira@example.com",
        passwordHash,
        location: "Redlands, CA",
        bio: "D&D player who likes sparkly resin dice and moon-themed sets.",
        profileImageUrl: "",
        completedTradeCount: 3,
        averageRating: 4.7
      },
      {
        username: "GarrickTheDM",
        email: "garrick@example.com",
        passwordHash,
        location: "Riverside, CA",
        bio: "Forever DM. I collect metal dice and oversized D20s.",
        profileImageUrl: "",
        completedTradeCount: 8,
        averageRating: 4.9
      },
      {
        username: "SeleneCrits",
        email: "selene@example.com",
        passwordHash,
        location: "San Bernardino, CA",
        bio: "Pathfinder player looking for readable dice and unusual colors.",
        profileImageUrl: "",
        completedTradeCount: 1,
        averageRating: 4.2
      },
      {
        username: "TestUser",
        email: "test@example.com",
        passwordHash,
        location: "Redlands, CA",
        bio: "General testing account.",
        profileImageUrl: "",
        completedTradeCount: 0,
        averageRating: 0
      }
    ]);

    const [mira, garrick, selene, testUser] = users;

    console.log("Creating demo listings...");

    await DiceListing.insertMany([
      {
        owner: mira._id,
        title: "Blue Resin 7-Piece Set",
        description: "A blue resin full dice set with white numbers. Lightly used for a short campaign.",
        diceType: "Full Set",
        material: "Resin",
        color: "Blue",
        condition: "Like New",
        numberOfDice: 7,
        preferredTrade: "Looking for purple or moon-themed dice.",
        location: "Redlands, CA",
        imageUrl: "",
        tags: ["blue", "resin", "full set", "dnd", "white numbers"],
        status: "Available"
      },
      {
        owner: mira._id,
        title: "Purple Glitter D20",
        description: "Single purple glitter D20. Rolls well and is easy to read.",
        diceType: "D20",
        material: "Plastic",
        color: "Purple",
        condition: "Used",
        numberOfDice: 1,
        preferredTrade: "Any unusual D20 or mini dice.",
        location: "Redlands, CA",
        imageUrl: "",
        tags: ["purple", "glitter", "d20", "single die"],
        status: "Available"
      },
      {
        owner: garrick._id,
        title: "Heavy Metal Silver Set",
        description: "A heavy silver metal 7-piece set. Good condition but has minor table wear.",
        diceType: "Full Set",
        material: "Metal",
        color: "Silver",
        condition: "Used",
        numberOfDice: 7,
        preferredTrade: "Looking for sharp-edge resin dice or a large D20.",
        location: "Riverside, CA",
        imageUrl: "",
        tags: ["metal", "silver", "heavy", "full set"],
        status: "Available"
      },
      {
        owner: garrick._id,
        title: "Oversized Red D20",
        description: "Large red D20 used as a table centerpiece. Fun for boss rolls.",
        diceType: "D20",
        material: "Plastic",
        color: "Red",
        condition: "Like New",
        numberOfDice: 1,
        preferredTrade: "Looking for metal D6s or green dice.",
        location: "Riverside, CA",
        imageUrl: "",
        tags: ["red", "oversized", "d20", "dm"],
        status: "Available"
      },
      {
        owner: selene._id,
        title: "Green Pathfinder Dice Set",
        description: "Green full set with gold numbers. Good for nature-themed characters.",
        diceType: "Full Set",
        material: "Plastic",
        color: "Green",
        condition: "Used",
        numberOfDice: 7,
        preferredTrade: "Looking for black dice with readable numbers.",
        location: "San Bernardino, CA",
        imageUrl: "",
        tags: ["green", "gold numbers", "pathfinder", "full set"],
        status: "Available"
      },
      {
        owner: selene._id,
        title: "Mixed Lot of D6s",
        description: "A mixed lot of twelve D6s from different board games and TTRPG sets.",
        diceType: "Mixed Lot",
        material: "Plastic",
        color: "Mixed",
        condition: "Worn",
        numberOfDice: 12,
        preferredTrade: "Any single interesting D20.",
        location: "San Bernardino, CA",
        imageUrl: "",
        tags: ["mixed", "d6", "lot", "board game"],
        status: "Available"
      },
      {
        owner: testUser._id,
        title: "Black Wood Painted 7-Set",
        description: "A painted black wooden dice set with gold numbers. I would rather trade for a metal D20.",
        diceType: "Full Set",
        material: "Wood",
        color: "Black",
        condition: "Like New",
        numberOfDice: 7,
        preferredTrade: "One metal D20.",
        location: "Riverside, CA",
        imageUrl: "",
        tags: ["wood", "black", "gold numbers", "painted", "full set"],
        status: "Available"
      }
    ]);

    console.log("Seed complete!");
    console.log("Demo accounts all use password: password123");
    console.log("Example login: mira@example.com / password123");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();