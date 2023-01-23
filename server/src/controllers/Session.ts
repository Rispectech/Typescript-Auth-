import { NextFunction, Request, Response } from "express";
import { userModel } from "../models/User";
import { createSession, findSession, updateSession } from "../services/Session";
import { validateUserPassword } from "../services/User";
import { signJwt } from "../utils/Jwt";

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

const createSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userBody = req.body;
    const user = await userModel.findOne({ email: userBody.email });

    if (!user) return res.status(500).json({ status: "failure", message: "Invalid Email" });

    if (!userBody.password) {
      return res.status(500).json({ status: "failure", message: "Invalid Password" });
    }
    if (!validateUserPassword(userBody.password, user))
      res.status(500).json({ status: "failure", message: "Invalid Password" });

    const session = await createSession(
      user._id as unknown as string,
      req.get("user-agent") || ""
    );

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

const getSessionHandler = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user._id;
    // console.log("controller", userId);
    const sessions = await findSession({ user: userId, valid: true });
    return res.status(200).json({ status: "success", data: sessions });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "failure", message: "couldnt get session" });
  }
};

const deleteSessionHandler = async (req: Request, res: Response) => {
  try {
    const sessionId = res.locals.user._id;
    await updateSession({ _id: sessionId }, { valid: false });
    return res.status(200).json({
      status: "success",
      data: {
        accessToken: null,
        refreshToken: null,
      },
    });
  } catch (error) {}
};

export { getSessionHandler, createSessionHandler, deleteSessionHandler };
