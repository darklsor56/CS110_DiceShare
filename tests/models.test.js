const mongoose = require("mongoose");
const User = require("../models/User");
const DiceListing = require("../models/DiceListings");
const Review = require("../models/Review");
const TradeRequest = require("../models/TradeRequest");

describe("Model validation", () => {
  test("User requires username, email, and passwordHash", async() => {
    const user = new User({});
    const error = await user.validate().catch(validationError => validationError);

    expect(error.errors.username).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.passwordHash).toBeDefined();
  });

  test("DiceListing requires core listing fields", async() => {
    const listing = new DiceListing({});
    const error = await listing.validate().catch(validationError => validationError);

    expect(error.errors.owner).toBeDefined();
    expect(error.errors.title).toBeDefined();
    expect(error.errors.description).toBeDefined();
    expect(error.errors.diceType).toBeDefined();
    expect(error.errors.material).toBeDefined();
    expect(error.errors.color).toBeDefined();
    expect(error.errors.condition).toBeDefined();
    expect(error.errors.numberOfDice).toBeDefined();
    expect(error.errors.preferredTrade).toBeDefined();
    expect(error.errors.location).toBeDefined();
  });

  test("Review rating must be between 1 and 5", async() => {
    const review = new Review({
      reviewer: new mongoose.Types.ObjectId(),
      reviewedUser: new mongoose.Types.ObjectId(),
      rating: 6,
      comment: "Too high"
    });

    const error = await review.validate().catch(validationError => validationError);
    expect(error.errors.rating).toBeDefined();
  });

  test("Review comment is optional", async() => {
    const review = new Review({
      reviewer: new mongoose.Types.ObjectId(),
      reviewedUser: new mongoose.Types.ObjectId(),
      listing: new mongoose.Types.ObjectId(),
      rating: 5
    });

    await expect(review.validate()).resolves.toBeUndefined();
    expect(review.comment).toBe("");
  });

  test("TradeRequest rejects invalid status", async() => {
    const request = new TradeRequest({
      listing: new mongoose.Types.ObjectId(),
      requester: new mongoose.Types.ObjectId(),
      owner: new mongoose.Types.ObjectId(),
      status: "Maybe"
    });

    const error = await request.validate().catch(validationError => validationError);
    expect(error.errors.status).toBeDefined();
  });

  test("TradeRequest allows Completed status", async() => {
    const request = new TradeRequest({
      listing: new mongoose.Types.ObjectId(),
      requester: new mongoose.Types.ObjectId(),
      owner: new mongoose.Types.ObjectId(),
      status: "Completed"
    });

    await expect(request.validate()).resolves.toBeUndefined();
  });
});
