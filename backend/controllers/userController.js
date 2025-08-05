// backend/controllers/userController.js
const User = require("../models/User");

const registerOrGetUser = async (req, res) => {
  const { googleId, name, email, photo } = req.body;
  try {
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({ googleId, name, email, photo });
    }
    res.status(200).json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "User login/register failed", error: err.message });
  }
};

module.exports = { registerOrGetUser };
