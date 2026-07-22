const bcrypt = require("bcrypt");
const request = require("supertest");

const app = require("../app");
const User = require("../models/User");
const { createTestUser, beginTwoFactorLogin } = require("./helpers");

describe("Authentication", () => {
  test("register creates a user with a hashed password", async() => {
    const response = await request(app)
      .post("/register")
      .type("form")
      .send({
        username: "NewUser",
        email: "new@example.com",
        location: "Riverside, CA",
        bio: "A new test user",
        password: "secret123",
        confirmPassword: "secret123"
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/login");

    const user = await User.findOne({ email: "new@example.com" });
    expect(user).not.toBeNull();
    expect(user.passwordHash).not.toBe("secret123");
    await expect(bcrypt.compare("secret123", user.passwordHash)).resolves.toBe(true);
  });

  test("register rejects mismatched passwords", async() => {
    const response = await request(app)
      .post("/register")
      .type("form")
      .send({
        username: "NewUser",
        email: "new@example.com",
        password: "secret123",
        confirmPassword: "different-password"
      });

    expect(response.statusCode).toBe(400);
    expect(await User.countDocuments()).toBe(0);
  });

  test("correct password and two-factor code complete login", async() => {
    const { user, password } = await createTestUser();
    const agent = request.agent(app);
    const { loginResponse, twoFactorCode } = await beginTwoFactorLogin(agent, user, password);

    expect(loginResponse.statusCode).toBe(302);
    expect(loginResponse.headers.location).toBe("/verify-2fa");

    const verificationPage = await agent.get("/verify-2fa");
    expect(verificationPage.statusCode).toBe(200);
    expect(verificationPage.text).toContain("Verify Two-Factor Code");

    const verificationResponse = await agent
      .post("/verify-2fa")
      .type("form")
      .send({ code: twoFactorCode });

    expect(verificationResponse.statusCode).toBe(302);
    expect(verificationResponse.headers.location).toBe("/profile");

    const profileResponse = await agent.get("/profile");
    expect(profileResponse.statusCode).toBe(200);

    const reusedCodeResponse = await agent
      .post("/verify-2fa")
      .type("form")
      .send({ code: twoFactorCode });
    expect(reusedCodeResponse.statusCode).toBe(400);
  });

  test("a wrong two-factor code is rejected", async() => {
    const { user, password } = await createTestUser();
    const agent = request.agent(app);
    await beginTwoFactorLogin(agent, user, password);

    const response = await agent
      .post("/verify-2fa")
      .type("form")
      .send({ code: "000000" });

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain("Invalid two-factor code");
    expect((await agent.get("/profile")).headers.location).toBe("/login");
  });

  test("an expired two-factor code is rejected", async() => {
    const { user, password } = await createTestUser();
    const agent = request.agent(app);
    const { twoFactorCode } = await beginTwoFactorLogin(agent, user, password);
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(Date.now() + (6 * 60 * 1000));

    let response;

    try {
      response = await agent
        .post("/verify-2fa")
        .type("form")
        .send({ code: twoFactorCode });
    } finally {
      dateSpy.mockRestore();
    }

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain("code has expired");
    expect((await agent.get("/profile")).headers.location).toBe("/login");
  });

  test("protected routes remain blocked before two-factor verification", async() => {
    const { user, password } = await createTestUser();
    const agent = request.agent(app);
    await beginTwoFactorLogin(agent, user, password);

    const profileResponse = await agent.get("/profile");
    const newListingResponse = await agent.get("/listings/new");
    const tradeRequestsResponse = await agent.get("/trade-requests");

    expect(profileResponse.statusCode).toBe(302);
    expect(profileResponse.headers.location).toBe("/login");
    expect(newListingResponse.statusCode).toBe(302);
    expect(newListingResponse.headers.location).toBe("/login");
    expect(tradeRequestsResponse.statusCode).toBe(302);
    expect(tradeRequestsResponse.headers.location).toBe("/login");
  });

  test("login rejects an incorrect password", async() => {
    const { user } = await createTestUser();

    const response = await request(app)
      .post("/login")
      .type("form")
      .send({
        email: user.email,
        password: "wrong-password"
      });

    expect(response.statusCode).toBe(400);
  });

  test("profile redirects to login when logged out", async() => {
    const response = await request(app).get("/profile");

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/login");
  });
});
