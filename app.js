const express = require("express");
const path = require("path");
const DiceListing = require("./models/DiceListings")

const app = express();

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Temporary routes
app.get("/", (req, res) => {res.render("home", { title: "DiceShare" })});
app.get("/listings", (req, res) => {res.render("listings", { title: "Browse Listings" })});
app.get("/listings/new", (req, res) => {res.render("create-listing", { title: "Create Listing" })});
app.get("/listings/:id", (req, res) => {res.render("listing-detail", { title: "Listing Detail" })});
app.get("/profile", (req, res) => {res.render("profile", { title: "Profile" })});
app.get("/login", (req, res) => {res.render("login", { title: "Log In" })});
app.get("/register", (req, res) => {res.render("register", { title: "Register" })});

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