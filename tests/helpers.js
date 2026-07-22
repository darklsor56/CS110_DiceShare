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

async function beginTwoFactorLogin(agent, user, password = "password123") {
  let twoFactorCode = "";
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(message => {
    const codeMatch = String(message).match(/\[2FA demo\].*:\s(\d{6})$/);

    if(codeMatch) {
      twoFactorCode = codeMatch[1];
    }
  });

  let loginResponse;

  try {
    loginResponse = await agent
      .post("/login")
      .type("form")
      .send({
        email: user.email,
        password
      });
  } finally {
    consoleSpy.mockRestore();
  }

  if(!twoFactorCode) {
    throw new Error("The login route did not print a six-digit 2FA code.");
  }

  return { loginResponse, twoFactorCode };
}

async function loginAgent(user, password = "password123") {
  const agent = request.agent(app);
  const { loginResponse, twoFactorCode } = await beginTwoFactorLogin(agent, user, password);

  if(loginResponse.statusCode !== 302 || loginResponse.headers.location !== "/verify-2fa") {
    throw new Error("Password login did not redirect to two-factor verification.");
  }

  await agent
    .post("/verify-2fa")
    .type("form")
    .send({ code: twoFactorCode })
    .expect(302)
    .expect("Location", "/profile");

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
  beginTwoFactorLogin,
  loginAgent,
  createTestListing
};
