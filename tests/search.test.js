const request = require("supertest");

const app = require("../app");
const { createTestUser, createTestListing } = require("./helpers");

async function createSearchListings() {
  const { user } = await createTestUser();

  await createTestListing(user, {
    title: "Heavy Metal D20",
    diceType: "D20",
    material: "Metal",
    color: "Silver",
    condition: "Used",
    tags: ["metal", "silver", "d20"]
  });

  await createTestListing(user, {
    title: "Ocean Blue Resin Set",
    description: "A translucent ocean-blue resin set with white numbers.",
    diceType: "Full Set",
    material: "Resin",
    color: "Blue",
    condition: "Like New",
    tags: ["blue", "resin", "full set"]
  });
}

describe("Listing search and filters", () => {
  test("keyword search finds a metal listing", async() => {
    await createSearchListings();

    const response = await request(app).get("/listings").query({ q: "metal" });

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Heavy Metal D20");
    expect(response.text).not.toContain("Ocean Blue Resin Set");
  });

  test("keyword search finds a blue listing", async() => {
    await createSearchListings();

    const response = await request(app).get("/listings").query({ q: "blue" });

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Ocean Blue Resin Set");
    expect(response.text).not.toContain("Heavy Metal D20");
  });

  test("dice type filter returns D20 listings", async() => {
    await createSearchListings();

    const response = await request(app).get("/listings").query({ diceType: "D20" });

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Heavy Metal D20");
    expect(response.text).not.toContain("Ocean Blue Resin Set");
  });

  test("material filter returns resin listings", async() => {
    await createSearchListings();

    const response = await request(app).get("/listings").query({ material: "Resin" });

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Ocean Blue Resin Set");
    expect(response.text).not.toContain("Heavy Metal D20");
  });

  test("condition filter returns used listings", async() => {
    await createSearchListings();

    const response = await request(app).get("/listings").query({ condition: "Used" });

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Heavy Metal D20");
    expect(response.text).not.toContain("Ocean Blue Resin Set");
  });

  test("a nonsense search shows the no-results message", async() => {
    await createSearchListings();

    const response = await request(app).get("/listings").query({ q: "no-such-dice-xyz" });

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("No listings matched your search.");
  });
});
