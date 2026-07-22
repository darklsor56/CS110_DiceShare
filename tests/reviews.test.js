const request = require("supertest");

const app = require("../app");
const Review = require("../models/Review");
const User = require("../models/User");
const { createTestUser, loginAgent, createTestListing } = require("./helpers");

async function createReviewUsersAndListing() {
  const { user: owner, password: ownerPassword } = await createTestUser({
    username: "ReviewedTrader",
    email: "owner@example.com"
  });
  const { user: reviewer, password: reviewerPassword } = await createTestUser({
    username: "HappyReviewer",
    email: "reviewer@example.com"
  });
  const listing = await createTestListing(owner, { title: "Owner's Metal D20" });

  return {
    owner,
    ownerPassword,
    reviewer,
    reviewerPassword,
    listing
  };
}

describe("Trader reviews", () => {
  test("a logged-in non-owner can create a review with server-derived users", async() => {
    const { owner, reviewer, reviewerPassword, listing } = await createReviewUsersAndListing();
    const agent = await loginAgent(reviewer, reviewerPassword);

    const response = await agent
      .post(`/listings/${listing._id}/reviews`)
      .type("form")
      .send({
        rating: "5",
        comment: "  Excellent trader and quick meetup.  ",
        reviewer: owner._id.toString(),
        reviewedUser: reviewer._id.toString()
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(`/listings/${listing._id}?review=created`);

    const review = await Review.findOne({ listing: listing._id });
    expect(review).not.toBeNull();
    expect(review.reviewer.toString()).toBe(reviewer._id.toString());
    expect(review.reviewedUser.toString()).toBe(owner._id.toString());
    expect(review.listing.toString()).toBe(listing._id.toString());
    expect(review.rating).toBe(5);
    expect(review.comment).toBe("Excellent trader and quick meetup.");
    expect((await User.findById(owner._id)).averageRating).toBe(5);
  });

  test("a review comment can be omitted", async() => {
    const { reviewer, reviewerPassword, listing } = await createReviewUsersAndListing();
    const agent = await loginAgent(reviewer, reviewerPassword);

    const response = await agent
      .post(`/listings/${listing._id}/reviews`)
      .type("form")
      .send({ rating: "4" });

    expect(response.statusCode).toBe(302);
    expect((await Review.findOne({ listing: listing._id })).comment).toBe("");
  });

  test.each([0, 6])("rating %i is rejected", async(rating) => {
    const { reviewer, reviewerPassword, listing } = await createReviewUsersAndListing();
    const agent = await loginAgent(reviewer, reviewerPassword);

    const response = await agent
      .post(`/listings/${listing._id}/reviews`)
      .type("form")
      .send({ rating });

    expect(response.statusCode).toBe(400);
    expect(await Review.countDocuments()).toBe(0);
  });

  test("a non-numeric rating is rejected", async() => {
    const { reviewer, reviewerPassword, listing } = await createReviewUsersAndListing();
    const agent = await loginAgent(reviewer, reviewerPassword);

    const response = await agent
      .post(`/listings/${listing._id}/reviews`)
      .type("form")
      .send({ rating: "excellent" });

    expect(response.statusCode).toBe(400);
    expect(await Review.countDocuments()).toBe(0);
  });

  test("a comment longer than 1000 characters is rejected", async() => {
    const { reviewer, reviewerPassword, listing } = await createReviewUsersAndListing();
    const agent = await loginAgent(reviewer, reviewerPassword);

    const response = await agent
      .post(`/listings/${listing._id}/reviews`)
      .type("form")
      .send({ rating: "5", comment: "a".repeat(1001) });

    expect(response.statusCode).toBe(400);
    expect(await Review.countDocuments()).toBe(0);
  });

  test("a logged-out user cannot create a review", async() => {
    const { listing } = await createReviewUsersAndListing();

    const response = await request(app)
      .post(`/listings/${listing._id}/reviews`)
      .type("form")
      .send({ rating: "5" });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/login");
    expect(await Review.countDocuments()).toBe(0);
  });

  test("a user cannot review their own listing", async() => {
    const { owner, ownerPassword, listing } = await createReviewUsersAndListing();
    const agent = await loginAgent(owner, ownerPassword);

    const response = await agent
      .post(`/listings/${listing._id}/reviews`)
      .type("form")
      .send({ rating: "5" });

    expect(response.statusCode).toBe(403);
    expect(await Review.countDocuments()).toBe(0);
  });

  test("the same reviewer cannot review the same listing twice", async() => {
    const { reviewer, reviewerPassword, listing } = await createReviewUsersAndListing();
    const agent = await loginAgent(reviewer, reviewerPassword);

    await agent
      .post(`/listings/${listing._id}/reviews`)
      .type("form")
      .send({ rating: "5" })
      .expect(302);

    const duplicateResponse = await agent
      .post(`/listings/${listing._id}/reviews`)
      .type("form")
      .send({ rating: "3" });

    expect(duplicateResponse.statusCode).toBe(400);
    expect(await Review.countDocuments()).toBe(1);
  });

  test("multiple reviews calculate the trader's average rating", async() => {
    const { owner, reviewer, reviewerPassword, listing } = await createReviewUsersAndListing();
    const { user: secondReviewer, password } = await createTestUser({
      username: "SecondReviewer",
      email: "second@example.com"
    });
    const firstAgent = await loginAgent(reviewer, reviewerPassword);
    const secondAgent = await loginAgent(secondReviewer, password);

    await firstAgent
      .post(`/listings/${listing._id}/reviews`)
      .type("form")
      .send({ rating: "5" })
      .expect(302);
    await secondAgent
      .post(`/listings/${listing._id}/reviews`)
      .type("form")
      .send({ rating: "3" })
      .expect(302);

    expect((await User.findById(owner._id)).averageRating).toBe(4);
  });

  test("listing details display escaped trader reviews and related listings", async() => {
    const { owner, reviewer, listing } = await createReviewUsersAndListing();
    await Review.create({
      reviewer: reviewer._id,
      reviewedUser: owner._id,
      listing: listing._id,
      rating: 5,
      comment: "<script>alert('review')</script>"
    });

    const response = await request(app).get(`/listings/${listing._id}`);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Reviews for this trader");
    expect(response.text).toContain("HappyReviewer");
    expect(response.text).toContain("Owner&#39;s Metal D20");
    expect(response.text).toContain("&lt;script&gt;alert(&#39;review&#39;)&lt;/script&gt;");
    expect(response.text).not.toContain("<script>alert('review')</script>");
  });

  test("public and private profile pages display reviews for the trader", async() => {
    const { owner, ownerPassword, reviewer, listing } = await createReviewUsersAndListing();
    await Review.create({
      reviewer: reviewer._id,
      reviewedUser: owner._id,
      listing: listing._id,
      rating: 4,
      comment: "Reliable local trader."
    });

    const publicResponse = await request(app).get(`/users/${owner._id}`);
    const ownerAgent = await loginAgent(owner, ownerPassword);
    const privateResponse = await ownerAgent.get("/profile");

    expect(publicResponse.statusCode).toBe(200);
    expect(publicResponse.text).toContain("Reliable local trader.");
    expect(publicResponse.text).toContain("HappyReviewer");
    expect(publicResponse.text).not.toContain(owner.email);
    expect(privateResponse.statusCode).toBe(200);
    expect(privateResponse.text).toContain("Reliable local trader.");
  });

  test("review form visibility follows login and ownership", async() => {
    const { owner, ownerPassword, reviewer, reviewerPassword, listing } = await createReviewUsersAndListing();
    const ownerAgent = await loginAgent(owner, ownerPassword);
    const reviewerAgent = await loginAgent(reviewer, reviewerPassword);

    const loggedOutPage = await request(app).get(`/listings/${listing._id}`);
    const ownerPage = await ownerAgent.get(`/listings/${listing._id}`);
    const reviewerPage = await reviewerAgent.get(`/listings/${listing._id}`);

    expect(loggedOutPage.text).toContain("Log in</a> to leave a review.");
    expect(ownerPage.text).not.toContain(`/listings/${listing._id}/reviews`);
    expect(reviewerPage.text).toContain(`/listings/${listing._id}/reviews`);
  });
});
