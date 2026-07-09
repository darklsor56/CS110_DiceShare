import express from "express";
import path from "path";
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));