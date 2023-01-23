const express = require("express");
const { googleOauthHandler } = require("../controllers/oAuth");
const authRouter = express.Router();

authRouter.route("/api/session/oauth/google").get(googleOauthHandler);

module.exports = {
  authRouter,
};
