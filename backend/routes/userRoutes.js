// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { registerOrGetUser } = require("../controllers/userController");

router.post("/auth", registerOrGetUser);

module.exports = router;
