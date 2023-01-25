import express from "express";
import { getSessionHandler, deleteSessionHandler } from "../controllers/Session";
import {
  verifyOtpHandler,
  resendOtpHandler,
  userSignupHandler,
  userLoginHandler,
  sendResetUserPasswordEmailHandler,
  resetUserPasswordHandler,
} from "../controllers/User";
import { deserializeUser } from "../middleware/Auth";
import { checkSignup } from "../middleware/Signup";
const userRouter = express.Router();

userRouter.route("/api/user/register").post(checkSignup, userSignupHandler);
userRouter.route("/api/user/login").post(userLoginHandler);
userRouter.route("/api/sessions").get(deserializeUser, getSessionHandler);
userRouter.route("/api/user/logout").delete(deserializeUser, deleteSessionHandler);
userRouter.route("/api/user/verifyOtp").post(deserializeUser, verifyOtpHandler);
userRouter.route("/api/user/resendOtp").get(deserializeUser, resendOtpHandler);
userRouter
  .route("/api/user/requestPasswordReset")
  .post(deserializeUser, sendResetUserPasswordEmailHandler);

userRouter.route("/api/user/resetPassword").post(deserializeUser, resetUserPasswordHandler);

export { userRouter };
