const express = require("express");
const path = require("path");
const DiceListing = require("./models/DiceListings")
const bcrypt = require("bcrypt")
const User = require("./models/User");
const connectDB = require("./config/db")
const session = require("express-session")

require("dotenv").config();
connectDB();

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
    secret: false,
    saveUninitialized: false
  })
);
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
});

// Temporary routes
app.get("/", (req, res) => {res.render("home", { title: "DiceShare" })});
app.get("/listings", (req, res) => {res.render("listings", { title: "Browse Listings" })});
app.get("/listings/new", (req, res) => {res.render("create-listing", { title: "Create Listing" })});
app.get("/listings/:id", (req, res) => {res.render("listing-detail", { title: "Listing Detail" })});
app.get("/profile", (req, res) => {res.render("profile", { title: "Profile" })});

app.get("/login", (req, res) => {res.render("login", { title: "Log In" })});
app.post("/login", async(req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if(!user) {
      return res.status(400).send("Invalid email or password.");
    }
  }
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