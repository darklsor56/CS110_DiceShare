const express = require("express");
const path = require("path");
const crypto = require("crypto");
const DiceListing = require("./models/DiceListings")
const bcrypt = require("bcrypt")
const User = require("./models/User");
const TradeRequest = require("./models/TradeRequest");
const Review = require("./models/Review");
const session = require("express-session");

const app = express();

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-later",
    resave: false,
    saveUninitialized: false
  })
);
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// helpers
function requiredLogin(req, res, next) {
  if(!req.session.user) {
    return res.redirect("/login");
  }

  next();
}

async function requireListingOwner(req, res, next) {
  try {
    const listing = await DiceListing.findById(req.params.id);

    if(!listing) {
      return res.status(404).send("Listing not found.");
    }

    if(listing.owner.toString() !== req.session.user.id) {
      return res.status(403).send("You do not have permission to modify this listing.");
    }

    req.listing = listing;
    next();
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not verify listing owner.");
  }
}

async function updateAverageRating(userId) {
  const reviews = await Review.find({ reviewedUser: userId });
  const ratingTotal = reviews.reduce((total, review) => total + review.rating, 0);
  const averageRating = reviews.length > 0 ? ratingTotal / reviews.length : 0;

  await User.findByIdAndUpdate(userId, { averageRating });
}

// Temporary routes
app.get("/", (req, res) => {res.render("home", { title: "DiceShare" })});

app.get("/listings", async(req, res) => {
  try {
    const searchValues = {
      q: typeof req.query.q === "string" ? req.query.q.trim() : "",
      diceType: typeof req.query.diceType === "string" ? req.query.diceType.trim() : "",
      material: typeof req.query.material === "string" ? req.query.material.trim() : "",
      condition: typeof req.query.condition === "string" ? req.query.condition.trim() : "",
      location: typeof req.query.location === "string" ? req.query.location.trim() : ""
    };

    const query = {};

    // Escape special characters so the search text is treated as regular text.
    const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if(searchValues.q) {
      const keyword = new RegExp(escapeRegex(searchValues.q), "i");
      query.$or = [
        { title: keyword },
        { description: keyword },
        { diceType: keyword },
        { material: keyword },
        { color: keyword },
        { condition: keyword },
        { preferredTrade: keyword },
        { location: keyword },
        { tags: keyword }
      ];
    }

    // These menu filters match the complete field value, ignoring capitalization.
    ["diceType", "material", "condition"].forEach(field => {
      if(searchValues[field]) {
        query[field] = new RegExp(`^${escapeRegex(searchValues[field])}$`, "i");
      }
    });

    // Location allows a city or area to match part of the saved location.
    if(searchValues.location) {
      query.location = new RegExp(escapeRegex(searchValues.location), "i");
    }

    const listings = await DiceListing.find(query).populate("owner").sort({ createdAt: -1 });

    res.render("listings", {
      title: "Browse Listings",
      listings,
      searchValues
    });
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not load listings.");
  }
});
app.post("/listings", requiredLogin, async(req, res) => {
  try {
    const {
      title,
      description,
      diceType,
      material,
      color,
      condition,
      numberOfDice,
      preferredTrade,
      location,
      imageUrl,
      tags
    } = req.body;

    const tagArray = tags ? tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    const newListing = await DiceListing.create({
      owner: req.session.user.id,
      title,
      description,
      diceType,
      material,
      color,
      condition,
      numberOfDice,
      preferredTrade,
      location,
      imageUrl,
      tags: tagArray
    });

    res.redirect(`/listings/${newListing._id}`);
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not create listing");
  }
});

app.get("/listings/new", requiredLogin, (req, res) => {res.render("create-listing", { title: "Create Listing" })});

app.get("/listings/:id", async(req, res) => {
  try {
    const listing = await DiceListing.findById(req.params.id).populate("owner");

    if(!listing) {
      return res.status(404).send("Listing not found.")
    }

    const otherListings = await DiceListing.find({
      _id: { $ne: listing._id },
      status: "Available"
    }).sort({ createdAt: -1 });

    const sameText = (firstValue, secondValue) => {
      return firstValue && secondValue && firstValue.toLowerCase() === secondValue.toLowerCase();
    };

    const listingTags = listing.tags.map(tag => tag.toLowerCase());

    const recommendedListings = otherListings
      .map(otherListing => {
        let score = 0;

        if(sameText(listing.diceType, otherListing.diceType)) score += 3;
        if(sameText(listing.material, otherListing.material)) score += 3;
        if(sameText(listing.color, otherListing.color)) score += 2;
        if(sameText(listing.condition, otherListing.condition)) score += 2;
        if(sameText(listing.location, otherListing.location)) score += 1;

        otherListing.tags.forEach(tag => {
          if(listingTags.includes(tag.toLowerCase())) score += 1;
        });

        return {
          listing: otherListing,
          score
        };
      })
      .filter(recommendation => recommendation.score > 0)
      .sort((first, second) => second.score - first.score)
      .slice(0, 4)
      .map(recommendation => recommendation.listing);

    let offerableListings = [];

    if(req.session.user && req.session.user.id !== listing.owner._id.toString()) {
      offerableListings = await DiceListing.find({
        owner: req.session.user.id,
        status: "Available"
      }).sort({ createdAt: -1 });
    }

    const reviews = await Review.find({ reviewedUser: listing.owner._id })
      .populate("reviewer listing")
      .sort({ createdAt: -1 });

    res.render("listing-detail", {
      title: listing.title,
      listing,
      recommendedListings,
      offerableListings,
      reviews,
      requestCreated: req.query.request === "created",
      reviewCreated: req.query.review === "created"
    });
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not load listing.");
  }
});

app.post("/listings/:id/reviews", requiredLogin, async(req, res) => {
  try {
    const listing = await DiceListing.findById(req.params.id);

    if(!listing) {
      return res.status(404).send("Listing not found.");
    }

    if(listing.owner.toString() === req.session.user.id) {
      return res.status(403).send("You cannot review yourself.");
    }

    const reviewBody = req.body || {};
    const rating = Number(reviewBody.rating);
    const comment = typeof reviewBody.comment === "string" ? reviewBody.comment.trim() : "";

    if(!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).send("Rating must be a whole number from 1 to 5.");
    }

    if(comment.length > 1000) {
      return res.status(400).send("Review comments must be 1000 characters or fewer.");
    }

    const existingReview = await Review.findOne({
      reviewer: req.session.user.id,
      listing: listing._id
    });

    if(existingReview) {
      return res.status(400).send("You have already reviewed this trader for this listing.");
    }

    await Review.create({
      reviewer: req.session.user.id,
      reviewedUser: listing.owner,
      listing: listing._id,
      rating,
      comment
    });

    await updateAverageRating(listing.owner);

    res.redirect(`/listings/${listing._id}?review=created`);
  } catch(error) {
    if(error.code === 11000) {
      return res.status(400).send("You have already reviewed this trader for this listing.");
    }

    console.error(error);
    res.status(500).send("Could not create review.");
  }
});

app.post("/listings/:id/request", requiredLogin, async(req, res) => {
  try {
    const requestBody = req.body || {};
    const message = typeof requestBody.message === "string" ? requestBody.message.trim() : "";

    if(message.length > 500) {
      return res.status(400).send("Trade request messages must be 500 characters or fewer.");
    }

    const listing = await DiceListing.findById(req.params.id);

    if(!listing) {
      return res.status(404).send("Listing not found.");
    }

    if(listing.owner.toString() === req.session.user.id) {
      return res.status(403).send("You cannot request a trade on your own listing.");
    }

    if(listing.status !== "Available") {
      return res.status(400).send("This listing is not available for trade.");
    }

    const existingRequest = await TradeRequest.findOne({
      listing: listing._id,
      requester: req.session.user.id,
      status: "Pending"
    });

    if(existingRequest) {
      return res.status(400).send("You already have a pending request for this listing.");
    }

    let offeredListing;

    if(requestBody.offeredListing) {
      offeredListing = await DiceListing.findOne({
        _id: requestBody.offeredListing,
        owner: req.session.user.id,
        status: "Available"
      });

      if(!offeredListing) {
        return res.status(400).send("The offered listing is not available or does not belong to you.");
      }
    }

    await TradeRequest.create({
      listing: listing._id,
      requester: req.session.user.id,
      owner: listing.owner,
      offeredListing: offeredListing ? offeredListing._id : undefined,
      message,
      status: "Pending"
    });

    res.redirect(`/listings/${listing._id}?request=created`);
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not create trade request.");
  }
});

app.get("/trade-requests", requiredLogin, async(req, res) => {
  try {
    const populateFields = ["listing", "requester", "owner", "offeredListing"];

    const receivedRequests = await TradeRequest.find({ owner: req.session.user.id })
      .populate(populateFields)
      .sort({ createdAt: -1 });

    const sentRequests = await TradeRequest.find({ requester: req.session.user.id })
      .populate(populateFields)
      .sort({ createdAt: -1 });

    const successMessages = {
      accepted: "Trade request accepted.",
      declined: "Trade request declined.",
      canceled: "Trade request canceled."
    };

    res.render("trade-requests", {
      title: "Trade Requests",
      receivedRequests,
      sentRequests,
      successMessage: successMessages[req.query.message] || ""
    });
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not load trade requests.");
  }
});

app.post("/trade-requests/:id/accept", requiredLogin, async(req, res) => {
  try {
    const tradeRequest = await TradeRequest.findById(req.params.id);

    if(!tradeRequest) {
      return res.status(404).send("Trade request not found.");
    }

    const listing = await DiceListing.findById(tradeRequest.listing);

    if(!listing) {
      return res.status(404).send("Listing not found.");
    }

    if(listing.owner.toString() !== req.session.user.id) {
      return res.status(403).send("Only the listing owner can accept this request.");
    }

    if(tradeRequest.status !== "Pending") {
      return res.status(400).send("Only pending requests can be accepted.");
    }

    if(listing.status !== "Available") {
      return res.status(400).send("Only requests for available listings can be accepted.");
    }

    tradeRequest.status = "Accepted";
    listing.status = "Pending";

    await Promise.all([
      tradeRequest.save(),
      listing.save()
    ]);

    res.redirect("/trade-requests?message=accepted");
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not accept trade request.");
  }
});

app.post("/trade-requests/:id/decline", requiredLogin, async(req, res) => {
  try {
    const tradeRequest = await TradeRequest.findById(req.params.id);

    if(!tradeRequest) {
      return res.status(404).send("Trade request not found.");
    }

    if(tradeRequest.owner.toString() !== req.session.user.id) {
      return res.status(403).send("Only the listing owner can decline this request.");
    }

    if(tradeRequest.status !== "Pending") {
      return res.status(400).send("Only pending requests can be declined.");
    }

    tradeRequest.status = "Declined";
    await tradeRequest.save();

    res.redirect("/trade-requests?message=declined");
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not decline trade request.");
  }
});

app.post("/trade-requests/:id/cancel", requiredLogin, async(req, res) => {
  try {
    const tradeRequest = await TradeRequest.findById(req.params.id);

    if(!tradeRequest) {
      return res.status(404).send("Trade request not found.");
    }

    if(tradeRequest.requester.toString() !== req.session.user.id) {
      return res.status(403).send("Only the requester can cancel this request.");
    }

    if(tradeRequest.status !== "Pending") {
      return res.status(400).send("Only pending requests can be canceled.");
    }

    tradeRequest.status = "Canceled";
    await tradeRequest.save();

    res.redirect("/trade-requests?message=canceled");
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not cancel trade request.");
  }
});

app.get("/listings/:id/edit", requiredLogin, requireListingOwner, (req, res) => {
  res.render("edit-listing", {
    title: "Edit Listing",
    listing: req.listing
  });
});
app.post("/listings/:id/edit", requiredLogin, requireListingOwner, async(req, res) => {
  try {
    const {
      title,
      description,
      diceType,
      material,
      color,
      condition,
      numberOfDice,
      preferredTrade,
      location,
      imageUrl,
      tags,
      status
    } = req.body;

    const tagArray = tags ? tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    await DiceListing.findByIdAndUpdate(req.params.id, {
      title,
      description,
      diceType,
      material,
      color,
      condition,
      numberOfDice,
      preferredTrade,
      location,
      imageUrl,
      tags: tagArray,
      status
    });

    res.redirect(`/listings/${req.params.id}`);
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not edit listing.");
  }
});

app.post("/listings/:id/delete", requiredLogin, requireListingOwner, async(req, res) => {
  try {
    await DiceListing.findByIdAndDelete(req.params.id);
    res.redirect("/profile");
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not delete listing.");
  }
});

app.get("/profile", requiredLogin, async(req, res) => {
  try {
    // get the user. if no user, bring them to log in
    const user = await User.findById(req.session.user.id);

    if(!user) {
      return res.redirect("/login");
    }

    // get listings owned by this user
    const userListings = await DiceListing.find({
      owner: req.session.user.id
    }).sort({ createdAt: -1 });

    const reviews = await Review.find({ reviewedUser: user._id })
      .populate("reviewer listing")
      .sort({ createdAt: -1 });

    res.render("profile", {
      title: "Profile",
      user,
      userListings,
      reviews,
      isOwnProfile: true
    });
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not load profile.")
  }
});

app.get("/users/:id", async(req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if(!user) {
      return res.status(404).send("User not found.");
    }

    const userListings = await DiceListing.find({ owner: user._id })
      .sort({ createdAt: -1 });

    const reviews = await Review.find({ reviewedUser: user._id })
      .populate("reviewer listing")
      .sort({ createdAt: -1 });

    res.render("profile", {
      title: `${user.username}'s Profile`,
      user,
      userListings,
      reviews,
      isOwnProfile: Boolean(req.session.user && req.session.user.id === user._id.toString())
    });
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not load user profile.");
  }
});

app.get("/profile/edit", requiredLogin, async(req, res) => {
  try{
    // get the user. if no user, bring them to log in
    const user = await User.findById(req.session.user.id);

    if(!user) {
      return res.redirect("/login");
    }

    res.render("edit-profile", {
      title: "Edit Profile",
      user
    });
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not load edit profile page.");
  }
});
app.post("/profile/edit", requiredLogin, async(req, res) => {
  try {
    const { bio, location, profileImageUrl } = req.body;

    await User.findByIdAndUpdate(req.session.user.id, {
      bio,
      location,
      profileImageUrl
    });

    res.redirect("/profile")
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not update profile.");
  }
});

app.get("/login", (req, res) => {res.render("login", { title: "Log In" })});
app.post("/login", async(req, res) => {
  try {
    const { email, password } = req.body;

    // find the user
    const user = await User.findOne({ email });

    if(!user) {
      return res.status(400).send("Invalid email or password.");
    }

    // check if the passwords HASHES match
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if(!passwordMatches) {
      return res.status(400).send("Invalid email or password.");
    }

    const twoFactorCode = crypto.randomInt(100000, 1000000).toString();

    delete req.session.user;
    req.session.pending2FA = {
      userId: user._id.toString(),
      code: twoFactorCode,
      expiresAt: Date.now() + (5 * 60 * 1000)
    };

    console.log(`[2FA demo] Code for ${user.email}: ${twoFactorCode}`);

    return res.redirect("/verify-2fa");
  } catch(error) {
    console.error(error);
    return res.status(500).send("Log in failed.");
  }
});

app.get("/verify-2fa", (req, res) => {
  if(req.session.user) {
    return res.redirect("/profile");
  }

  if(!req.session.pending2FA) {
    return res.redirect("/login");
  }

  res.render("verify-2fa", { title: "Verify Two-Factor Code" });
});

app.post("/verify-2fa", async(req, res) => {
  try {
    const pending2FA = req.session.pending2FA;

    if(!pending2FA) {
      return res.status(400).send("No two-factor verification is pending. Please log in again.");
    }

    if(Date.now() > pending2FA.expiresAt) {
      delete req.session.pending2FA;
      return res.status(400).send("Your two-factor code has expired. Please log in again.");
    }

    const submittedCode = typeof req.body?.code === "string" ? req.body.code.trim() : "";

    if(!/^\d{6}$/.test(submittedCode) || submittedCode !== pending2FA.code) {
      return res.status(400).send("Invalid two-factor code.");
    }

    const user = await User.findById(pending2FA.userId);

    if(!user) {
      delete req.session.pending2FA;
      return res.status(404).send("User not found. Please log in again.");
    }

    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email
    };
    delete req.session.pending2FA;

    return res.redirect("/profile");
  } catch(error) {
    console.error(error);
    return res.status(500).send("Two-factor verification failed.");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Logout failed.");
    }

    res.redirect("/");
  });
});

app.get("/register", (req, res) => {res.render("register", { title: "Register" })});
app.post("/register", async(req, res) => {
  try {
    const { username, email, location, bio, password, confirmPassword } = req.body;

    // Do basic error checking/cleaning
    if(password !== confirmPassword) {
      return res.status(400).send("Passwords do not match.");
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if(existingUser) {
      return res.status(400).send("A user with email or username already exists.");
    }

    // Make the hash and do NOT store the actual password
    const passwordHash = await bcrypt.hash(password, 10);

    // Make the actual User object
    await User.create({
      username,
      email,
      location,
      bio,
      passwordHash
    });

    // Send them to the login page!
    return res.redirect("/login");
  } catch(error) {
    console.error(error);
    res.status(500).send("Registration failed.")
  }
});

// Very temp route
app.get("/db-test", async (req, res) => {
  try {
    const count = await DiceListing.countDocuments();
    res.send(`Database works. Dice listings count: ${count}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Database test failed");
  }
});

module.exports = app;
