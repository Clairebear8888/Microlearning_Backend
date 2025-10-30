const router = require("express").Router();
const UserModel = require("../models/User.model");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../app");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

router.post("/signup", async (req, res) => {
  try {
    const regex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;

    if (!req.body.password.match(regex)) {
      res.status(403).json({
        errorMessage: "password is not strong enough",
      });
    }

    const foundUserWithEmail = await UserModel.findOne({
      email: req.body.email,
    });

    if (foundUserWithEmail) {
      res.status(403).json({ errorMessage: "email taken" });
    } else {
      const theSalt = bcryptjs.genSaltSync(12);
      const hashedPassword = bcryptjs.hashSync(req.body.password, theSalt);
      const createdUser = await UserModel.create({
        ...req.body,
        password: hashedPassword,
      });
      const foundedUser = await UserModel.findById(createdUser._id).select(
        "username"
      );
      console.log("user created", createdUser);
      res.status(201).json(foundedUser);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "err in sign up", detail: err });
  }
});

router.post("/login", async (req, res) => {
  try {
    const foundUser = await UserModel.findOne({ email: req.body.email });
    if (!foundUser) {
      res.status(403).json({ errorMessage: "user coes not exist" });
    } else {
      const doesPasswordMatch = bcryptjs.compareSync(
        req.body.password,
        foundUser.password
      );
      console.log("does password match?", doesPasswordMatch);
      if (doesPasswordMatch) {
        const payLoad = { _id: foundUser._id, username: foundUser.username };
        const authToken = jwt.sign(payLoad, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        });
        res
          .status(200)
          .json({ Message: "you are login", authToken: authToken });
      } else {
        res.status(403).json({ errorMessage: "password wrong" });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

router.get("/verify", isAuthenticated, async (req, res) => {
  res
    .status(200)
    .json({ message: "your token is verified", currentUser: req.payLoad });
});

router.get("/profile/:userId", async (req, res) => {
  try {
    const userDataInDB = await UserModel.findById(req.params.userId).select(
      "username email _id"
    );
    res.status(200).json(userDataInDB);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "err in sign up", detail: err });
  }
});

module.exports = router;
