import express from "express";
import { getSessionHandler, deleteSessionHandler } from "../controllers/Session";
import {
  verifyOtpHandler,
  resendOtpHandler,
  clientSignupHandler,
  clientLoginHandler,
  sendResetClientPasswordEmailHandler,
  resetClientPasswordHandler,
} from "../controllers/Admin";
import { deserializeClient } from "../middleware/Auth";
import { checkSignup } from "../middleware/Signup";
const clientRouter = express.Router();

clientRouter.route("/api/client/register").post(checkSignup, clientSignupHandler);
clientRouter.route("/api/client/login").post(clientLoginHandler);
clientRouter.route("/api/sessions").get(deserializeClient, getSessionHandler);
clientRouter.route("/api/client/logout").delete(deserializeClient, deleteSessionHandler);
clientRouter.route("/api/client/verifyOtp").post(deserializeClient, verifyOtpHandler);
clientRouter.route("/api/client/resendOtp").get(deserializeClient, resendOtpHandler);
clientRouter.post(
  "/api/client/requestPasswordReset",
  deserializeClient,
  sendResetClientPasswordEmailHandler
);

clientRouter
  .route("/api/client/resetPassword")
  .post(deserializeClient, resetClientPasswordHandler);

module.exports = {
  clientRouter,
};
