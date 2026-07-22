const request = require("supertest");

const app = require("../app");
const { createTestUser, loginAgent, createTestListing } = require("./helpers");

describe("Listing visibility and rating display", () => {
  test("listing detail and profile pages display ratings with two decimal places", async() => {
    const { user } = await createTestUser();
    user.averageRating = 4.666666666666667;
    await user.save();
    const listing = await createTestListing(user);

    const detailResponse = await request(app).get(`/listings/${listing._id}`);
    const profileResponse = await request(app).get(`/users/${user._id}`);

    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.text).toContain("Owner Rating:</strong> 4.67 / 5");
    expect(detailResponse.text).not.toContain("4.666666666666667");
    expect(profileResponse.statusCode).toBe(200);
    expect(profileResponse.text).toContain("Average Rating:</strong> 4.67 / 5");
    expect(profileResponse.text).not.toContain("4.666666666666667");
  });

  test("traded listings are hidden from browse and search but remain in profiles and direct links", async() => {
    const { user, password } = await createTestUser();
    await createTestListing(user, {
      title: "Visible Available Listing",
      material: "Metal",
      status: "Available"
    });
    await createTestListing(user, {
      title: "Visible Pending Listing",
      material: "Plastic",
      status: "Pending"
    });
    const tradedListing = await createTestListing(user, {
      title: "Hidden Traded Resin Listing",
      description: "A unique traded resin listing for visibility testing.",
      material: "Resin",
      status: "Traded"
    });

    const browseResponse = await request(app).get("/listings");
    const searchResponse = await request(app).get("/listings").query({ q: "unique traded resin" });
    const filterResponse = await request(app).get("/listings").query({ material: "Resin" });
    const directResponse = await request(app).get(`/listings/${tradedListing._id}`);
    const ownerAgent = await loginAgent(user, password);
    const profileResponse = await ownerAgent.get("/profile");

    expect(browseResponse.statusCode).toBe(200);
    expect(browseResponse.text).toContain("Visible Available Listing");
    expect(browseResponse.text).toContain("Visible Pending Listing");
    expect(browseResponse.text).not.toContain("Hidden Traded Resin Listing");
    expect(searchResponse.text).not.toContain("Hidden Traded Resin Listing");
    expect(searchResponse.text).toContain("No listings matched your search.");
    expect(filterResponse.text).not.toContain("Hidden Traded Resin Listing");
    expect(filterResponse.text).toContain("No listings matched your search.");
    expect(profileResponse.statusCode).toBe(200);
    expect(profileResponse.text).toContain("Hidden Traded Resin Listing");
    expect(directResponse.statusCode).toBe(200);
    expect(directResponse.text).toContain("Hidden Traded Resin Listing");
    expect(directResponse.text).toContain("<strong>Status:</strong> Traded");
  });

  test("traded listings are excluded from similar recommendations", async() => {
    const { user: owner } = await createTestUser({
      username: "CurrentOwner",
      email: "current@example.com"
    });
    const { user: otherOwner } = await createTestUser({
      username: "OtherOwner",
      email: "other@example.com"
    });
    const currentListing = await createTestListing(owner, {
      title: "Current Recommendation Listing"
    });
    await createTestListing(otherOwner, {
      title: "Available Similar Listing",
      status: "Available"
    });
    await createTestListing(otherOwner, {
      title: "Traded Similar Listing",
      status: "Traded"
    });

    const response = await request(app).get(`/listings/${currentListing._id}`);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Available Similar Listing");
    expect(response.text).not.toContain("Traded Similar Listing");
  });
});
