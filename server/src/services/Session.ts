import { FilterQuery, UpdateQuery } from "mongoose";
import { sessionModel } from "../models/Session";

const { verifyJwt } = require("../utils/Jwt");

const createSession = async (userId: string, userAgent: string) => {
  const session = await sessionModel.create({ user: userId, userAgent });
  return session.toJSON();
};

const findSession = async (query: FilterQuery<typeof sessionModel>) => {
  return await sessionModel.find(query);
};

const updateSession = async (
  query: FilterQuery<typeof sessionModel>,
  update: UpdateQuery<typeof sessionModel>
) => {
  return await sessionModel.updateOne(query, update);
};

const reIssueAccessToken = async (refreshToken: string) => {
  const decoded = verifyJwt(refreshToken);

  if (!decoded && !decoded._id) return false;

  const session = await sessionModel.findById(decoded, "session");

  if (!session || !session.valid) return false;

  const user = await findUser({ _id: session.user });

  if (!user) return false;

  const accessToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: process.env.ACESS_TOKEN_TTL } // 15 minutesp
  );

  return accessToken;
};

export { createSession, findSession, updateSession, reIssueAccessToken };
