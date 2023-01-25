import bcrypt from "bcrypt";
import { v4 } from "uuid";

import resetPasswordModel from "../models/ResetPassword";
import { clientModel, clientSchema, UserDocument } from "../models/Client";
import { sendEmail, getHrTime } from "../utils/Mail";
import { FilterQuery, UpdateQuery } from "mongoose";
const findClient = async (query: FilterQuery<UserDocument>) => {
  return await clientModel.findOne(query);
};

const createClient = async (ClientBody: { email: string; password: string }) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(ClientBody.password, salt);
  return await clientModel.create({ ...ClientBody, password: hash });
};

const validateClientPassword = (password: string, Client: UserDocument) => {
  const checkPassword = bcrypt.compareSync(password, Client.password);
  return checkPassword;
};

const upsertClient = async (
  query: FilterQuery<UserDocument>,
  update: UpdateQuery<UserDocument>,
  options: {}
) => {
  return await clientModel.findByIdAndUpdate(query, update, options);
};

const sendResetEmail = async (Client: UserDocument, redirectUrl: string) => {
  const redirectSequence = v4();
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(redirectSequence, saltRounds);
    const newPasswordReset = await resetPasswordModel.create({
      entityId: Client._id,
      resetString: hash,
      createdAt: Date.now(),
      expiresAt: getHrTime(),
    });

    await sendEmail(
      Client.email,
      "Password Reset",
      `<p>We heard that you lost your password</p> 
      <p> Dont worry , use the link below to reset it </p>
      <p>  Press <a href = ${
        redirectUrl + "/" + Client._id + "/" + redirectSequence
      }> here</a> to proceed</p>
      <p>This otp will expire after an hour</p>
      `
    );

    return newPasswordReset;
  } catch (error) {
    console.log(error);
  }
};

export { upsertClient, createClient, validateClientPassword, findClient, sendResetEmail };
