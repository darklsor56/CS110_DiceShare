const request = require("supertest");

const app = require("../app");
const DiceListing = require("../models/DiceListings");
const { createTestUser, loginAgent, createTestListing } = require("./helpers");

function listingForm(overrides = {}) {
  return {
    title: "New Resin Set",
    description: "A blue resin set created during testing.",
    diceType: "Full Set",
    material: "Resin",
    color: "Blue",
    condition: "New",
    numberOfDice: 7,
    preferredTrade: "A metal D20",
    location: "Redlands, CA",
    imageUrl: "",
    tags: "blue, resin, full set",
    status: "Available",
    ...overrides
  };
}

describe("Dice listings", () => {
  test("a logged-in user can create a listing", async() => {
    const { user, password } = await createTestUser();
    const agent = await loginAgent(user, password);

    const response = await agent
      .post("/listings")
      .type("form")
      .send(listingForm());

    expect(response.statusCode).toBe(302);

    const listing = await DiceListing.findOne({ title: "New Resin Set" });
    expect(listing).not.toBeNull();
    expect(listing.owner.toString()).toBe(user._id.toString());
    expect(response.headers.location).toBe(`/listings/${listing._id}`);
  });

  test("a logged-out user cannot access the new listing page", async() => {
    const response = await request(app).get("/listings/new");

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/login");
  });

  test("a listing owner can edit their listing", async() => {
    const { user, password } = await createTestUser();
    const listing = await createTestListing(user);
    const agent = await loginAgent(user, password);

    const response = await agent
      .post(`/listings/${listing._id}/edit`)
      .type("form")
      .send(listingForm({ title: "Updated Listing" }));

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(`/listings/${listing._id}`);

    const updatedListing = await DiceListing.findById(listing._id);
    expect(updatedListing.title).toBe("Updated Listing");
  });

  test("a listing owner can delete their listing", async() => {
    const { user, password } = await createTestUser();
    const listing = await createTestListing(user);
    const agent = await loginAgent(user, password);

    const response = await agent.post(`/listings/${listing._id}/delete`);

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/profile");
    expect(await DiceListing.findById(listing._id)).toBeNull();
  });

  test("a non-owner cannot edit or delete another user's listing", async() => {
    const { user: owner } = await createTestUser({
      username: "ListingOwner",
      email: "owner@example.com"
    });
    const { user: otherUser, password } = await createTestUser({
      username: "OtherUser",
      email: "other@example.com"
    });
    const listing = await createTestListing(owner);
    const agent = await loginAgent(otherUser, password);

    const editPageResponse = await agent.get(`/listings/${listing._id}/edit`);
    const editResponse = await agent
      .post(`/listings/${listing._id}/edit`)
      .type("form")
      .send(listingForm({ title: "Unauthorized Change" }));
    const deleteResponse = await agent.post(`/listings/${listing._id}/delete`);

    expect(editPageResponse.statusCode).toBe(403);
    expect(editResponse.statusCode).toBe(403);
    expect(deleteResponse.statusCode).toBe(403);

    const unchangedListing = await DiceListing.findById(listing._id);
    expect(unchangedListing).not.toBeNull();
    expect(unchangedListing.title).toBe("Test Metal D20");
  });
});
