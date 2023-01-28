import { NextFunction, Request, Response } from "express";

const { clientModel } = require("../models/Client");
const { userModel } = require("../models/User");

const { verifyJwt } = require("../utils/Jwt");

const deserializeUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization as string;

    // console.log(header);
    if (!header) {
      res.status(401).json({ status: "failure", message: "Unauthorized request" });
    }

    const token = header.split("Bearer ")[1];

    const { decoded, expired } = verifyJwt(token);

    const user = await userModel.findOne({ _id: decoded.userId });

    // console.log(user);

    if (!user) {
      res
        .status(500)
        .json({ status: "failure", message: "No user present while checking token" });
    }

    if (decoded) {
      res.locals.user = user;
      return next();
    }

    next();
  } catch (error) {
    console.log(error);
  }
};

export { deserializeUser };
