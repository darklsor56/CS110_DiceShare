const bcrypt = require("bcrypt");
const request = require("supertest");

const app = require("../app");
const User = require("../models/User");
const { createTestUser } = require("./helpers");

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

  test("login works with correct credentials", async() => {
    const { user, password } = await createTestUser();
    const agent = request.agent(app);

    const loginResponse = await agent
      .post("/login")
      .type("form")
      .send({ email: user.email, password });

    expect(loginResponse.statusCode).toBe(302);
    expect(loginResponse.headers.location).toBe("/profile");

    const profileResponse = await agent.get("/profile");
    expect(profileResponse.statusCode).toBe(200);
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
