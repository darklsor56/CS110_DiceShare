const request = require("supertest");
const app = require("../app");

describe("Page routes", () => {
  test("GET / should load the home page", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("DiceShare");
  });

  test("GET /listings should load the listings page", async () => {
    const res = await request(app).get("/listings");
    expect(res.statusCode).toBe(200);
  });

  test("GET /login should load the login page", async () => {
    const res = await request(app).get("/login");
    expect(res.statusCode).toBe(200);
  });

  test("GET /register should load the register page", async () => {
    const res = await request(app).get("/register");
    expect(res.statusCode).toBe(200);
  });
});