const request = require("supertest");

const app = require("../app");
const { createTestUser, createTestListing } = require("./helpers");

describe("Similar listing recommendations", () => {
  test("the detail page shows the similar listings section", async() => {
    const { user } = await createTestUser();
    const listing = await createTestListing(user);

    const response = await request(app).get(`/listings/${listing._id}`);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Similar Dice Listings");
  });

  test("a matching listing appears but the current listing does not recommend itself", async() => {
    const { user: owner } = await createTestUser({
      username: "ListingOwner",
      email: "owner@example.com"
    });
    const { user: otherOwner } = await createTestUser({
      username: "OtherOwner",
      email: "other@example.com"
    });
    const currentListing = await createTestListing(owner, {
      title: "Current Blue Metal D20"
    });
    const similarListing = await createTestListing(otherOwner, {
      title: "Similar Blue Metal D20"
    });

    const response = await request(app).get(`/listings/${currentListing._id}`);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Similar Blue Metal D20");
    expect(response.text).toContain(`/listings/${similarListing._id}`);
    expect(response.text).not.toContain(`href="/listings/${currentListing._id}"`);
  });

  test("a listing with no similar matches shows the no-recommendations message", async() => {
    const { user } = await createTestUser();
    const currentListing = await createTestListing(user);

    await createTestListing(user, {
      title: "Unrelated Red Resin D6",
      diceType: "D6",
      material: "Resin",
      color: "Red",
      condition: "Used",
      location: "San Diego, CA",
      tags: ["red", "resin", "d6"]
    });

    const response = await request(app).get(`/listings/${currentListing._id}`);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("No similar listings found yet.");
  });
});
