const request = require("supertest");

const app = require("../app");
const DiceListing = require("../models/DiceListings");
const TradeRequest = require("../models/TradeRequest");
const { createTestUser, loginAgent, createTestListing } = require("./helpers");

async function createUsersAndListing() {
  const { user: owner, password: ownerPassword } = await createTestUser({
    username: "ListingOwner",
    email: "owner@example.com"
  });
  const { user: requester, password: requesterPassword } = await createTestUser({
    username: "Requester",
    email: "requester@example.com"
  });
  const listing = await createTestListing(owner);

  return {
    owner,
    ownerPassword,
    requester,
    requesterPassword,
    listing
  };
}

describe("Trade requests", () => {
  test("a logged-out user cannot create or view trade requests", async() => {
    const { listing } = await createUsersAndListing();

    const createResponse = await request(app).post(`/listings/${listing._id}/request`);
    const pageResponse = await request(app).get("/trade-requests");

    expect(createResponse.statusCode).toBe(302);
    expect(createResponse.headers.location).toBe("/login");
    expect(pageResponse.statusCode).toBe(302);
    expect(pageResponse.headers.location).toBe("/login");
    expect(await TradeRequest.countDocuments()).toBe(0);
  });

  test("a logged-out user cannot accept, decline, or cancel requests", async() => {
    const { owner, requester, listing } = await createUsersAndListing();
    const tradeRequest = await TradeRequest.create({
      listing: listing._id,
      requester: requester._id,
      owner: owner._id
    });

    const acceptResponse = await request(app).post(`/trade-requests/${tradeRequest._id}/accept`);
    const declineResponse = await request(app).post(`/trade-requests/${tradeRequest._id}/decline`);
    const cancelResponse = await request(app).post(`/trade-requests/${tradeRequest._id}/cancel`);

    expect(acceptResponse.statusCode).toBe(302);
    expect(acceptResponse.headers.location).toBe("/login");
    expect(declineResponse.statusCode).toBe(302);
    expect(declineResponse.headers.location).toBe("/login");
    expect(cancelResponse.statusCode).toBe(302);
    expect(cancelResponse.headers.location).toBe("/login");
    expect((await TradeRequest.findById(tradeRequest._id)).status).toBe("Pending");
  });

  test("a logged-in non-owner can create a trade request", async() => {
    const { owner, requester, requesterPassword, listing } = await createUsersAndListing();
    const offeredListing = await createTestListing(requester, { title: "Offered Dice" });
    const agent = await loginAgent(requester, requesterPassword);

    const response = await agent
      .post(`/listings/${listing._id}/request`)
      .type("form")
      .send({
        offeredListing: offeredListing._id.toString(),
        message: "Would you trade for my dice?"
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(`/listings/${listing._id}?request=created`);

    const tradeRequest = await TradeRequest.findOne({ listing: listing._id });
    expect(tradeRequest).not.toBeNull();
    expect(tradeRequest.requester.toString()).toBe(requester._id.toString());
    expect(tradeRequest.owner.toString()).toBe(owner._id.toString());
    expect(tradeRequest.offeredListing.toString()).toBe(offeredListing._id.toString());
    expect(tradeRequest.status).toBe("Pending");

    const requestsPage = await agent.get("/trade-requests");
    expect(requestsPage.statusCode).toBe(200);
    expect(requestsPage.text).toContain("Would you trade for my dice?");
  });

  test("an owner cannot request a trade on their own listing", async() => {
    const { owner, ownerPassword, listing } = await createUsersAndListing();
    const agent = await loginAgent(owner, ownerPassword);

    const response = await agent.post(`/listings/${listing._id}/request`);

    expect(response.statusCode).toBe(403);
    expect(await TradeRequest.countDocuments()).toBe(0);
  });

  test("duplicate pending requests are blocked", async() => {
    const { requester, requesterPassword, listing } = await createUsersAndListing();
    const agent = await loginAgent(requester, requesterPassword);

    await agent
      .post(`/listings/${listing._id}/request`)
      .type("form")
      .send({ message: "First request" })
      .expect(302);

    const duplicateResponse = await agent
      .post(`/listings/${listing._id}/request`)
      .type("form")
      .send({ message: "Duplicate request" });

    expect(duplicateResponse.statusCode).toBe(400);
    expect(await TradeRequest.countDocuments()).toBe(1);
  });

  test("a requester cannot offer a listing owned by another user", async() => {
    const { owner, requester, requesterPassword, listing } = await createUsersAndListing();
    const otherUsersListing = await createTestListing(owner, { title: "Not Requester's Dice" });
    const agent = await loginAgent(requester, requesterPassword);

    const response = await agent
      .post(`/listings/${listing._id}/request`)
      .type("form")
      .send({ offeredListing: otherUsersListing._id.toString() });

    expect(response.statusCode).toBe(400);
    expect(await TradeRequest.countDocuments()).toBe(0);
  });

  test("a user cannot request a pending listing", async() => {
    const { requester, requesterPassword, listing } = await createUsersAndListing();
    listing.status = "Pending";
    await listing.save();
    const agent = await loginAgent(requester, requesterPassword);

    const response = await agent.post(`/listings/${listing._id}/request`);

    expect(response.statusCode).toBe(400);
    expect(await TradeRequest.countDocuments()).toBe(0);
  });

  test("a user cannot request a traded listing", async() => {
    const { requester, requesterPassword, listing } = await createUsersAndListing();
    listing.status = "Traded";
    await listing.save();
    const agent = await loginAgent(requester, requesterPassword);

    const response = await agent.post(`/listings/${listing._id}/request`);

    expect(response.statusCode).toBe(400);
    expect(await TradeRequest.countDocuments()).toBe(0);
  });

  test("the listing owner can accept and decline received requests", async() => {
    const { owner, ownerPassword, requester, listing } = await createUsersAndListing();
    const { user: secondRequester } = await createTestUser({
      username: "SecondRequester",
      email: "second@example.com"
    });
    const acceptedRequest = await TradeRequest.create({
      listing: listing._id,
      requester: requester._id,
      owner: owner._id
    });
    const declinedRequest = await TradeRequest.create({
      listing: listing._id,
      requester: secondRequester._id,
      owner: owner._id
    });
    const agent = await loginAgent(owner, ownerPassword);

    const acceptResponse = await agent.post(`/trade-requests/${acceptedRequest._id}/accept`);
    const repeatAcceptResponse = await agent.post(`/trade-requests/${acceptedRequest._id}/accept`);
    const declineResponse = await agent.post(`/trade-requests/${declinedRequest._id}/decline`);

    expect(acceptResponse.statusCode).toBe(302);
    expect(repeatAcceptResponse.statusCode).toBe(400);
    expect(declineResponse.statusCode).toBe(302);
    expect((await TradeRequest.findById(acceptedRequest._id)).status).toBe("Accepted");
    expect((await TradeRequest.findById(declinedRequest._id)).status).toBe("Declined");
    expect((await DiceListing.findById(listing._id)).status).toBe("Pending");

    const detailPage = await agent.get(`/listings/${listing._id}`);
    const browsePage = await agent.get("/listings");
    const requestsPage = await agent.get("/trade-requests");

    expect(detailPage.text).toContain("<strong>Status:</strong> Pending");
    expect(browsePage.text).toContain("<strong>Status:</strong> Pending");
    expect(requestsPage.text).toContain("<strong>Listing Status:</strong> Pending");
  });

  test("a requester cannot accept their own sent request", async() => {
    const { owner, requester, requesterPassword, listing } = await createUsersAndListing();
    const tradeRequest = await TradeRequest.create({
      listing: listing._id,
      requester: requester._id,
      owner: owner._id
    });
    const agent = await loginAgent(requester, requesterPassword);

    const response = await agent.post(`/trade-requests/${tradeRequest._id}/accept`);

    expect(response.statusCode).toBe(403);
    expect((await TradeRequest.findById(tradeRequest._id)).status).toBe("Pending");
    expect((await DiceListing.findById(listing._id)).status).toBe("Available");
  });

  test("competing requests remain pending after one request is accepted", async() => {
    const { owner, ownerPassword, requester, listing } = await createUsersAndListing();
    const { user: secondRequester } = await createTestUser({
      username: "SecondRequester",
      email: "second@example.com"
    });
    const acceptedRequest = await TradeRequest.create({
      listing: listing._id,
      requester: requester._id,
      owner: owner._id
    });
    const competingRequest = await TradeRequest.create({
      listing: listing._id,
      requester: secondRequester._id,
      owner: owner._id
    });
    const agent = await loginAgent(owner, ownerPassword);

    await agent.post(`/trade-requests/${acceptedRequest._id}/accept`).expect(302);
    const competingAcceptResponse = await agent.post(`/trade-requests/${competingRequest._id}/accept`);

    expect(competingAcceptResponse.statusCode).toBe(400);
    expect((await TradeRequest.findById(acceptedRequest._id)).status).toBe("Accepted");
    expect((await TradeRequest.findById(competingRequest._id)).status).toBe("Pending");
    expect((await DiceListing.findById(listing._id)).status).toBe("Pending");

    const requestsPage = await agent.get("/trade-requests");
    expect(requestsPage.text).not.toContain(`/trade-requests/${competingRequest._id}/accept`);
    expect(requestsPage.text).toContain(`/trade-requests/${competingRequest._id}/decline`);
  });

  test("the requester can cancel their own pending request", async() => {
    const { owner, requester, requesterPassword, listing } = await createUsersAndListing();
    const tradeRequest = await TradeRequest.create({
      listing: listing._id,
      requester: requester._id,
      owner: owner._id
    });
    const agent = await loginAgent(requester, requesterPassword);

    const response = await agent.post(`/trade-requests/${tradeRequest._id}/cancel`);

    expect(response.statusCode).toBe(302);
    expect((await TradeRequest.findById(tradeRequest._id)).status).toBe("Canceled");
  });

  test("other users cannot accept, decline, or cancel a request", async() => {
    const { owner, requester, listing } = await createUsersAndListing();
    const { user: otherUser, password } = await createTestUser({
      username: "OtherUser",
      email: "other@example.com"
    });
    const tradeRequest = await TradeRequest.create({
      listing: listing._id,
      requester: requester._id,
      owner: owner._id
    });
    const agent = await loginAgent(otherUser, password);

    const acceptResponse = await agent.post(`/trade-requests/${tradeRequest._id}/accept`);
    const declineResponse = await agent.post(`/trade-requests/${tradeRequest._id}/decline`);
    const cancelResponse = await agent.post(`/trade-requests/${tradeRequest._id}/cancel`);

    expect(acceptResponse.statusCode).toBe(403);
    expect(declineResponse.statusCode).toBe(403);
    expect(cancelResponse.statusCode).toBe(403);
    expect((await TradeRequest.findById(tradeRequest._id)).status).toBe("Pending");
  });
});
