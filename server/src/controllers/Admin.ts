import { NextFunction, Request, Response } from "express";
import { resetPasswordModelType } from "../type";

import bcrypt from "bcrypt";
import { clientModel } from "../models/Client";

import { otpVerificationModel } from "../models/VerifiedOtp";
import { sendOtpVerificationEmail } from "../utils/Mail";
import { createSession } from "../services/Session";
import {
  createClient,
  findClient,
  sendResetEmail,
  validateClientPassword,
  upsertClient,
} from "../services/Client";
import { signJwt } from "../utils/Jwt";
import resetPasswordModel from "../models/ResetPassword";
import { compareHash, generateHash } from "../utils/bycrpt";

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

const clientSignupHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    const db_Client = await findClient({ email: body.email });

    if (db_Client) {
      return res.status(500).json({
        status: "failure",
        message: "User already present",
      });
    }
    const Client = await createClient(body);

    const Client_obj = Client.toObject();
    delete Client_obj.password;
    // console.log(Client_obj);
    res.status(200).json({ status: "success", data: Client_obj });
  } catch (error) {
    console.log(error);
  }
};

const clientLoginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ClientBody = req.body;
    const Client = await clientModel.findOne({ email: ClientBody.email });

    if (!Client) return res.status(500).json({ status: "failure", message: "Invalid Email" });

    if (!ClientBody.password) {
      return res.status(500).json({
        status: "failure",
        message: "User already present",
      });
    }
    if (!validateClientPassword(ClientBody.password, Client))
      return res.status(500).json({ status: "failure", message: "Invalid Password" });

    const session = await createSession(Client._id, req.get("Client-agent") || "");

    const accessToken = signJwt(
      {
        ClientId: Client._id,
        session: session._id,
      },
      {
        expiresIn: process.env.ACCESS_TOKEN_TTL,
      }
    );

    const refreshToken = signJwt(
      {
        ClientId: Client._id,
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
    const ClientId = res.locals.Client._id;
    const body_otp = req.body.otp;

    if (!ClientId && !body_otp) {
      return res.status(500).json({
        status: "failure",
        message: "Empty otp is not allowed",
      });
    }

    const ClientOtpRecords = await otpVerificationModel.find({ entityId: ClientId });
    if (ClientOtpRecords.length < 0) {
      res.status(500).json({
        status: "failure",
        message: "Account Record doesnt exist . Please login or signin",
      });
    }

    console.log(ClientOtpRecords);

    const { expiresAt, otp } = ClientOtpRecords[0];

    // if (expiresAt < Date.now()) {
    //   await otpVerificationModel.deleteMany({ entityId: ClientId });
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

    await clientModel.updateOne({ _id: ClientId }, { verified: true });
    await otpVerificationModel.deleteMany({ _id: ClientId });
    return res.status(200).json({
      status: "success",
      message: "Client is verified",
    });
  } catch (error) {
    console.log(error);
  }
};

const resendOtpHandler = async (req: Request, res: Response) => {
  try {
    const { _id, email } = res.locals.Client;

    await otpVerificationModel.deleteMany({ entityId: _id });
    const data = await sendOtpVerificationEmail(email, _id);
    res.status(200).json({
      status: "success",
      data,
    });
  } catch (error) {}
};

const sendResetClientPasswordEmailHandler = async (req: Request, res: Response) => {
  try {
    const Client = res.locals.Client;
    const redirectUrl = req.body.redirectUrl;

    if (!Client.verified) {
      res.status(500).json({ status: "failure", message: "Client not verified" });
    }

    const newPasswordReturn = await sendResetEmail(Client, redirectUrl);
    res.status(200).json({
      status: "Pending",
      message: "Resend Link sent",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "failure", message: "couldnt reset password" });
  }
};

const resetClientPasswordHandler = async (req: Request, res: Response) => {
  try {
    const ClientId = res.locals.Client._id;
    const { resetSequence, newPassword } = req.body;

    const resetPasswordObject: resetPasswordModelType[] = await resetPasswordModel.find({
      entityId: ClientId,
    });

    if ((!resetPasswordObject.length as unknown as number) > 0) {
      return res
        .status(500)
        .json({ status: "failure", message: "Password Request not found" });
    }

    const hashedResetSequence = resetPasswordObject[0].resetString;
    const token = await compareHash(resetSequence, hashedResetSequence);
    console.log(token);

    if (!token) {
      return res.status(500).json({ status: "failure", message: "Invalid Token" });
    }

    const hashedNewPassword = await generateHash(newPassword);
    const updatedClient = await upsertClient(
      { _id: ClientId },
      { password: hashedNewPassword },
      { new: true }
    );

    if (!updatedClient) {
      res.status(500).json({ status: "failure", message: "Password couldnt be changes" });
    }

    await resetPasswordModel.deleteOne({ entityId: ClientId });
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
  clientSignupHandler,
  clientLoginHandler,
  verifyOtpHandler,
  resendOtpHandler,
  sendResetClientPasswordEmailHandler,
  resetClientPasswordHandler,
};
