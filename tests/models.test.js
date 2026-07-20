const mongoose = require("mongoose");
const User = require("../models/User");
const DiceListing = require("../models/DiceListings");
const Review = require("../models/Review");
const TradeRequest = require("../models/TradeRequest");

describe("Model validation", () => {
  test("User requires username, email, and passwordHash", () => {
    const user = new User({});
    const error = user.validateSync();

    expect(error.errors.username).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.passwordHash).toBeDefined();
  });

  test("DiceListing requires core listing fields", () => {
    const listing = new DiceListing({});
    const error = listing.validateSync();

    expect(error.errors.owner).toBeDefined();
    expect(error.errors.title).toBeDefined();
    expect(error.errors.description).toBeDefined();
    expect(error.errors.diceType).toBeDefined();
    expect(error.errors.material).toBeDefined();
    expect(error.errors.condition).toBeDefined();
    expect(error.errors.numberOfDice).toBeDefined();
    expect(error.errors.preferredTrade).toBeDefined();
    expect(error.errors.location).toBeDefined();
  });

  test("Review rating must be between 1 and 5", () => {
    const review = new Review({
      reviewer: new mongoose.Types.ObjectId(),
      reviewedUser: new mongoose.Types.ObjectId(),
      rating: 6,
      comment: "Too high"
    });

    const error = review.validateSync();
    expect(error.errors.rating).toBeDefined();
  });

  test("TradeRequest rejects invalid status", () => {
    const request = new TradeRequest({
      listing: new mongoose.Types.ObjectId(),
      requester: new mongoose.Types.ObjectId(),
      owner: new mongoose.Types.ObjectId(),
      status: "Maybe"
    });

    const error = request.validateSync();
    expect(error.errors.status).toBeDefined();
  });
});