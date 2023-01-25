import express from "express";
import { googleOauthHandler } from "../controllers/oAuth";
const authRouter = express.Router();

authRouter.route("/api/session/oauth/google").get(googleOauthHandler);

export { authRouter };
