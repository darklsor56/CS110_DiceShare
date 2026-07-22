const bcrypt = require("bcrypt");
const request = require("supertest");

const app = require("../app");
const User = require("../models/User");
const DiceListing = require("../models/DiceListings");

async function createTestUser(overrides = {}) {
  const { password = "password123", ...userOverrides } = overrides;
  const passwordHash = await bcrypt.hash(password, 4);

  const user = await User.create({
    username: "TestUser",
    email: "test@example.com",
    location: "Riverside, CA",
    ...userOverrides,
    passwordHash
  });

  return { user, password };
}

async function loginAgent(user, password = "password123") {
  const agent = request.agent(app);

  await agent
    .post("/login")
    .type("form")
    .send({
      email: user.email,
      password
    })
    .expect(302);

  return agent;
}

async function createTestListing(owner, overrides = {}) {
  return DiceListing.create({
    owner: owner._id,
    title: "Test Metal D20",
    description: "A test listing for an oversized metal D20.",
    diceType: "D20",
    material: "Metal",
    color: "Blue",
    condition: "Like New",
    numberOfDice: 1,
    preferredTrade: "Another interesting D20",
    location: "Riverside, CA",
    tags: ["metal", "blue", "d20"],
    status: "Available",
    ...overrides
  });
}

module.exports = {
  createTestUser,
  loginAgent,
  createTestListing
};
