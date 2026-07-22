const express = require("express");
const path = require("path");
const DiceListing = require("./models/DiceListings")
const bcrypt = require("bcrypt")
const User = require("./models/User");
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

// Temporary routes
app.get("/", (req, res) => {res.render("home", { title: "DiceShare" })});

app.get("/listings", (req, res) => {res.render("listings", { title: "Browse Listings" })});
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
      prefferredTrade,
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
      prefferredTrade,
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

app.get("/listings/:id", (req, res) => {res.render("listing-detail", { title: "Listing Detail" })});

app.get("/profile", requiredLogin, async(req, res) => {
  try {
    // get the user. if no user, bring them to log in
    const user = await User.findById(req.session.user.id);

    if(!user) {
      return res.redirect("/login");
    }

    res.render("profile", {
      title: "Profile",
      user
    });
  } catch(error) {
    console.error(error);
    res.status(500).send("Could not load profile.")
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

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    }

    return res.redirect("/profile");
  } catch(error) {
    console.error(error);
    return res.status(500).send("Log in failed.");
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