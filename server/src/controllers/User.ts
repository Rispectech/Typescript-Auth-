import { NextFunction, Request, Response } from "express";

const bcrypt = require("bcrypt");
const { userModel } = require("../models/User");

const { otpVerificationModel } = require("../models/VerifiedOtp");
const { sendOtpVerificationEmail } = require("../utils/Mail");
const { createSession } = require("../services/Session");
const {
  createUser,
  findUser,
  sendResetEmail,
  validateUserPassword,
  upsertUser,
} = require("../services/User");
// const { CreateErrorClass } = require("../utils/error");
const { signJwt } = require("../utils/Jwt");
import resetPasswordModel from "../models/ResetPassword";
const { compareHash, generateHash } = require("../utils/bycrpt");

const accessTokenCookieOptions = {
  maxAge: 900000, // 15 mins
  httpOnly: true,
  domain: "localhost",
  path: "/",
  sameSite: "lax",
  secure: false,
};

const refreshTokenCookieOptions = {
  ...accessTokenCookieOptions,
  maxAge: 3.154e10, // 1 year
};

const userSignupHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    const db_user = await findUser({ email: body.email });

    if (db_user) {
      return res.status(500).json({ status: "failure", message: "User already present" });
    }
    const user = await createUser(body);

    const verifiedOtp = await sendOtpVerificationEmail(user.email, user._id);

    console.log(verifiedOtp);
    const user_obj = user.toObject();
    delete user_obj.password;
    // console.log(user_obj);
    res.status(200).json({ status: "success", data: user_obj });
  } catch (error) {
    console.log(error);
  }
};

const userLoginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userBody = req.body;
    const user = await userModel.findOne({ email: userBody.email });

    if (!user) return res.status(500).json({ status: "failure", message: "Invalid Email" });

    if (!userBody.password) {
      return res.status(500).json({ status: "failure", message: "Password is required" });
    }
    if (!validateUserPassword(userBody.password, user))
      return res.status(500).json({ status: "failure", message: "Invalid Password" });

    const session = createSession(user._id, req.get("user-agent") || "");

    const accessToken = signJwt(
      {
        userId: user._id,
        session: session._id,
      },
      {
        expiresIn: process.env.ACCESS_TOKEN_TTL,
      }
    );

    const refreshToken = signJwt(
      {
        userId: user._id,
        session: session._id,
      },
      {
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      }
    );

    // res.cookie("accessToken", accessToken, accessTokenCookieOptions);

    // res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    return res.status(200).json({ status: "success", data: { accessToken, refreshToken } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "failure", message: "couldnt create session" });
  }
};

const verifyOtpHandler = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user._id;
    const body_otp = req.body.otp;

    if (!userId && !body_otp) {
      return res.status(500).json({
        status: "failure",
        message: "Empty otp is not allowed",
      });
    }

    const userOtpRecords = await otpVerificationModel.find({ entityId: userId });
    if (userOtpRecords.length < 0) {
      res.status(500).json({
        status: "failure",
        message: "Account Record doesnt exist . Please login or signin",
      });
    }

    console.log(userOtpRecords);

    const { expiresAt, otp } = userOtpRecords[0];

    // if (expiresAt < Date.now()) {
    //   await otpVerificationModel.deleteMany({ entityId: userId });
    //   return res.status(500).json({
    //     status: "failure",
    //     message: "Code has expired . Please request again",
    //   });
    // }

    console.log(body_otp, otp);

    const validOtp = await bcrypt.compare(body_otp, otp);

    console.log(validOtp);

    if (!validOtp) {
      return res.status(500).json({
        status: "failure",
        message: "Invalid OTP",
      });
    }

    await userModel.updateOne({ _id: userId }, { verified: true });
    await otpVerificationModel.deleteMany({ _id: userId });
    return res.status(200).json({
      status: "success",
      message: "User is verified",
    });
  } catch (error) {
    console.log(error);
  }
};

const resendOtpHandler = async (req: Request, res: Response) => {
  try {
    const { _id, email } = res.locals.user;

    await otpVerificationModel.deleteMany({ entityId: _id });
    const data = await sendOtpVerificationEmail(email, _id);
    res.status(200).json({
      status: "success",
      data,
    });
  } catch (error) {}
};

const sendResetUserPasswordEmailHandler = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const redirectUrl = req.body.redirectUrl;

    if (!user.verified) {
      res.status(500).json({ status: "failure", message: "User not verified" });
    }

    const newPasswordReturn = await sendResetEmail(user, redirectUrl);
    res.status(200).json({
      status: "Pending",
      message: "Resend Link sent",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "failure", message: "couldnt reset password" });
  }
};

const resetUserPasswordHandler = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user._id;
    const { resetSequence, newPassword } = req.body;

    const resetPasswordObject: resetPasswordModelType[] = await resetPasswordModel.find({
      entityId: userId,
    });

    if ((!resetPasswordObject.length as unknown as number) > 0) {
      return res
        .status(500)
        .json({ status: "failure", message: "Password Request not found" });
    }

    if (resetPasswordObject[0].expiresAt < Date.now()) {
      resetPasswordModel.deleteOne({ entityId: userId });
      return res.status(500).json({ status: "failure", message: "Password Request expired" });
    }

    const hashedResetSequence = resetPasswordObject[0].resetString;
    const token = await compareHash(resetSequence, hashedResetSequence);
    console.log(token);

    if (!token) {
      return res.status(500).json({ status: "failure", message: "Invalid Token" });
    }

    const hashedNewPassword = await generateHash(newPassword);
    const updatedUser = await upsertUser(
      { _id: userId },
      { password: hashedNewPassword },
      { new: true }
    );

    if (!updatedUser) {
      res.status(500).json({ status: "failure", message: "Password couldnt be changes" });
    }

    await resetPasswordModel.deleteOne({ entityId: userId });
    res.status(200).json({ status: "success", message: "Password was changed" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: "failure", message: "Problem in reseting password" });
  }
};

// testing controller

export {
  userSignupHandler,
  userLoginHandler,
  verifyOtpHandler,
  resendOtpHandler,
  sendResetUserPasswordEmailHandler,
  resetUserPasswordHandler,
};
